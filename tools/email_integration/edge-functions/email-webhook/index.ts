// =============================================================================
// E-Mail Webhook - Microsoft Graph Change Notifications
// Version: 3.1 - 2026-01-13
// =============================================================================
// Empfaengt Notifications von Microsoft Graph wenn neue E-Mails ankommen
// oder E-Mails gesendet werden.
//
// Aenderungen v3.2:
// - ImmutableId Header fuer stabile IDs bei Ordner-Verschiebungen
//
// Aenderungen v3.1:
// - Subscription-Validierung gegen email_subscriptions Tabelle
// - Unbekannte subscriptionIds werden abgelehnt
//
// Aenderungen v3.0:
// - Composite Unique Constraint (email_postfach, email_message_id)
// - Processing-Status Logic (pending->queued->processing->done/error)
// - Nur process-email triggern wenn status != done
//
// Aenderungen v2.0:
// - ValidationToken Handling verbessert (Change 1)
// - Security: clientState + x-webhook-secret Header (Change 2)
// - Background Processing fuer schnelle Antwort (Change 3)
// - Upsert statt Insert fuer Idempotenz (Change 4)
// =============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Types for Microsoft Graph Notifications
interface ChangeNotification {
  subscriptionId: string;
  subscriptionExpirationDateTime: string;
  changeType: "created" | "updated" | "deleted";
  resource: string;
  resourceData: {
    "@odata.type": string;
    "@odata.id": string;
    "@odata.etag": string;
    id: string;
  };
  clientState?: string;
  tenantId: string;
}

interface NotificationPayload {
  value: ChangeNotification[];
}

// Environment variables
const AZURE_TENANT_ID = Deno.env.get("AZURE_TENANT_ID");
const AZURE_CLIENT_ID = Deno.env.get("AZURE_CLIENT_ID");
const AZURE_CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET");
const EMAIL_WEBHOOK_CLIENT_STATE = Deno.env.get("EMAIL_WEBHOOK_CLIENT_STATE") || "js-fenster-email-webhook-secret";
const EMAIL_WEBHOOK_SECRET = Deno.env.get("EMAIL_WEBHOOK_SECRET"); // Optional additional header secret
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// =============================================================================
// Microsoft Graph Authentication
// =============================================================================

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error("Azure credentials not configured");
  }

  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: AZURE_CLIENT_ID,
      client_secret: AZURE_CLIENT_SECRET,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data: TokenResponse = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

// =============================================================================
// Email Processing
// =============================================================================

interface EmailMessage {
  id: string;
  internetMessageId: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: string;
    content: string;
  };
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
  ccRecipients: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
  receivedDateTime: string;
  sentDateTime: string;
  hasAttachments: boolean;
  importance: string;
  isRead: boolean;
  flag: {
    flagStatus: string;
  };
  categories: string[];
}

