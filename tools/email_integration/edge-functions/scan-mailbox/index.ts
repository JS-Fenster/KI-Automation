// =============================================================================
// Scan Mailbox - Analyse bestehender E-Mails
// Version: 5 - 2026-01-13
// =============================================================================
// Ruft bestehende E-Mails aus einem Postfach ab zur Analyse.
// Speichert NICHTS - nur zur Uebersicht.
//
// Aenderungen v5:
// - Folder-ID wird zu displayName aufgeloest (Change 7)
//
// Aufruf:
//   GET /scan-mailbox?mailbox=info@js-fenster.de&action=folders
//   GET /scan-mailbox?mailbox=info@js-fenster.de&count=100&folder=inbox
//   GET /scan-mailbox?mailbox=info@js-fenster.de&count=50&folder=AAMkAG...
// =============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Environment variables
const AZURE_TENANT_ID = Deno.env.get("AZURE_TENANT_ID");
const AZURE_CLIENT_ID = Deno.env.get("AZURE_CLIENT_ID");
const AZURE_CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET");

// =============================================================================
// Microsoft Graph Authentication
// =============================================================================

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

async function getAccessToken(): Promise<string> {
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
  return data.access_token;
}

// =============================================================================
// Folder Listing
// =============================================================================

interface GraphFolder {
  id: string;
  displayName: string;
  parentFolderId: string;
  childFolderCount: number;
  totalItemCount: number;
  unreadItemCount: number;
}

interface FolderResponse {
  value: GraphFolder[];
}

interface FolderInfo {
  id: string;
  name: string;
  total: number;
  unread: number;
  subfolders: number;
}

async function listFolders(
  accessToken: string,
  mailbox: string,
  parentFolderId?: string
): Promise<FolderInfo[]> {
  let url: string;
  if (parentFolderId) {
    url = `https://graph.microsoft.com/v1.0/users/${mailbox}/mailFolders/${parentFolderId}/childFolders?$top=50`;
  } else {
    url = `https://graph.microsoft.com/v1.0/users/${mailbox}/mailFolders?$top=50`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list folders: ${error}`);
  }

  const data: FolderResponse = await response.json();

  return data.value.map((folder) => ({
    id: folder.id,
    name: folder.displayName,
    total: folder.totalItemCount,
    unread: folder.unreadItemCount,
    subfolders: folder.childFolderCount,
  }));
}

async function listAllFoldersRecursive(
  accessToken: string,
  mailbox: string,
  parentId?: string,
  prefix: string = ""
): Promise<Array<FolderInfo & { path: string }>> {
  const folders = await listFolders(accessToken, mailbox, parentId);
  const result: Array<FolderInfo & { path: string }> = [];

  for (const folder of folders) {
    const path = prefix ? `${prefix}/${folder.name}` : folder.name;
    result.push({ ...folder, path });

    if (folder.subfolders > 0) {
      const subfolders = await listAllFoldersRecursive(
        accessToken,
        mailbox,
        folder.id,
        path
      );
      result.push(...subfolders);
    }
  }

  return result;
}

// =============================================================================
// Folder ID Resolution (Change 7)
// =============================================================================

// Map of well-known folder names
const WELLKNOWN_FOLDERS: Record<string, string> = {
  inbox: "Inbox",
  sentitems: "Sent Items",
  drafts: "Drafts",
  deleteditems: "Deleted Items",
  junkemail: "Junk Email",
  outbox: "Outbox",
  archive: "Archive",
};

async function resolveFolderName(
  accessToken: string,
  mailbox: string,
  folderIdOrName: string
): Promise<string> {
  // Check if it's a wellknown name
  const lowerFolder = folderIdOrName.toLowerCase();
  if (WELLKNOWN_FOLDERS[lowerFolder]) {
    return WELLKNOWN_FOLDERS[lowerFolder];
  }

  // If it looks like an ID (starts with AAMk), fetch the display name
  if (folderIdOrName.startsWith("AAMk") || folderIdOrName.length > 50) {
    try {
      const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/mailFolders/${folderIdOrName}?$select=displayName`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.displayName || folderIdOrName;
      }
    } catch (error) {
      console.warn(`Could not resolve folder name: ${error}`);
    }
  }

  // Return as-is if we can't resolve
  return folderIdOrName;
}

// =============================================================================
// Email Fetching
// =============================================================================

