// =============================================================================
// Microsoft Graph Subscription Management
// Erstellt: 2026-01-12
// =============================================================================
// Dieses Script erstellt und verwaltet Microsoft Graph Subscriptions
// fuer E-Mail-Benachrichtigungen.
//
// Ausfuehrung lokal mit Deno:
//   deno run --allow-net --allow-env manage-subscriptions.ts create info@js-fenster.de
//   deno run --allow-net --allow-env manage-subscriptions.ts list
//   deno run --allow-net --allow-env manage-subscriptions.ts renew <subscriptionId>
//   deno run --allow-net --allow-env manage-subscriptions.ts delete <subscriptionId>
// =============================================================================

// Configuration - set these environment variables or replace with values
const AZURE_TENANT_ID = Deno.env.get("AZURE_TENANT_ID") || "08af0c7f-e407-4561-91f3-eb29b0d58f2e";
const AZURE_CLIENT_ID = Deno.env.get("AZURE_CLIENT_ID") || "c8c7967f-467e-41ef-a485-e4931f77b604";
const AZURE_CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET") || "";
const WEBHOOK_URL = "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook";
const CLIENT_STATE = "js-fenster-email-webhook-secret";

// Subscription lifetime in minutes (max 4230 = ~3 days for mail)
const SUBSCRIPTION_LIFETIME_MINUTES = 4200;

// =============================================================================
// Authentication
// =============================================================================

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

async function getAccessToken(): Promise<string> {
  if (!AZURE_CLIENT_SECRET) {
    console.error("ERROR: AZURE_CLIENT_SECRET not set!");
    console.error("Set it via environment variable or edit this file.");
    Deno.exit(1);
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
    Deno.exit(1);
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

// =============================================================================
// Subscription Management
// =============================================================================

interface Subscription {
  id: string;
  resource: string;
  changeType: string;
  notificationUrl: string;
  expirationDateTime: string;
  clientState?: string;
}

interface SubscriptionList {
  value: Subscription[];
}

async function listSubscriptions(accessToken: string): Promise<Subscription[]> {
  const response = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list subscriptions: ${error}`);
  }

  const data: SubscriptionList = await response.json();
  return data.value;
}

async function createSubscription(
  accessToken: string,
  userEmail: string,
  folder: "inbox" | "sentitems"
): Promise<Subscription> {
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

  return await response.json();
}

async function renewSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<Subscription> {
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

  return await response.json();
}

async function deleteSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<void> {
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
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = Deno.args;
  const command = args[0];

  if (!command) {
    console.log(`
Microsoft Graph Subscription Manager
=====================================

Usage:
  deno run --allow-net --allow-env manage-subscriptions.ts <command> [args]

Commands:
  list                         List all active subscriptions
  create <email>               Create subscriptions for inbox AND sent for a mailbox
  create-inbox <email>         Create subscription for inbox only
  create-sent <email>          Create subscription for sent items only
  renew <subscriptionId>       Renew a subscription
  renew-all                    Renew all existing subscriptions
  delete <subscriptionId>      Delete a subscription
  delete-all                   Delete all subscriptions

Examples:
  manage-subscriptions.ts list
  manage-subscriptions.ts create info@js-fenster.de
  manage-subscriptions.ts renew-all

Environment variables:
  AZURE_CLIENT_SECRET          Required - the client secret from Azure AD
`);
    return;
  }

  console.log("Getting access token...");
  const accessToken = await getAccessToken();
  console.log("Token obtained successfully.\n");

  switch (command) {
    case "list": {
      const subscriptions = await listSubscriptions(accessToken);
      if (subscriptions.length === 0) {
        console.log("No active subscriptions found.");
      } else {
        console.log(`Found ${subscriptions.length} subscription(s):\n`);
        for (const sub of subscriptions) {
          console.log(`ID: ${sub.id}`);
          console.log(`  Resource: ${sub.resource}`);
          console.log(`  Type: ${sub.changeType}`);
          console.log(`  Expires: ${sub.expirationDateTime}`);
          console.log(`  URL: ${sub.notificationUrl}`);
          console.log("");
        }
      }
      break;
    }

    case "create": {
      const email = args[1];
      if (!email) {
        console.error("Error: Email address required");
        console.error("Usage: manage-subscriptions.ts create <email>");
        Deno.exit(1);
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

    case "create-inbox": {
      const email = args[1];
      if (!email) {
        console.error("Error: Email address required");
        Deno.exit(1);
      }

      const sub = await createSubscription(accessToken, email, "inbox");
      console.log(`Subscription created:`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  Expires: ${sub.expirationDateTime}`);
      break;
    }

    case "create-sent": {
      const email = args[1];
      if (!email) {
        console.error("Error: Email address required");
        Deno.exit(1);
      }

      const sub = await createSubscription(accessToken, email, "sentitems");
      console.log(`Subscription created:`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  Expires: ${sub.expirationDateTime}`);
      break;
    }

    case "renew": {
      const subId = args[1];
      if (!subId) {
        console.error("Error: Subscription ID required");
        Deno.exit(1);
      }

      const sub = await renewSubscription(accessToken, subId);
      console.log(`Subscription renewed:`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  New expiration: ${sub.expirationDateTime}`);
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
          console.error(`Failed to renew ${sub.id}: ${error}\n`);
        }
      }
      break;
    }

    case "delete": {
      const subId = args[1];
      if (!subId) {
        console.error("Error: Subscription ID required");
        Deno.exit(1);
      }

      await deleteSubscription(accessToken, subId);
      console.log(`Subscription ${subId} deleted.`);
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

    default:
      console.error(`Unknown command: ${command}`);
      Deno.exit(1);
  }
}

main();