async function fetchEmailDetails(
  resource: string,
  accessToken: string
): Promise<EmailMessage> {
  // resource format: /users/{user}/messages/{messageId}
  const url = `https://graph.microsoft.com/v1.0${resource}?$select=id,internetMessageId,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,hasAttachments,importance,isRead,flag,categories`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      // v3.2: Request ImmutableId for stable IDs across folder moves
      Prefer: 'IdType="ImmutableId"',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch email: ${error}`);
  }

  return await response.json();
}

function extractUserFromResource(resource: string): string {
  // Extract user email from resource like "/users/info@js-fenster.de/messages/..."
  const match = resource.match(/\/users\/([^\/]+)/);
  return match ? match[1] : "unknown";
}

function extractFolderFromResource(resource: string): "eingehend" | "ausgehend" {
  // Check if it's from sent items folder
  if (resource.toLowerCase().includes("sentitems")) {
    return "ausgehend";
  }
  return "eingehend";
}

// =============================================================================
// Supabase Storage
// =============================================================================

async function saveEmailToDatabase(
  email: EmailMessage,
  postfach: string,
  richtung: "eingehend" | "ausgehend"
): Promise<{ id: string } | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials not configured");
  }

  // Convert recipients to JSONB format
  const anListe = email.toRecipients.map((r) => ({
    email: r.emailAddress.address,
    name: r.emailAddress.name,
  }));

  const ccListe = email.ccRecipients.map((r) => ({
    email: r.emailAddress.address,
    name: r.emailAddress.name,
  }));

  // Extract plain text from HTML body if needed
  let bodyText = "";
  if (email.body.contentType === "text") {
    bodyText = email.body.content;
  } else {
    // Simple HTML to text conversion (basic)
    bodyText = email.body.content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  const documentData = {
    dokument_typ: "email",
    kategorie: "Sonstiges_Eingehend", // Will be updated by GPT later

    // E-Mail Identifikation
    email_message_id: email.id,
    email_conversation_id: email.conversationId,
    email_internet_message_id: email.internetMessageId,

    // E-Mail Metadaten
    email_richtung: richtung,
    email_postfach: postfach,

    // Absender
    email_von_email: email.from?.emailAddress?.address,
    email_von_name: email.from?.emailAddress?.name,

    // Empfaenger
    email_an_liste: anListe,
    email_cc_liste: ccListe,

    // Inhalt
    email_betreff: email.subject,
    email_body_text: bodyText.substring(0, 50000), // Limit to 50k chars
    email_body_html: email.body.contentType === "html" ? email.body.content : null,

    // Zeitstempel
    email_empfangen_am: email.receivedDateTime,
    email_gesendet_am: email.sentDateTime,

    // Anhaenge
    email_hat_anhaenge: email.hasAttachments,

    // Status
    email_ist_gelesen: email.isRead,
    email_wichtigkeit: email.importance?.toLowerCase(),
    email_ms_kategorien: email.categories,
    email_ms_flag: email.flag,

    // Placeholder for document URL (required field)
    dokument_url: `email://${postfach}/${email.id}`,

    // Will be filled by GPT categorization later
    inhalt_zusammenfassung: email.bodyPreview?.substring(0, 500),

    // Processing status (v3.0)
    processing_status: "queued",
    processing_attempts: 0,
  };

  // Use UPSERT with composite unique constraint (v3.0)
  // ON CONFLICT on (email_postfach, email_message_id)
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?on_conflict=email_postfach,email_message_id`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify(documentData),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to save email: ${error}`);
  }

  const result = await response.json();
  const doc = result[0];
  const wasInserted = doc?.created_at === doc?.updated_at;
  const shouldProcess = doc?.processing_status !== "done";

  console.log(`Email ${wasInserted ? "inserted" : "updated"}: ${email.id} (process: ${shouldProcess})`);
  return { id: doc?.id, wasInserted, shouldProcess };
}

// =============================================================================
// Background Processing Helper (Change 3)
// =============================================================================

async function processNotificationInBackground(
  notification: ChangeNotification
): Promise<void> {
  try {
    // Get access token
    const accessToken = await getAccessToken();

    // Extract metadata from resource path
    const postfach = extractUserFromResource(notification.resource);
    const richtung = extractFolderFromResource(notification.resource);

    console.log(`[BG] Processing email for ${postfach} (${richtung})`);

    // Fetch full email details
    const email = await fetchEmailDetails(notification.resource, accessToken);

    // Save to database (upsert)
    const result = await saveEmailToDatabase(email, postfach, richtung);

    if (result) {
      console.log(`[BG] Email saved with ID: ${result.id}`);

      // Only trigger process-email if not already done (v3.0 idempotency)
      if (result.shouldProcess && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const processUrl = `${SUPABASE_URL}/functions/v1/process-email`;
          const processResponse = await fetch(processUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              document_id: result.id,
              email_message_id: email.id,
              postfach: postfach,
            }),
          });

          if (processResponse.ok) {
            console.log(`[BG] Triggered process-email for ${result.id}`);
          } else {
            console.warn(`[BG] process-email returned ${processResponse.status}`);
          }
        } catch (processError) {
          // Non-fatal: process-email might not be deployed yet
          console.log(`[BG] process-email not available: ${processError}`);
        }
      } else if (!result.shouldProcess) {
        console.log(`[BG] Email already processed - skipping process-email`);
      }
    }
  } catch (error) {
    console.error(`[BG] Error processing notification: ${error}`);
  }
}

// =============================================================================
// Security Validation (Change 2 + v3.1 DB validation)
// =============================================================================

// Cache for validated subscription IDs (to avoid repeated DB calls)
const validatedSubscriptions = new Set<string>();

