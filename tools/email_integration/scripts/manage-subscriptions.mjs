// =============================================================================
// Microsoft Graph Subscription Management (Node.js Version)
// Version: 2.4 - 2026-01-14
// =============================================================================
// v2.4: - Token Hardening: trim() vor Request, bessere Fehlerdiagnose
//       - AADSTS error code Parsing mit Diagnose-Tipps
//       - test-token Command fuer isolierten Token-Test
//       - Nie Secrets loggen, nur Prefix/Laenge
// v2.3: - Subscription Lifetime nahe Maximum (4200 min fuer Outlook)
//       - renew-soon: nur Subscriptions <48h erneuern (statt renew-all)
//       - lifecycleNotificationUrl Option bei create (--lifecycle)
//       - Bessere last_renewal_at/last_error Pflege
// v2.2: doctor Command fuer Systemdiagnose (ENV, Graph, DB)
// v2.1: Bessere Fehlermeldung wenn SUPABASE_SERVICE_ROLE_KEY fehlt,
//       Erfolgs-Zaehler bei sync
// Ausfuehrung mit Node.js:
//   node manage-subscriptions.mjs list
//   node manage-subscriptions.mjs create info@js-fenster.de [--lifecycle]
//   node manage-subscriptions.mjs renew-soon            (nur <48h expiring)
//   node manage-subscriptions.mjs renew-all             (alle erneuern)
//   node manage-subscriptions.mjs delete-all
//   node manage-subscriptions.mjs sync                  (sync Graph -> DB)
//   node manage-subscriptions.mjs doctor                (Systemdiagnose)
//   node manage-subscriptions.mjs test-token            (nur Token holen)
//
// v2.0: Supabase DB Integration (email_subscriptions Tabelle)
// =============================================================================

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envPath = join(__dirname, '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
    console.log("Loaded credentials from .env file");
  } catch (e) {
    // .env file not found, use environment variables
  }
}

loadEnv();

// Configuration - Azure
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || "08af0c7f-e407-4561-91f3-eb29b0d58f2e";
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || "c8c7967f-467e-41ef-a485-e4931f77b604";
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || "";
const WEBHOOK_URL = "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook";
const LIFECYCLE_WEBHOOK_URL = "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/lifecycle-webhook";
const CLIENT_STATE = "js-fenster-email-webhook-secret";

// Configuration - Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || "https://rsmjgdujlpnydbsfuiek.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Subscription lifetime in minutes
// Microsoft Graph max for Outlook messages: 4230 min (~2.94 days)
// We use 4200 min (~2.92 days) to stay safely under the limit
const SUBSCRIPTION_LIFETIME_MINUTES = 4200;

// Renewal window: renew subscriptions expiring within this many hours
const RENEWAL_WINDOW_HOURS = 48;

// =============================================================================
// Azure Authentication
// =============================================================================

// Hardening: Extract error code from Azure AD error response
function extractAadErrorCode(errorText) {
  // Pattern: AADSTS7000215 or similar
  const match = errorText.match(/AADSTS\d+/);
  return match ? match[0] : null;
}

// Hardening: Safe logging - never log secrets
function logTokenError(errorText) {
  const errorCode = extractAadErrorCode(errorText);
  console.error("\n=== Token Request Failed ===");
  console.error(`Tenant ID: ${AZURE_TENANT_ID}`);
  console.error(`Client ID: ${AZURE_CLIENT_ID}`);
  console.error(`Secret Length: ${AZURE_CLIENT_SECRET?.trim()?.length || 0} chars`);
  console.error(`Secret Prefix: ${AZURE_CLIENT_SECRET?.trim()?.substring(0, 4) || "N/A"}...`);

  if (errorCode) {
    console.error(`\nError Code: ${errorCode}`);
    if (errorCode === "AADSTS7000215") {
      console.error("Diagnosis: Invalid client secret");
      console.error("Common causes:");
      console.error("  1. Using Secret ID instead of Secret VALUE");
      console.error("  2. Secret has expired");
      console.error("  3. Trailing whitespace in secret");
      console.error("\nFix: In Azure Portal > App registrations > Certificates & secrets");
      console.error("     Create new secret and use the VALUE (not the ID)");
    } else if (errorCode === "AADSTS700016") {
      console.error("Diagnosis: Application not found in tenant");
    } else if (errorCode === "AADSTS90002") {
      console.error("Diagnosis: Tenant not found");
    }
  }
  console.error("\n(Full error logged for debugging - never share this publicly)");
  console.error(errorText);
  console.error("============================\n");
}

