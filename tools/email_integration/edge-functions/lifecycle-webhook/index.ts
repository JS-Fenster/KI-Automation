// =============================================================================
// Lifecycle Webhook - Microsoft Graph Subscription Lifecycle Events
// Version: 1.0 - 2026-01-14
// =============================================================================
// Empfaengt Lifecycle-Notifications von Microsoft Graph:
// - subscriptionRemoved: Subscription wurde entfernt (z.B. Permissions geaendert)
// - reauthorizationRequired: Subscription muss erneut autorisiert werden
// - missed: Notifications konnten nicht zugestellt werden
//
// Dokumentation:
// https://learn.microsoft.com/en-us/graph/webhooks-lifecycle
// =============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Lifecycle event types from Microsoft Graph
interface LifecycleEvent {
  subscriptionId: string;
  subscriptionExpirationDateTime?: string;
  lifecycleEvent: "subscriptionRemoved" | "reauthorizationRequired" | "missed";
  resource: string;
  resourceData?: {
    "@odata.type"?: string;
    "@odata.id"?: string;
  };
  clientState?: string;
  tenantId: string;
}

interface LifecyclePayload {
  value: LifecycleEvent[];
}

// Environment variables
const AZURE_TENANT_ID = Deno.env.get("AZURE_TENANT_ID");
const EMAIL_WEBHOOK_CLIENT_STATE = Deno.env.get("EMAIL_WEBHOOK_CLIENT_STATE") || "js-fenster-email-webhook-secret";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// =============================================================================
// Database Operations
// =============================================================================

async function updateSubscriptionLifecycle(
  subscriptionId: string,
  lifecycleEvent: string,
  isActive: boolean,
  errorMessage: string
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[DB] No Supabase credentials - skipping update");
    return;
  }

  const updateData: Record<string, unknown> = {
    is_active: isActive,
    last_error: errorMessage,
  };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/email_subscriptions?subscription_id=eq.${subscriptionId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[DB] Failed to update subscription: ${error}`);
    } else {
      const result = await response.json();
      if (result.length > 0) {
        console.log(`[DB] Updated subscription ${subscriptionId}: is_active=${isActive}, last_error="${errorMessage}"`);
      } else {
        console.warn(`[DB] Subscription ${subscriptionId} not found in database`);
      }
    }
  } catch (error) {
    console.error(`[DB] Error updating subscription: ${error}`);
  }
}

// =============================================================================
// Lifecycle Event Processing
// =============================================================================

async function processLifecycleEvent(event: LifecycleEvent): Promise<void> {
  const { subscriptionId, lifecycleEvent, resource, tenantId } = event;

  console.log(`[LIFECYCLE] Event: ${lifecycleEvent}`);
  console.log(`  Subscription: ${subscriptionId}`);
  console.log(`  Resource: ${resource}`);
  console.log(`  Tenant: ${tenantId}`);

  switch (lifecycleEvent) {
    case "subscriptionRemoved":
      // Subscription was deleted by Graph (e.g., permissions revoked)
      console.log("  -> Marking subscription as inactive");
      await updateSubscriptionLifecycle(
        subscriptionId,
        lifecycleEvent,
        false,
        "Lifecycle: subscriptionRemoved - subscription deleted by Graph"
      );
      break;

    case "reauthorizationRequired":
      // Subscription needs reauthorization (e.g., token expired)
      console.log("  -> Marking subscription as needing reauthorization");
      await updateSubscriptionLifecycle(
        subscriptionId,
        lifecycleEvent,
        true, // Keep active, but mark error
        "Lifecycle: reauthorizationRequired - run renew-all to fix"
      );
      break;

    case "missed":
      // Some notifications were missed (e.g., webhook was down)
      console.log("  -> Logging missed notifications warning");
      await updateSubscriptionLifecycle(
        subscriptionId,
        lifecycleEvent,
        true, // Keep active
        `Lifecycle: missed - some notifications were not delivered (${new Date().toISOString()})`
      );
      break;

    default:
      console.warn(`  -> Unknown lifecycle event: ${lifecycleEvent}`);
  }
}

// =============================================================================
// Security Validation
// =============================================================================

function validateLifecycleEvent(event: LifecycleEvent): { valid: boolean; reason?: string } {
  // Check clientState
  if (event.clientState && event.clientState !== EMAIL_WEBHOOK_CLIENT_STATE) {
    return { valid: false, reason: `clientState mismatch (got: ${event.clientState})` };
  }

  // Check tenantId
  if (AZURE_TENANT_ID && event.tenantId && event.tenantId !== AZURE_TENANT_ID) {
    return { valid: false, reason: `tenantId mismatch (got: ${event.tenantId}, expected: ${AZURE_TENANT_ID})` };
  }

  return { valid: true };
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // ==========================================================================
  // Subscription Validation Handshake (same as email-webhook)
  // Microsoft sends validationToken as query parameter when setting up
  // ==========================================================================

  const validationToken = url.searchParams.get("validationToken");
  if (validationToken) {
    console.log("Lifecycle subscription validation request received");
    return new Response(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // ==========================================================================
  // Handle POST - Lifecycle Notifications
  // ==========================================================================

  if (req.method === "POST") {
    try {
      const payload: LifecyclePayload = await req.json();
      const eventCount = payload.value?.length || 0;

      console.log(`[LIFECYCLE] Received ${eventCount} lifecycle event(s)`);

      let processedCount = 0;
      let rejectedCount = 0;

      for (const event of payload.value || []) {
        // Validate event
        const validation = validateLifecycleEvent(event);
        if (!validation.valid) {
          console.warn(`[SEC] Rejected lifecycle event: ${validation.reason}`);
          rejectedCount++;
          continue;
        }

        // Process event
        await processLifecycleEvent(event);
        processedCount++;
      }

      return new Response(
        JSON.stringify({
          status: "accepted",
          received: eventCount,
          processed: processedCount,
          rejected: rejectedCount,
        }),
        {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error(`[LIFECYCLE] Error: ${error}`);
      return new Response(
        JSON.stringify({ status: "error", message: String(error) }),
        {
          status: 202, // Still return 202 to prevent Graph retries
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // ==========================================================================
  // Health Check (GET)
  // ==========================================================================

  return new Response(
    JSON.stringify({
      service: "lifecycle-webhook",
      version: "1.0.0",
      status: "ready",
      configured: {
        azure: !!AZURE_TENANT_ID,
        supabase: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
      },
      events: ["subscriptionRemoved", "reauthorizationRequired", "missed"],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
