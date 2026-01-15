// =============================================================================
// Subscription Renewal Edge Function
// Version: 1.1 - 2026-01-14
// =============================================================================
// Scheduled function to renew Microsoft Graph subscriptions before they expire.
// Should be called every 12h via pg_cron + pg_net or external scheduler.
//
// - Selects subscriptions expiring within 24h from email_subscriptions table
// - Renews via Microsoft Graph PATCH /subscriptions/{id}
// - Updates expires_at and last_renewal_at in DB
//
// v1.1 Changes:
// - Token Hardening: trim() vor Request, sichere Fehlerausgabe
// - AADSTS error code Parsing mit Diagnose
// - Nie Secrets loggen
// =============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Environment variables
const AZURE_TENANT_ID = Deno.env.get("AZURE_TENANT_ID");
const AZURE_CLIENT_ID = Deno.env.get("AZURE_CLIENT_ID");
const AZURE_CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Subscription lifetime in minutes (max 4230 = ~3 days for mail)
const SUBSCRIPTION_LIFETIME_MINUTES = 4200;

// =============================================================================
// Microsoft Graph Authentication
// =============================================================================

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

// Extract AADSTS error code from Azure AD error response
function extractAadErrorCode(errorText: string): string | null {
  const match = errorText.match(/AADSTS\d+/);
  return match ? match[0] : null;
}

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error("Azure credentials not configured");
  }

  // Hardening: trim whitespace from secret
  const clientSecret = AZURE_CLIENT_SECRET.trim();

  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: AZURE_CLIENT_ID,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    const errorCode = extractAadErrorCode(error);
    // Safe logging: never log the secret
    console.error(`[TOKEN] Failed - Tenant: ${AZURE_TENANT_ID}, Client: ${AZURE_CLIENT_ID}, Error: ${errorCode || 'unknown'}`);
    if (errorCode === "AADSTS7000215") {
      console.error("[TOKEN] Diagnosis: Invalid client secret (wrong value or expired)");
    }
    throw new Error(`Failed to get access token: ${errorCode || error.substring(0, 100)}`);
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
// Database Operations
// =============================================================================

interface EmailSubscription {
  id: string;
  subscription_id: string;
  email_postfach: string;
  resource: string;
  expires_at: string;
  last_renewal_at: string | null;
  is_active: boolean;
}

async function getExpiringSubscriptions(): Promise<EmailSubscription[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials not configured");
  }

  // Get subscriptions expiring within 24 hours
  const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/email_subscriptions?is_active=eq.true&expires_at=lt.${expiryThreshold}&select=*`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to query subscriptions: ${error}`);
  }

  return await response.json();
}

async function updateSubscriptionInDb(
  subscriptionId: string,
  newExpiresAt: string,
  error?: string
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  const updateData: Record<string, unknown> = {
    last_renewal_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (error) {
    updateData.last_error = error;
    updateData.is_active = false;
  } else {
    updateData.expires_at = newExpiresAt;
    updateData.last_error = null;
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/email_subscriptions?subscription_id=eq.${subscriptionId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error(`Failed to update subscription ${subscriptionId}: ${err}`);
  }
}

// =============================================================================
// Microsoft Graph Subscription Renewal
// =============================================================================

interface GraphSubscription {
  id: string;
  resource: string;
  expirationDateTime: string;
  changeType: string;
  notificationUrl: string;
  clientState?: string;
}

async function renewSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<GraphSubscription> {
  const expirationDateTime = new Date(
    Date.now() + SUBSCRIPTION_LIFETIME_MINUTES * 60 * 1000
  ).toISOString();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expirationDateTime }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Graph API error: ${error}`);
  }

  return await response.json();
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req: Request) => {
  // Only allow POST requests (from scheduler) or GET (health check)
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        service: "renew-subscriptions",
        version: "1.1.0",
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
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const results = {
    checked: 0,
    renewed: 0,
    failed: 0,
    errors: [] as string[],
    subscriptions: [] as { id: string; postfach: string; status: string; newExpiry?: string }[],
  };

  try {
    // 1. Get subscriptions expiring within 24h
    const expiring = await getExpiringSubscriptions();
    results.checked = expiring.length;

    if (expiring.length === 0) {
      console.log("No subscriptions need renewal");
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "No subscriptions need renewal",
          ...results,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${expiring.length} subscription(s) to renew`);

    // 2. Get Graph access token
    const accessToken = await getAccessToken();

    // 3. Renew each subscription
    for (const sub of expiring) {
      try {
        console.log(`Renewing subscription for ${sub.email_postfach}: ${sub.subscription_id}`);

        const renewed = await renewSubscription(accessToken, sub.subscription_id);

        // Update database with new expiry
        await updateSubscriptionInDb(sub.subscription_id, renewed.expirationDateTime);

        results.renewed++;
        results.subscriptions.push({
          id: sub.subscription_id,
          postfach: sub.email_postfach,
          status: "renewed",
          newExpiry: renewed.expirationDateTime,
        });

        console.log(`Renewed: ${sub.subscription_id} until ${renewed.expirationDateTime}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Failed to renew ${sub.subscription_id}: ${errorMsg}`);

        // Check if subscription no longer exists in Graph
        if (errorMsg.includes("404") || errorMsg.includes("ResourceNotFound")) {
          // Mark as inactive in DB
          await updateSubscriptionInDb(sub.subscription_id, "", "Subscription not found in Graph");
          results.subscriptions.push({
            id: sub.subscription_id,
            postfach: sub.email_postfach,
            status: "not_found",
          });
        } else {
          // Record error but keep active for retry
          await updateSubscriptionInDb(sub.subscription_id, sub.expires_at, errorMsg);
          results.subscriptions.push({
            id: sub.subscription_id,
            postfach: sub.email_postfach,
            status: "error",
          });
        }

        results.failed++;
        results.errors.push(`${sub.email_postfach}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({
        status: results.failed === 0 ? "ok" : "partial",
        message: `Renewed ${results.renewed}/${results.checked} subscription(s)`,
        ...results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Renewal job failed: ${error}`);
    return new Response(
      JSON.stringify({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        ...results,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