async function getAccessToken() {
  if (!AZURE_CLIENT_SECRET) {
    console.error("ERROR: AZURE_CLIENT_SECRET not set!");
    console.error("Set it via: $env:AZURE_CLIENT_SECRET = 'your-secret'");
    process.exit(1);
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
    logTokenError(error);
    process.exit(1);
  }

  const data = await response.json();
  return data.access_token;
}

// =============================================================================
// Supabase Database Operations
// =============================================================================

function extractPostfachFromResource(resource) {
  // Extract email from resource like "/users/info@js-fenster.de/mailFolders/..."
  const match = resource.match(/\/users\/([^\/]+)/);
  return match ? match[1] : "unknown";
}

async function upsertSubscriptionToDb(subscription) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log("  [DB] Skipped - SUPABASE_SERVICE_ROLE_KEY not set");
    return false;
  }

  const postfach = extractPostfachFromResource(subscription.resource);

  const data = {
    subscription_id: subscription.id,
    email_postfach: postfach,
    resource: subscription.resource,
    client_state: CLIENT_STATE,
    expires_at: subscription.expirationDateTime,
    last_renewal_at: new Date().toISOString(),
    is_active: true,
    last_error: null,
  };

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/email_subscriptions?on_conflict=subscription_id`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.log(`  [DB] Failed to upsert: ${error}`);
    return false;
  } else {
    console.log(`  [DB] Upserted subscription for ${postfach}`);
    return true;
  }
}

async function deactivateSubscriptionInDb(subscriptionId, error = "Deleted") {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log("  [DB] Skipped - SUPABASE_SERVICE_ROLE_KEY not set");
    return;
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
      body: JSON.stringify({
        is_active: false,
        last_error: error,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.log(`  [DB] Failed to deactivate: ${err}`);
  } else {
    console.log(`  [DB] Deactivated subscription`);
  }
}

// v2.3: Update error state without deactivating
async function updateSubscriptionError(subscriptionId, error) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  await fetch(
    `${SUPABASE_URL}/rest/v1/email_subscriptions?subscription_id=eq.${subscriptionId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        last_error: error,
      }),
    }
  );
}

// v2.3: Get subscriptions expiring within given hours from DB
async function getExpiringSubscriptionsFromDb(withinHours) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const cutoffTime = new Date(Date.now() + withinHours * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/email_subscriptions?is_active=eq.true&expires_at=lt.${cutoffTime}&select=*`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  if (!response.ok) {
    console.error(`  [DB] Failed to query expiring subscriptions: ${await response.text()}`);
    return [];
  }

  return await response.json();
}

async function listSubscriptionsFromDb() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/email_subscriptions?is_active=eq.true&select=*`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  return await response.json();
}

// =============================================================================
// Microsoft Graph Subscription Management
// =============================================================================

async function listSubscriptions(accessToken) {
  const response = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list subscriptions: ${error}`);
  }

  const data = await response.json();
  return data.value;
}

async function createSubscription(accessToken, userEmail, folder, options = {}) {
  const expirationDateTime = new Date(
    Date.now() + SUBSCRIPTION_LIFETIME_MINUTES * 60 * 1000
  ).toISOString();

  const resource = `/users/${userEmail}/mailFolders/${folder}/messages`;

  const subscription = {
    changeType: "created",
    notificationUrl: WEBHOOK_URL,
    resource: resource,
    expirationDateTime: expirationDateTime,
    clientState: CLIENT_STATE,
  };

  // v2.3: Optional lifecycle notification URL
  if (options.lifecycle) {
    subscription.lifecycleNotificationUrl = LIFECYCLE_WEBHOOK_URL;
    console.log(`Creating subscription for ${resource} (with lifecycle)...`);
  } else {
    console.log(`Creating subscription for ${resource}...`);
  }

  const response = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create subscription: ${error}`);
  }

  const result = await response.json();

  // Upsert to DB
  await upsertSubscriptionToDb(result);

  return result;
}

async function renewSubscription(accessToken, subscriptionId) {
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
    throw new Error(`Failed to renew subscription: ${error}`);
  }

  const result = await response.json();

  // Update DB
  await upsertSubscriptionToDb(result);

  return result;
}