async function isKnownSubscription(subscriptionId: string): Promise<boolean> {
  // Check cache first
  if (validatedSubscriptions.has(subscriptionId)) {
    return true;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // If DB not configured, skip this check (backwards compatibility)
    console.warn("[SEC] DB not configured - skipping subscription validation");
    return true;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/email_subscriptions?subscription_id=eq.${subscriptionId}&is_active=eq.true&select=subscription_id`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error(`[SEC] Failed to query subscriptions: ${response.status}`);
      // On error, allow (fail open for availability)
      return true;
    }

    const results = await response.json();
    const isKnown = results.length > 0;

    if (isKnown) {
      // Cache the valid subscription
      validatedSubscriptions.add(subscriptionId);
    }

    return isKnown;
  } catch (error) {
    console.error(`[SEC] Subscription validation error: ${error}`);
    // On error, allow (fail open for availability)
    return true;
  }
}

async function validateRequest(
  req: Request,
  notification?: ChangeNotification
): Promise<boolean> {
  // Check x-webhook-secret header if configured
  if (EMAIL_WEBHOOK_SECRET) {
    const headerSecret = req.headers.get("x-webhook-secret");
    if (headerSecret !== EMAIL_WEBHOOK_SECRET) {
      console.warn("[SEC] Invalid x-webhook-secret header");
      return false;
    }
  }

  // Check clientState in notification payload (Microsoft Graph sends this)
  if (notification && notification.clientState) {
    if (notification.clientState !== EMAIL_WEBHOOK_CLIENT_STATE) {
      console.warn(`[SEC] Invalid clientState: ${notification.clientState}`);
      return false;
    }
  }

  // v3.1: Check subscriptionId against email_subscriptions table
  if (notification && notification.subscriptionId) {
    const isKnown = await isKnownSubscription(notification.subscriptionId);
    if (!isKnown) {
      console.warn(`[SEC] Unknown subscriptionId: ${notification.subscriptionId}`);
      return false;
    }
  }

  return true;
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // ==========================================================================
  // Microsoft Graph Subscription Validation (Change 1)
  // ==========================================================================
  // When creating a subscription, Microsoft sends a GET request with
  // validationToken query parameter. We MUST echo it back as plain text.

  const validationToken = url.searchParams.get("validationToken");
  if (validationToken) {
    // This can come via GET or POST - handle both
    console.log("Subscription validation request received");
    return new Response(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // ==========================================================================
  // Handle POST - Change Notifications
  // ==========================================================================

  if (req.method === "POST") {
    try {
      const payload: NotificationPayload = await req.json();
      const notificationCount = payload.value?.length || 0;

      console.log(`Received ${notificationCount} notifications`);

      // Return 202 IMMEDIATELY, process in background (Change 3)
      // This prevents Microsoft Graph from timing out and retrying
      const validNotifications: ChangeNotification[] = [];

      for (const notification of payload.value || []) {
        // Security check (Change 2 + v3.1)
        if (!(await validateRequest(req, notification))) {
          console.warn("Security validation failed - skipping notification");
          continue;
        }

        // Only process "created" events (new emails)
        if (notification.changeType !== "created") {
          console.log(`Skipping ${notification.changeType} event`);
          continue;
        }

        validNotifications.push(notification);
      }

      // Schedule background processing for all valid notifications
      // Using EdgeRuntime.waitUntil to keep function alive after response
      if (validNotifications.length > 0) {
        const backgroundPromise = Promise.all(
          validNotifications.map((n) => processNotificationInBackground(n))
        );

        // @ts-ignore - EdgeRuntime.waitUntil is available in Supabase Edge Functions
        if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
          EdgeRuntime.waitUntil(backgroundPromise);
        } else {
          // Fallback: await directly (will delay response but works)
          await backgroundPromise;
        }
      }

      // Always return 202 Accepted to Microsoft
      return new Response(
        JSON.stringify({
          status: "accepted",
          received: notificationCount,
          processing: validNotifications.length,
        }),
        {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error(`Webhook error: ${error}`);
      // Still return 202 to prevent Microsoft from retrying
      return new Response(
        JSON.stringify({ status: "accepted", error: String(error) }),
        {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // ==========================================================================
  // Health Check / Info (GET without validationToken)
  // ==========================================================================

  return new Response(
    JSON.stringify({
      service: "email-webhook",
      version: "3.2.0",
      status: "ready",
      configured: {
        azure: !!(AZURE_TENANT_ID && AZURE_CLIENT_ID && AZURE_CLIENT_SECRET),
        supabase: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
        webhookSecret: !!EMAIL_WEBHOOK_SECRET,
        subscriptionValidation: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
