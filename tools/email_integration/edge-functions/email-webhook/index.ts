// =============================================================================
// E-Mail Webhook - Microsoft Graph Change Notifications
// Erstellt: 2026-01-12
// =============================================================================
// Empfaengt Notifications von Microsoft Graph wenn neue E-Mails ankommen
// oder E-Mails gesendet werden.
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
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(documentData),
  });

  if (!response.ok) {
    const error = await response.text();

    // Check for duplicate (unique constraint violation)
    if (error.includes("unique_email_message_id") || error.includes("duplicate")) {
      console.log(`Email already processed: ${email.id}`);
      return null;
    }

    throw new Error(`Failed to save email: ${error}`);
  }

  const result = await response.json();
  return { id: result[0]?.id };
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // ==========================================================================
  // Microsoft Graph Subscription Validation
  // ==========================================================================
  // When creating a subscription, Microsoft sends a GET request with
  // validationToken that must be echoed back

  if (req.method === "GET") {
    const validationToken = url.searchParams.get("validationToken");

    if (validationToken) {
      console.log("Subscription validation request received");
      return new Response(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
  }

  // ==========================================================================
  // Handle POST - Change Notifications
  // ==========================================================================

  if (req.method === "POST") {
    try {
      const payload: NotificationPayload = await req.json();

      console.log(`Received ${payload.value?.length || 0} notifications`);

      // Validate clientState for security
      for (const notification of payload.value || []) {
        if (notification.clientState && notification.clientState !== EMAIL_WEBHOOK_CLIENT_STATE) {
          console.warn("Invalid clientState - potential security issue");
          continue;
        }

        // Only process "created" events (new emails)
        if (notification.changeType !== "created") {
          console.log(`Skipping ${notification.changeType} event`);
          continue;
        }

        try {
          // Get access token
          const accessToken = await getAccessToken();

          // Extract metadata from resource path
          const postfach = extractUserFromResource(notification.resource);
          const richtung = extractFolderFromResource(notification.resource);

          console.log(`Processing email for ${postfach} (${richtung})`);

          // Fetch full email details
          const email = await fetchEmailDetails(notification.resource, accessToken);

          // Save to database
          const result = await saveEmailToDatabase(email, postfach, richtung);

          if (result) {
            console.log(`Email saved with ID: ${result.id}`);

            // TODO: Trigger GPT categorization (process-email function)
            // TODO: Process attachments if any
          }
        } catch (error) {
          console.error(`Error processing notification: ${error}`);
          // Continue with next notification
        }
      }

      // Always return 202 Accepted to Microsoft
      // Even if processing fails, we don't want Microsoft to retry
      return new Response(JSON.stringify({ status: "accepted" }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`Webhook error: ${error}`);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // ==========================================================================
  // Health Check / Info
  // ==========================================================================

  return new Response(
    JSON.stringify({
      service: "email-webhook",
      version: "1.0.0",
      status: "ready",
      configured: {
        azure: !!(AZURE_TENANT_ID && AZURE_CLIENT_ID && AZURE_CLIENT_SECRET),
        supabase: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
