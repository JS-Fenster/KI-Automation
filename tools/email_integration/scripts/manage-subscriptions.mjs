// =============================================================================
// Microsoft Graph Subscription Management (Node.js Version)
// Version: 2.0 - 2026-01-13
// =============================================================================
// Ausfuehrung mit Node.js:
//   node manage-subscriptions.mjs list
//   node manage-subscriptions.mjs create info@js-fenster.de
//   node manage-subscriptions.mjs renew-all
//   node manage-subscriptions.mjs delete-all
//   node manage-subscriptions.mjs sync              (sync Graph -> DB)
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
const CLIENT_STATE = "js-fenster-email-webhook-secret";

// Configuration - Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || "https://rsmjgdujlpnydbsfuiek.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Subscription lifetime in minutes (max 4230 = ~3 days for mail)
const SUBSCRIPTION_LIFETIME_MINUTES = 4200;

// =============================================================================
// Azure Authentication
// =============================================================================

async function getAccessToken() {
  if (!AZURE_CLIENT_SECRET) {
    console.error("ERROR: AZURE_CLIENT_SECRET not set!");
    console.error("Set it via: $env:AZURE_CLIENT_SECRET = 'your-secret'");
    process.exit(1);
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
    console.error("Failed to get access token:", error);
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
    return;
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
  } else {
    console.log(`  [DB] Upserted subscription for ${postfach}`);
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

async function createSubscription(accessToken, userEmail, folder) {
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

  console.log(`Creating subscription for ${resource}...`);

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
Microsoft Graph Subscription Manager (Node.js) v2.0
====================================================

Usage:
  node manage-subscriptions.mjs <command> [args]

Commands:
  list                         List all active subscriptions (Graph + DB)
  create <email>               Create subscriptions for inbox AND sent
  renew-all                    Renew all existing subscriptions
  delete-all                   Delete all subscriptions
  sync                         Sync Graph subscriptions to DB

Examples:
  node manage-subscriptions.mjs list
  node manage-subscriptions.mjs create info@js-fenster.de
  node manage-subscriptions.mjs renew-all
  node manage-subscriptions.mjs sync

Environment variables (PowerShell):
  $env:AZURE_CLIENT_SECRET = "your-secret-here"
  $env:SUPABASE_SERVICE_ROLE_KEY = "your-key-here"

Database:
  Subscriptions werden in email_subscriptions Tabelle gespeichert.
  Ohne SUPABASE_SERVICE_ROLE_KEY werden nur Graph-Operationen ausgefuehrt.
`);
    return;
  }

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
      if (!email) {
        console.error("Error: Email address required");
        console.error("Usage: node manage-subscriptions.mjs create <email>");
        process.exit(1);
      }

      console.log(`Creating subscriptions for ${email}...\n`);

      // Create inbox subscription
      try {
        const inboxSub = await createSubscription(accessToken, email, "inbox");
        console.log(`Inbox subscription created:`);
        console.log(`  ID: ${inboxSub.id}`);
        console.log(`  Expires: ${inboxSub.expirationDateTime}\n`);
      } catch (error) {
        console.error(`Failed to create inbox subscription: ${error}\n`);
      }

      // Create sent items subscription
      try {
        const sentSub = await createSubscription(accessToken, email, "sentitems");
        console.log(`Sent items subscription created:`);
        console.log(`  ID: ${sentSub.id}`);
        console.log(`  Expires: ${sentSub.expirationDateTime}\n`);
      } catch (error) {
        console.error(`Failed to create sent subscription: ${error}\n`);
      }

      break;
    }

    case "renew-all": {
      const subscriptions = await listSubscriptions(accessToken);
      if (subscriptions.length === 0) {
        console.log("No subscriptions to renew.");
        break;
      }

      console.log(`Renewing ${subscriptions.length} subscription(s)...\n`);

      for (const sub of subscriptions) {
        try {
          const renewed = await renewSubscription(accessToken, sub.id);
          console.log(`Renewed: ${sub.resource}`);
          console.log(`  New expiration: ${renewed.expirationDateTime}\n`);
        } catch (error) {
          console.error(`Failed to renew ${sub.id}: ${error}`);
          // Mark as error in DB
          await deactivateSubscriptionInDb(sub.id, String(error));
          console.log("");
        }
      }
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
        console.error("Error: SUPABASE_SERVICE_ROLE_KEY required for sync");
        process.exit(1);
      }

      const subscriptions = await listSubscriptions(accessToken);
      console.log(`Found ${subscriptions.length} subscription(s) in Graph\n`);

      for (const sub of subscriptions) {
        console.log(`Syncing: ${sub.resource}`);
        await upsertSubscriptionToDb(sub);
      }

      console.log("\nSync complete!");
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