async function deleteSubscription(accessToken, subscriptionId) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete subscription: ${error}`);
  }

  // Deactivate in DB
  await deactivateSubscriptionInDb(subscriptionId, "Manually deleted");
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Microsoft Graph Subscription Manager (Node.js) v2.4
====================================================

Usage:
  node manage-subscriptions.mjs <command> [args]

Commands:
  list                         List all active subscriptions (Graph + DB)
  create <email> [--lifecycle] Create subscriptions for inbox AND sent
  renew-soon                   Renew subscriptions expiring in <${RENEWAL_WINDOW_HOURS}h (for cron)
  renew-all                    Renew ALL subscriptions (force)
  delete-all                   Delete all subscriptions
  sync                         Sync Graph subscriptions to DB
  doctor                       System health check (ENV, Graph, DB)
  test-token                   Only test Azure token acquisition

Options:
  --lifecycle                  Set lifecycleNotificationUrl for lifecycle events

Examples:
  node manage-subscriptions.mjs list
  node manage-subscriptions.mjs create info@js-fenster.de
  node manage-subscriptions.mjs create info@js-fenster.de --lifecycle
  node manage-subscriptions.mjs renew-soon
  node manage-subscriptions.mjs sync
  node manage-subscriptions.mjs doctor
  node manage-subscriptions.mjs test-token

Subscription Lifetime:
  Max for Outlook messages: 4230 min (~2.94 days)
  Configured: ${SUBSCRIPTION_LIFETIME_MINUTES} min (~${(SUBSCRIPTION_LIFETIME_MINUTES / 60 / 24).toFixed(1)} days)
  Renewal window: ${RENEWAL_WINDOW_HOURS} hours before expiry

Environment variables (PowerShell):
  $env:AZURE_CLIENT_SECRET = "your-secret-here"
  $env:SUPABASE_SERVICE_ROLE_KEY = "your-key-here"

Database:
  Subscriptions werden in email_subscriptions Tabelle gespeichert.
  Ohne SUPABASE_SERVICE_ROLE_KEY werden nur Graph-Operationen ausgefuehrt.
`);
    return;
  }

  // ==========================================================================
  // Doctor Command - runs before token acquisition to diagnose issues
  // ==========================================================================
  if (command === "doctor") {
    console.log("=".repeat(60));
    console.log("  SYSTEM HEALTH CHECK (doctor)");
    console.log("=".repeat(60));
    console.log("");

    let exitCode = 0; // 0=OK, 1=Warn/Degraded, 2=Error
    const issues = [];
    const fixes = [];

    // --- Check 1: Environment Variables ---
    console.log("[1/4] Checking environment variables...");

    const envChecks = [
      { key: "AZURE_TENANT_ID", value: AZURE_TENANT_ID, required: true },
      { key: "AZURE_CLIENT_ID", value: AZURE_CLIENT_ID, required: true },
      { key: "AZURE_CLIENT_SECRET", value: AZURE_CLIENT_SECRET, required: true },
      { key: "SUPABASE_URL", value: SUPABASE_URL, required: true },
      { key: "SUPABASE_SERVICE_ROLE_KEY", value: SUPABASE_SERVICE_ROLE_KEY, required: true },
    ];

    for (const check of envChecks) {
      if (!check.value) {
        console.log(`  [FAIL] ${check.key} is not set`);
        issues.push(`${check.key} missing`);
        if (check.key === "SUPABASE_SERVICE_ROLE_KEY") {
          fixes.push(`Add to scripts/.env: ${check.key}=eyJ...`);
          fixes.push(`Get from: Supabase Dashboard → Project Settings → API → service_role`);
        } else if (check.key === "AZURE_CLIENT_SECRET") {
          fixes.push(`Set: $env:${check.key} = "your-secret"`);
        }
        exitCode = Math.max(exitCode, 2);
      } else {
        const masked = check.value.substring(0, 8) + "..." + check.value.substring(check.value.length - 4);
        console.log(`  [OK]   ${check.key} = ${masked}`);
      }
    }
    console.log("");

    // --- Check 2: Microsoft Graph API ---
    console.log("[2/4] Checking Microsoft Graph API...");
    let graphCount = 0;

    if (!AZURE_CLIENT_SECRET) {
      console.log("  [SKIP] Cannot test Graph - AZURE_CLIENT_SECRET missing");
      exitCode = Math.max(exitCode, 2);
    } else {
      try {
        // Hardening: trim whitespace from secret
        const clientSecret = AZURE_CLIENT_SECRET.trim();
        console.log(`  [INFO] Secret length: ${clientSecret.length} chars, prefix: ${clientSecret.substring(0, 4)}...`);

        const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
        const tokenResp = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: AZURE_CLIENT_ID,
            client_secret: clientSecret,
            scope: "https://graph.microsoft.com/.default",
            grant_type: "client_credentials",
          }),
        });

        if (!tokenResp.ok) {
          const err = await tokenResp.text();
          const errorCode = extractAadErrorCode(err);

          console.log(`  [FAIL] Token acquisition failed`);
          if (errorCode) {
            console.log(`  [FAIL] Error code: ${errorCode}`);
            if (errorCode === "AADSTS7000215") {
              console.log(`  [FAIL] Diagnosis: Invalid client secret`);
              console.log(`  [FAIL] Common causes:`);
              console.log(`         1. Using Secret ID instead of Secret VALUE`);
              console.log(`         2. Secret has expired`);
              console.log(`         3. Trailing whitespace in secret`);
              fixes.push("In Azure Portal > App registrations > Certificates & secrets");
              fixes.push("Create new secret and use the VALUE (not the ID)");
            } else if (errorCode === "AADSTS700016") {
              console.log(`  [FAIL] Diagnosis: Application not found in tenant`);
            } else if (errorCode === "AADSTS90002") {
              console.log(`  [FAIL] Diagnosis: Tenant not found`);
            }
          }
          issues.push(`Graph authentication failed (${errorCode || 'unknown error'})`);
          exitCode = Math.max(exitCode, 2);
        } else {
          const tokenData = await tokenResp.json();
          console.log("  [OK]   Token acquired successfully");

          // List subscriptions
          const subsResp = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });

          if (!subsResp.ok) {
            console.log(`  [FAIL] Cannot list subscriptions: ${subsResp.status}`);
            issues.push("Graph subscriptions unreachable");
            exitCode = Math.max(exitCode, 2);
          } else {
            const subsData = await subsResp.json();
            graphCount = subsData.value?.length || 0;
            console.log(`  [OK]   Graph subscriptions: ${graphCount}`);
          }
        }
      } catch (e) {
        console.log(`  [FAIL] Graph API error: ${e.message}`);
        issues.push("Graph API unreachable");
        exitCode = Math.max(exitCode, 2);
      }
    }
    console.log("");

    // --- Check 3: Supabase DB ---
    console.log("[3/4] Checking Supabase Database...");
    let dbTotal = 0;
    let dbActive = 0;

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.log("  [SKIP] Cannot test DB - SUPABASE_SERVICE_ROLE_KEY missing");
      exitCode = Math.max(exitCode, 2);
    } else {
      try {
        // Count all subscriptions
        const countResp = await fetch(
          `${SUPABASE_URL}/rest/v1/email_subscriptions?select=subscription_id,is_active`,
          {
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              apikey: SUPABASE_SERVICE_ROLE_KEY,
            },
          }
        );

        if (!countResp.ok) {
          const err = await countResp.text();
          console.log(`  [FAIL] DB query failed: ${err.substring(0, 100)}`);
          issues.push("Database unreachable or invalid key");
          exitCode = Math.max(exitCode, 2);
        } else {
          const rows = await countResp.json();
          dbTotal = rows.length;
          dbActive = rows.filter((r) => r.is_active).length;
          console.log(`  [OK]   DB reachable`);
          console.log(`  [OK]   Total subscriptions in DB: ${dbTotal}`);
          console.log(`  [OK]   Active subscriptions in DB: ${dbActive}`);

          if (dbActive === 0) {
            console.log("  [WARN] No active subscriptions in DB - webhook will reject all notifications!");
            issues.push("email_subscriptions table is empty");
            fixes.push("Run: node manage-subscriptions.mjs sync");
            exitCode = Math.max(exitCode, 1);
          }
        }
      } catch (e) {
        console.log(`  [FAIL] DB error: ${e.message}`);
        issues.push("Database connection error");
        exitCode = Math.max(exitCode, 2);
      }
    }
    console.log("");

    // --- Check 4: Sync Status ---
    console.log("[4/4] Checking sync status...");

    if (graphCount > 0 && dbActive === 0) {
      console.log(`  [WARN] Graph has ${graphCount} subscription(s), but DB has 0 active`);
      console.log("         Notifications will be rejected as 'Unknown subscriptionId'");
      issues.push("Graph/DB out of sync");
      fixes.push("Run: node manage-subscriptions.mjs sync");
      exitCode = Math.max(exitCode, 1);
    } else if (graphCount > dbActive) {
      console.log(`  [WARN] Graph has ${graphCount}, DB has ${dbActive} - possible desync`);
      fixes.push("Consider running: node manage-subscriptions.mjs sync");
      exitCode = Math.max(exitCode, 1);
    } else if (graphCount === 0 && dbActive === 0) {
      console.log("  [WARN] No subscriptions anywhere - email notifications not configured");
      fixes.push("Run: node manage-subscriptions.mjs create info@js-fenster.de");
      exitCode = Math.max(exitCode, 1);
    } else {
      console.log(`  [OK]   Graph (${graphCount}) and DB (${dbActive}) in sync`);
    }
    console.log("");

    // --- Summary ---
    console.log("=".repeat(60));
    if (exitCode === 0) {
      console.log("  STATUS: OK - All systems operational");
    } else if (exitCode === 1) {
      console.log("  STATUS: DEGRADED - System works but has issues");
    } else {
      console.log("  STATUS: ERROR - Critical issues detected");
    }
    console.log("=".repeat(60));

    if (issues.length > 0) {
      console.log("\nIssues found:");
      for (const issue of issues) {
        console.log(`  - ${issue}`);
      }
    }

    if (fixes.length > 0) {
      console.log("\nRecommended fixes:");
      for (const fix of fixes) {
        console.log(`  → ${fix}`);
      }
    }

    console.log("");
    process.exit(exitCode);
  }

  // ==========================================================================
  // Test-Token Command - isolated token test
  // ==========================================================================
  if (command === "test-token") {
    console.log("=".repeat(60));
    console.log("  AZURE TOKEN TEST");
    console.log("=".repeat(60));
    console.log("");

    if (!AZURE_CLIENT_SECRET) {
      console.log("[FAIL] AZURE_CLIENT_SECRET is not set");
      console.log("");
      console.log("Fix: Set the environment variable:");
      console.log('  $env:AZURE_CLIENT_SECRET = "your-secret-value"');
      console.log("");
      console.log("Or add to scripts/.env:");
      console.log("  AZURE_CLIENT_SECRET=your-secret-value");
      process.exit(1);
    }

    // Hardening: trim whitespace
    const clientSecret = AZURE_CLIENT_SECRET.trim();

    console.log(`Tenant ID:     ${AZURE_TENANT_ID}`);
    console.log(`Client ID:     ${AZURE_CLIENT_ID}`);
    console.log(`Secret Length: ${clientSecret.length} chars`);
    console.log(`Secret Prefix: ${clientSecret.substring(0, 4)}...`);
    console.log("");
    console.log("Requesting token from Azure AD...");
    console.log("");

    try {
      const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
      const tokenResp = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: AZURE_CLIENT_ID,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      });

      if (!tokenResp.ok) {
        const err = await tokenResp.text();
        const errorCode = extractAadErrorCode(err);

        console.log("[FAIL] Token acquisition FAILED");
        console.log("");

        if (errorCode) {
          console.log(`Error Code: ${errorCode}`);
          console.log("");
          if (errorCode === "AADSTS7000215") {
            console.log("Diagnosis: INVALID CLIENT SECRET");
            console.log("");
            console.log("This typically means:");
            console.log("  1. You are using the Secret ID instead of the Secret VALUE");
            console.log("  2. The secret has expired");
            console.log("  3. There is trailing/leading whitespace in the secret");
            console.log("");
            console.log("How to fix:");
            console.log("  1. Go to Azure Portal > App registrations");
            console.log("  2. Select your app: JS-Fenster-KI-Integration");
            console.log("  3. Click 'Certificates & secrets'");
            console.log("  4. Create a NEW client secret");
            console.log("  5. IMPORTANT: Copy the VALUE, not the ID!");
            console.log("     - The VALUE is shown only once after creation");
            console.log("     - It looks like: <AZURE_CLIENT_SECRET_VALUE>");
            console.log("     - The ID looks like: 12345678-1234-1234-1234-123456789012");
            console.log("  6. Update AZURE_CLIENT_SECRET with the new VALUE");
          } else if (errorCode === "AADSTS700016") {
            console.log("Diagnosis: Application not found");
            console.log("Check AZURE_CLIENT_ID and AZURE_TENANT_ID");
          } else if (errorCode === "AADSTS90002") {
            console.log("Diagnosis: Tenant not found");
            console.log("Check AZURE_TENANT_ID");
          } else {
            console.log("Full error response:");
            console.log(err);
          }
        } else {
          console.log("Full error response:");
          console.log(err);
        }
        console.log("");
        process.exit(1);
      }

      const tokenData = await tokenResp.json();
      const tokenPreview = tokenData.access_token.substring(0, 20) + "...";

      console.log("[OK] Token acquired successfully!");
      console.log("");
      console.log(`Token Type:    ${tokenData.token_type}`);
      console.log(`Expires In:    ${tokenData.expires_in} seconds`);
      console.log(`Token Preview: ${tokenPreview}`);
      console.log("");
      console.log("=".repeat(60));
      console.log("  Azure authentication is working correctly.");
      console.log("=".repeat(60));
      process.exit(0);

    } catch (e) {
      console.log(`[FAIL] Network error: ${e.message}`);
      process.exit(1);
    }
  }

  // ==========================================================================
  // Regular commands - require token
  // ==========================================================================
  console.log("Getting access token...");
  const accessToken = await getAccessToken();
  console.log("Token obtained successfully.");

  if (SUPABASE_SERVICE_ROLE_KEY) {
    console.log("Supabase DB integration: ENABLED\n");
  } else {
    console.log("Supabase DB integration: DISABLED (no service role key)\n");
  }

  switch (command) {
    case "list": {
      // List from Graph
      const graphSubs = await listSubscriptions(accessToken);
      console.log(`=== Microsoft Graph (${graphSubs.length} subscription(s)) ===\n`);

      if (graphSubs.length === 0) {
        console.log("No active subscriptions in Graph.\n");
      } else {
        for (const sub of graphSubs) {
          console.log(`ID: ${sub.id}`);
          console.log(`  Resource: ${sub.resource}`);
          console.log(`  Expires: ${sub.expirationDateTime}`);
          console.log("");
        }
      }

      // List from DB
      const dbSubs = await listSubscriptionsFromDb();
      if (dbSubs.length > 0) {
        console.log(`=== Supabase DB (${dbSubs.length} active subscription(s)) ===\n`);
        for (const sub of dbSubs) {
          console.log(`ID: ${sub.subscription_id}`);
          console.log(`  Postfach: ${sub.email_postfach}`);
          console.log(`  Resource: ${sub.resource}`);
          console.log(`  Expires: ${sub.expires_at}`);
          console.log(`  Last Renewal: ${sub.last_renewal_at || 'never'}`);
          console.log("");
        }
      }
      break;
    }

    case "create": {
      const email = args[1];
      if (!email || email.startsWith("--")) {
        console.error("Error: Email address required");
        console.error("Usage: node manage-subscriptions.mjs create <email> [--lifecycle]");
        process.exit(1);
      }

      // v2.3: Check for --lifecycle flag
      const useLifecycle = args.includes("--lifecycle");
      const options = { lifecycle: useLifecycle };

      console.log(`Creating subscriptions for ${email}...`);
      if (useLifecycle) {
        console.log(`  (with lifecycleNotificationUrl: ${LIFECYCLE_WEBHOOK_URL})`);
      }
      console.log("");

      // Create inbox subscription
      try {
        const inboxSub = await createSubscription(accessToken, email, "inbox", options);
        console.log(`Inbox subscription created:`);
        console.log(`  ID: ${inboxSub.id}`);
        console.log(`  Expires: ${inboxSub.expirationDateTime}`);
        if (inboxSub.lifecycleNotificationUrl) {
          console.log(`  Lifecycle: ${inboxSub.lifecycleNotificationUrl}`);
        }
        console.log("");
      } catch (error) {
        console.error(`Failed to create inbox subscription: ${error}\n`);
      }

      // Create sent items subscription
      try {
        const sentSub = await createSubscription(accessToken, email, "sentitems", options);
        console.log(`Sent items subscription created:`);
        console.log(`  ID: ${sentSub.id}`);
        console.log(`  Expires: ${sentSub.expirationDateTime}`);
        if (sentSub.lifecycleNotificationUrl) {
          console.log(`  Lifecycle: ${sentSub.lifecycleNotificationUrl}`);
        }
        console.log("");
      } catch (error) {
        console.error(`Failed to create sent subscription: ${error}\n`);
      }

      break;
    }

    // v2.3: renew-soon - only renew subscriptions expiring within RENEWAL_WINDOW_HOURS
    case "renew-soon": {
      if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error("ERROR: renew-soon requires SUPABASE_SERVICE_ROLE_KEY to query DB");
        console.error("Use renew-all to renew all subscriptions from Graph");
        process.exit(1);
      }

      console.log(`Checking for subscriptions expiring within ${RENEWAL_WINDOW_HOURS} hours...\n`);

      const expiringDbSubs = await getExpiringSubscriptionsFromDb(RENEWAL_WINDOW_HOURS);

      if (expiringDbSubs.length === 0) {
        console.log("No subscriptions expiring soon - nothing to renew.");
        break;
      }

      console.log(`Found ${expiringDbSubs.length} subscription(s) expiring soon:\n`);

      let renewedCount = 0;
      let errorCount = 0;

      for (const dbSub of expiringDbSubs) {
        const hoursLeft = Math.round((new Date(dbSub.expires_at) - Date.now()) / 1000 / 60 / 60);
        console.log(`${dbSub.subscription_id}`);
        console.log(`  Resource: ${dbSub.resource}`);
        console.log(`  Expires: ${dbSub.expires_at} (~${hoursLeft}h remaining)`);

        try {
          const renewed = await renewSubscription(accessToken, dbSub.subscription_id);
          console.log(`  [OK] Renewed until: ${renewed.expirationDateTime}`);
          renewedCount++;
        } catch (error) {
          console.error(`  [FAIL] ${error}`);
          // Update error in DB but don't deactivate
          await updateSubscriptionError(dbSub.subscription_id, String(error));
          errorCount++;
        }
        console.log("");
      }

      console.log(`Summary: ${renewedCount} renewed, ${errorCount} failed`);
      break;
    }

    case "renew-all": {
      const subscriptions = await listSubscriptions(accessToken);
      if (subscriptions.length === 0) {
        console.log("No subscriptions to renew.");
        break;
      }

      console.log(`Renewing ALL ${subscriptions.length} subscription(s)...\n`);
      console.log("(Tip: Use renew-soon for cron jobs to only renew expiring subscriptions)\n");

      let renewedCount = 0;
      let errorCount = 0;

      for (const sub of subscriptions) {
        try {
          const renewed = await renewSubscription(accessToken, sub.id);
          console.log(`Renewed: ${sub.resource}`);
          console.log(`  New expiration: ${renewed.expirationDateTime}`);
          renewedCount++;
        } catch (error) {
          console.error(`Failed to renew ${sub.id}: ${error}`);
          // Update error in DB but don't deactivate (subscription might recover)
          await updateSubscriptionError(sub.id, String(error));
          errorCount++;
        }
        console.log("");
      }

      console.log(`Summary: ${renewedCount} renewed, ${errorCount} failed`);
      break;
    }

    case "delete-all": {
      const subscriptions = await listSubscriptions(accessToken);
      if (subscriptions.length === 0) {
        console.log("No subscriptions to delete.");
        break;
      }

      console.log(`Deleting ${subscriptions.length} subscription(s)...\n`);

      for (const sub of subscriptions) {
        try {
          await deleteSubscription(accessToken, sub.id);
          console.log(`Deleted: ${sub.id} (${sub.resource})`);
        } catch (error) {
          console.error(`Failed to delete ${sub.id}: ${error}`);
        }
      }
      break;
    }

    case "sync": {
      console.log("Syncing Graph subscriptions to DB...\n");

      if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is not set!");
        console.error("");
        console.error("To fix this, add the key to scripts/.env:");
        console.error("  SUPABASE_SERVICE_ROLE_KEY=eyJ...");
        console.error("");
        console.error("Get it from: Supabase Dashboard → Project Settings → API → service_role");
        process.exit(1);
      }

      const subscriptions = await listSubscriptions(accessToken);
      console.log(`Found ${subscriptions.length} subscription(s) in Graph\n`);

      let successCount = 0;
      let failCount = 0;

      for (const sub of subscriptions) {
        console.log(`Syncing: ${sub.resource}`);
        const success = await upsertSubscriptionToDb(sub);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      console.log("");
      console.log(`Sync complete! DB upsert succeeded: ${successCount} rows` + (failCount > 0 ? `, failed: ${failCount}` : ""));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