interface GraphEmail {
  id: string;
  subject: string;
  bodyPreview: string;
  from?: {
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
  receivedDateTime: string;
  sentDateTime: string;
  hasAttachments: boolean;
  importance: string;
  isRead: boolean;
}

interface GraphResponse {
  value: GraphEmail[];
  "@odata.nextLink"?: string;
}

interface EmailSummary {
  id: string;
  datum: string;
  von_email: string;
  von_name: string;
  an: string;
  betreff: string;
  preview: string;
  hat_anhaenge: boolean;
  wichtigkeit: string;
  gelesen: boolean;
}

async function fetchEmails(
  accessToken: string,
  mailbox: string,
  folder: string,
  count: number
): Promise<EmailSummary[]> {
  // Fetch emails from specified folder (can be wellknown name or folder ID)
  const url = `https://graph.microsoft.com/v1.0/users/${mailbox}/mailFolders/${folder}/messages?$top=${count}&$orderby=receivedDateTime desc&$select=id,subject,bodyPreview,from,toRecipients,receivedDateTime,sentDateTime,hasAttachments,importance,isRead`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch emails: ${error}`);
  }

  const data: GraphResponse = await response.json();

  // Convert to summary format
  return data.value.map((email) => ({
    id: email.id,
    datum: email.receivedDateTime || email.sentDateTime,
    von_email: email.from?.emailAddress?.address || "-",
    von_name: email.from?.emailAddress?.name || "-",
    an: email.toRecipients?.map((r) => r.emailAddress.address).join(", ") || "-",
    betreff: email.subject || "(kein Betreff)",
    preview: email.bodyPreview?.substring(0, 150) || "",
    hat_anhaenge: email.hasAttachments,
    wichtigkeit: email.importance,
    gelesen: email.isRead,
  }));
}

// =============================================================================
// Simple categorization guess based on subject/sender
// =============================================================================

function guessCategory(email: EmailSummary, folderName: string = ""): string {
  const betreff = email.betreff.toLowerCase();
  const von = email.von_email.toLowerCase();
  const preview = email.preview.toLowerCase();
  const folder = folderName.toLowerCase();

  // Bewerbungen
  if (betreff.includes("bewerbung") || betreff.includes("bewerbe") ||
      betreff.includes("lebenslauf") || betreff.includes("stellenanzeige") ||
      preview.includes("bewerbung") || preview.includes("bewerbe mich") ||
      folder.includes("bewerbung")) {
    return "Bewerbung";
  }

  // Lead-Anfragen (CRM-Systeme wie Hubspot, WERU)
  if (von.includes("hubspot") || von.includes("notifications.hubspot") ||
      von.includes("@weru.de") || von.includes("noreply@weru") ||
      betreff.includes("produktfinder") || betreff.includes("lead") ||
      betreff.includes("angebotstool") || betreff.includes("weru-leadservice")) {
    return "Lead_Anfrage";
  }

  // BAFA / Foerderung
  if (von.includes("fe-bis.de") || von.includes("bafa") ||
      betreff.includes("zuwendungsbescheid") || betreff.includes("bafa") ||
      betreff.includes("foerderantrag") || betreff.includes("förderantrag")) {
    return "BAFA_Foerderung";
  }

  // Versicherung / Schaden
  if (von.includes("generali") || von.includes("allianz") || von.includes("versicherung") ||
      betreff.includes("versicherungsschaden") || betreff.includes("schadenmeldung") ||
      betreff.includes("schadenfall")) {
    return "Versicherung_Schaden";
  }

  // Paketdienste
  if (von.includes("dhl") || von.includes("dpd") || von.includes("ups") ||
      von.includes("gls") || von.includes("hermes") || von.includes("fedex")) {
    return "Lieferstatus_Update";
  }

  // Online-Haendler Bestellbestaetigung
  if (von.includes("amazon") || von.includes("ebay")) {
    if (betreff.includes("bestellung") || betreff.includes("order")) {
      return "Bestellbestaetigung";
    }
    if (betreff.includes("versand") || betreff.includes("shipped")) {
      return "Versandbestaetigung";
    }
    return "Bestellbestaetigung";
  }

  // Rechnungen
  if (betreff.includes("rechnung") || betreff.includes("invoice")) {
    if (folder.includes("ausgang") || folder.includes("sent")) {
      return "Rechnung_Gesendet";
    }
    return "Rechnung_Eingang";
  }

  // Auftragserteilung
  if (betreff.includes("auftragserteilung") || betreff.includes("auftrag erteilt") ||
      betreff.includes("beauftragung")) {
    return "Auftragserteilung";
  }

  // Bestellbestaetigung
  if (betreff.includes("bestellbestaetigung") || betreff.includes("auftragsbestaetigung") ||
      betreff.includes("order confirmation")) {
    return "Bestellbestaetigung";
  }

  // Angebote
  if (betreff.includes("angebot") || betreff.includes("offerte") || betreff.includes("quote")) {
    return "Angebot_Anforderung";
  }

  // Reklamation (erweitert mit Maengelanzeige etc.)
  if (betreff.includes("reklamation") || betreff.includes("beschwerde") ||
      betreff.includes("mangel") || betreff.includes("maengelanzeige") ||
      betreff.includes("mängelanzeige") || betreff.includes("nicht korrekt") ||
      preview.includes("reklamation") || preview.includes("reklamieren") ||
      preview.includes("nicht in ordnung") || preview.includes("fehler festgestellt")) {
    return "Reklamation";
  }

  // Service/Reparatur (erweitert mit W4A-Erkenntnissen)
  if (betreff.includes("reparatur") || betreff.includes("defekt") ||
      betreff.includes("kaputt") || betreff.includes("funktioniert nicht") ||
      betreff.includes("problem mit") || betreff.includes("laesst sich nicht") ||
      betreff.includes("überprüfung") || betreff.includes("ueberpruefung") ||
      betreff.includes("sturmschaden") || betreff.includes("undicht") ||
      preview.includes("defekt") || preview.includes("reparatur") ||
      preview.includes("laesst sich nicht") || preview.includes("lässt sich nicht") ||
      preview.includes("klemmt") || preview.includes("haengt") || preview.includes("hängt") ||
      preview.includes("laeuft nicht") || preview.includes("läuft nicht") ||
      preview.includes("geht nicht") || preview.includes("kaum mehr") ||
      preview.includes("undicht") || preview.includes("zugluft")) {
    return "Serviceanfrage";
  }

  // Anforderung Unterlagen - NEU
  if (betreff.includes("bescheinigung") || betreff.includes("nachweis") ||
      betreff.includes("freistellung") || betreff.includes("unbedenklichkeit") ||
      preview.includes("bescheinigung") || preview.includes("nachweis anfordern")) {
    return "Anforderung_Unterlagen";
  }

  // Termine
  if (betreff.includes("termin") || betreff.includes("montage") || betreff.includes("aufmass")) {
    return "Terminanfrage";
  }

  // Kontaktformular
  if (von.includes("website@") || betreff.includes("kontaktanfrage")) {
    return "Kundenanfrage";
  }

  // Anfragen allgemein (inkl. Produkt-Anfragen ohne explizites "Anfrage")
  if (betreff.includes("anfrage") ||
      betreff.includes("maße fenster") || betreff.includes("masse fenster") ||
      betreff.includes("bilder fenster") || betreff.includes("bilder tür") ||
      betreff.includes("bitte um angebot") || betreff.includes("preisanfrage")) {
    return "Kundenanfrage";
  }

  // Newsletter/Werbung Indikatoren
  if (betreff.includes("newsletter") || von.includes("newsletter") ||
      von.includes("marketing") || von.includes("noreply") ||
      preview.includes("abmelden") || preview.includes("unsubscribe")) {
    return "Newsletter_Werbung";
  }

  // Antworten (Re: / AW:)
  if (betreff.startsWith("re:") || betreff.startsWith("aw:") ||
      betreff.startsWith("antw:") || betreff.startsWith("fwd:") ||
      betreff.startsWith("wg:")) {
    return "Antwort_oder_Weiterleitung";
  }

  return "Sonstiges";
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Only allow GET
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse parameters
  const mailbox = url.searchParams.get("mailbox") || "info@js-fenster.de";
  const action = url.searchParams.get("action") || "emails";
  const folder = url.searchParams.get("folder") || "inbox";
  const count = Math.min(parseInt(url.searchParams.get("count") || "50"), 200);

  try {
    const accessToken = await getAccessToken();

    // ==========================================================================
    // Action: List Folders
    // ==========================================================================
    if (action === "folders") {
      console.log(`Listing folders for ${mailbox}...`);
      const folders = await listAllFoldersRecursive(accessToken, mailbox);

      // Sort by path
      folders.sort((a, b) => a.path.localeCompare(b.path));

      return new Response(
        JSON.stringify({
          mailbox,
          anzahl_ordner: folders.length,
          ordner: folders,
        }, null, 2),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ==========================================================================
    // Action: Scan Emails (default)
    // ==========================================================================
    console.log(`Scanning ${count} emails from ${mailbox}/${folder}...`);

    // Resolve folder ID to display name (Change 7)
    const folderDisplayName = await resolveFolderName(accessToken, mailbox, folder);
    console.log(`Folder resolved: ${folder} -> ${folderDisplayName}`);

    const emails = await fetchEmails(accessToken, mailbox, folder, count);

    // Add category guess - now using resolved folder name!
    const emailsWithGuess = emails.map((email) => ({
      ...email,
      kategorie_vermutung: guessCategory(email, folderDisplayName),
    }));

    // Category statistics
    const kategorieStats: Record<string, number> = {};
    for (const email of emailsWithGuess) {
      const kat = email.kategorie_vermutung;
      kategorieStats[kat] = (kategorieStats[kat] || 0) + 1;
    }

    // Sort stats by count
    const sortedStats = Object.entries(kategorieStats)
      .sort((a, b) => b[1] - a[1])
      .map(([kategorie, anzahl]) => ({ kategorie, anzahl }));

    // JSON format
    return new Response(
      JSON.stringify({
        mailbox,
        folder,
        folder_name: folderDisplayName, // Change 7: resolved name
        anzahl: emails.length,
        statistik: sortedStats,
        emails: emailsWithGuess,
      }, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`Scan error: ${error}`);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
