import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SYSTEM_PROMPT } from "./prompts.ts";

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req: Request) => {
  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract PDF from request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // Step 1: OCR with Mistral
    const ocrText = await extractTextWithMistral(file);
    console.log(`OCR extracted ${ocrText.length} characters`);

    // Step 2: Categorize + Extract with GPT-5.2
    const extractedData = await categorizeAndExtract(ocrText);
    console.log(`Categorized as: ${extractedData.kategorie}`);

    // Step 3: Upload PDF to Storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const storagePath = `${extractedData.kategorie}/${timestamp}_${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const dokumentUrl = uploadData.path;
    console.log(`Uploaded to: ${dokumentUrl}`);

    // Step 4: Insert into database
    const dbRecord = buildDatabaseRecord(extractedData, ocrText, dokumentUrl);

    const { data: insertData, error: insertError } = await supabase
      .from("documents")
      .insert(dbRecord)
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log(`Inserted with ID: ${insertData.id}`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        id: insertData.id,
        kategorie: extractedData.kategorie,
        dokument_url: dokumentUrl,
        extraktions_qualitaet: extractedData.extraktions_qualitaet,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing document:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

// =============================================================================
// MISTRAL OCR
// =============================================================================

async function extractTextWithMistral(file: File): Promise<string> {
  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  // Use Mistral's dedicated OCR endpoint for PDFs
  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        document_url: `data:application/pdf;base64,${base64}`,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral OCR failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // OCR returns pages array with markdown content
  if (result.pages && Array.isArray(result.pages)) {
    return result.pages.map((page: { markdown: string }) => page.markdown).join("\n\n---\n\n");
  }

  // Fallback if structure is different
  return JSON.stringify(result);
}

// =============================================================================
// GPT-5.2 CATEGORIZATION + EXTRACTION
// =============================================================================

async function categorizeAndExtract(ocrText: string): Promise<ExtractedDocument> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Analysiere das folgende Dokument und extrahiere alle relevanten Informationen:\n\n${ocrText}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "document_extraction",
          strict: true,
          schema: EXTRACTION_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI extraction failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  return JSON.parse(content) as ExtractedDocument;
}

// =============================================================================
// DATABASE RECORD BUILDER
// =============================================================================

function buildDatabaseRecord(
  extracted: ExtractedDocument,
  ocrText: string,
  dokumentUrl: string
): Record<string, unknown> {
  return {
    // Meta
    kategorie: extracted.kategorie,
    dokument_url: dokumentUrl,
    ocr_text: ocrText,
    extraktions_zeitstempel: new Date().toISOString(),
    extraktions_qualitaet: extracted.extraktions_qualitaet,
    extraktions_hinweise: extracted.extraktions_hinweise,

    // Common fields
    dokument_datum: extracted.dokument_datum,
    dokument_nummer: extracted.dokument_nummer,
    dokument_richtung: extracted.dokument_richtung,

    // Aussteller
    aussteller_firma: extracted.aussteller?.firma,
    aussteller_name: extracted.aussteller?.name,
    aussteller_strasse: extracted.aussteller?.strasse,
    aussteller_plz: extracted.aussteller?.plz,
    aussteller_ort: extracted.aussteller?.ort,
    aussteller_telefon: extracted.aussteller?.telefon,
    aussteller_email: extracted.aussteller?.email,
    aussteller_ust_id: extracted.aussteller?.ust_id,

    // Empfaenger
    empfaenger_firma: extracted.empfaenger?.firma,
    empfaenger_vorname: extracted.empfaenger?.vorname,
    empfaenger_nachname: extracted.empfaenger?.nachname,
    empfaenger_strasse: extracted.empfaenger?.strasse,
    empfaenger_plz: extracted.empfaenger?.plz,
    empfaenger_ort: extracted.empfaenger?.ort,
    empfaenger_telefon: extracted.empfaenger?.telefon,
    empfaenger_email: extracted.empfaenger?.email,
    empfaenger_kundennummer: extracted.empfaenger?.kundennummer,

    // Betraege
    summe_netto: extracted.summe_netto,
    mwst_betrag: extracted.mwst_betrag,
    summe_brutto: extracted.summe_brutto,
    offener_betrag: extracted.offener_betrag,

    // Positionen (als JSONB)
    positionen: extracted.positionen,

    // Zahlungsbedingungen
    zahlungsziel_tage: extracted.zahlungsziel_tage,
    faellig_am: extracted.faellig_am,
    skonto_prozent: extracted.skonto_prozent,
    skonto_tage: extracted.skonto_tage,

    // Bank
    bank_name: extracted.bank?.name,
    bank_iban: extracted.bank?.iban,
    bank_bic: extracted.bank?.bic,

    // Lieferung
    liefertermin_datum: extracted.liefertermin_datum,
    lieferzeit_wochen: extracted.lieferzeit_wochen,

    // Bezuege
    bezug_angebot_nr: extracted.bezug?.angebot_nr,
    bezug_bestellung_nr: extracted.bezug?.bestellung_nr,
    bezug_lieferschein_nr: extracted.bezug?.lieferschein_nr,
    bezug_rechnung_nr: extracted.bezug?.rechnung_nr,
    bezug_auftrag_nr: extracted.bezug?.auftrag_nr,
    bezug_projekt: extracted.bezug?.projekt,

    // Mahnung spezifisch
    mahnung_stufe: extracted.mahnung_stufe,
    mahngebuehren: extracted.mahngebuehren,
    verzugszinsen_betrag: extracted.verzugszinsen_betrag,
    gesamtforderung: extracted.gesamtforderung,

    // Sonstiges
    betreff: extracted.betreff,
    inhalt_zusammenfassung: extracted.inhalt_zusammenfassung,
    bemerkungen: extracted.bemerkungen,
    dringlichkeit: extracted.dringlichkeit,
  };
}

// =============================================================================
// TYPES
// =============================================================================

interface ExtractedDocument {
  kategorie: string;
  extraktions_qualitaet: "hoch" | "mittel" | "niedrig";
  extraktions_hinweise: string[];

  dokument_datum?: string;
  dokument_nummer?: string;
  dokument_richtung?: "eingehend" | "ausgehend";

  aussteller?: {
    firma?: string;
    name?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    telefon?: string;
    email?: string;
    ust_id?: string;
  };

  empfaenger?: {
    firma?: string;
    vorname?: string;
    nachname?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    telefon?: string;
    email?: string;
    kundennummer?: string;
  };

  positionen?: Array<{
    pos_nr?: number;
    beschreibung?: string;
    menge?: number;
    einheit?: string;
    einzelpreis_netto?: number;
    gesamtpreis_netto?: number;
  }>;

  summe_netto?: number;
  mwst_betrag?: number;
  summe_brutto?: number;
  offener_betrag?: number;

  zahlungsziel_tage?: number;
  faellig_am?: string;
  skonto_prozent?: number;
  skonto_tage?: number;

  bank?: {
    name?: string;
    iban?: string;
    bic?: string;
  };

  liefertermin_datum?: string;
  lieferzeit_wochen?: number;

  bezug?: {
    angebot_nr?: string;
    bestellung_nr?: string;
    lieferschein_nr?: string;
    rechnung_nr?: string;
    auftrag_nr?: string;
    projekt?: string;
  };

  mahnung_stufe?: number;
  mahngebuehren?: number;
  verzugszinsen_betrag?: number;
  gesamtforderung?: number;

  betreff?: string;
  inhalt_zusammenfassung?: string;
  bemerkungen?: string;
  dringlichkeit?: "hoch" | "mittel" | "niedrig";
}

// =============================================================================
// JSON SCHEMA FOR STRUCTURED OUTPUT (GPT-5.2 strict mode compatible)
// =============================================================================

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    kategorie: {
      type: "string",
      enum: [
        "Preisanfrage",
        "Angebot",
        "Auftragsbestaetigung",
        "Bestellung",
        "Eingangslieferschein",
        "Eingangsrechnung",
        "Kundenlieferschein",
        "Montageauftrag",
        "Ausgangsrechnung",
        "Zahlungserinnerung",
        "Mahnung",
        "Notiz",
        "Skizze",
        "Brief_an_Kunde",
        "Brief_von_Kunde",
        "Brief_von_Finanzamt",
        "Brief_von_Amt",
        "Sonstiges_Dokument",
      ],
    },
    extraktions_qualitaet: {
      type: "string",
      enum: ["hoch", "mittel", "niedrig"],
    },
    extraktions_hinweise: {
      type: "array",
      items: { type: "string" },
    },
    dokument_datum: { type: ["string", "null"] },
    dokument_nummer: { type: ["string", "null"] },
    dokument_richtung: { type: ["string", "null"] },
    aussteller: {
      type: ["object", "null"],
      properties: {
        firma: { type: ["string", "null"] },
        name: { type: ["string", "null"] },
        strasse: { type: ["string", "null"] },
        plz: { type: ["string", "null"] },
        ort: { type: ["string", "null"] },
        telefon: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        ust_id: { type: ["string", "null"] },
      },
      required: ["firma", "name", "strasse", "plz", "ort", "telefon", "email", "ust_id"],
      additionalProperties: false,
    },
    empfaenger: {
      type: ["object", "null"],
      properties: {
        firma: { type: ["string", "null"] },
        vorname: { type: ["string", "null"] },
        nachname: { type: ["string", "null"] },
        strasse: { type: ["string", "null"] },
        plz: { type: ["string", "null"] },
        ort: { type: ["string", "null"] },
        telefon: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        kundennummer: { type: ["string", "null"] },
      },
      required: ["firma", "vorname", "nachname", "strasse", "plz", "ort", "telefon", "email", "kundennummer"],
      additionalProperties: false,
    },
    positionen: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: {
          pos_nr: { type: ["number", "null"] },
          beschreibung: { type: ["string", "null"] },
          menge: { type: ["number", "null"] },
          einheit: { type: ["string", "null"] },
          einzelpreis_netto: { type: ["number", "null"] },
          gesamtpreis_netto: { type: ["number", "null"] },
        },
        required: ["pos_nr", "beschreibung", "menge", "einheit", "einzelpreis_netto", "gesamtpreis_netto"],
        additionalProperties: false,
      },
    },
    summe_netto: { type: ["number", "null"] },
    mwst_betrag: { type: ["number", "null"] },
    summe_brutto: { type: ["number", "null"] },
    offener_betrag: { type: ["number", "null"] },
    zahlungsziel_tage: { type: ["number", "null"] },
    faellig_am: { type: ["string", "null"] },
    skonto_prozent: { type: ["number", "null"] },
    skonto_tage: { type: ["number", "null"] },
    bank: {
      type: ["object", "null"],
      properties: {
        name: { type: ["string", "null"] },
        iban: { type: ["string", "null"] },
        bic: { type: ["string", "null"] },
      },
      required: ["name", "iban", "bic"],
      additionalProperties: false,
    },
    liefertermin_datum: { type: ["string", "null"] },
    lieferzeit_wochen: { type: ["number", "null"] },
    bezug: {
      type: ["object", "null"],
      properties: {
        angebot_nr: { type: ["string", "null"] },
        bestellung_nr: { type: ["string", "null"] },
        lieferschein_nr: { type: ["string", "null"] },
        rechnung_nr: { type: ["string", "null"] },
        auftrag_nr: { type: ["string", "null"] },
        projekt: { type: ["string", "null"] },
      },
      required: ["angebot_nr", "bestellung_nr", "lieferschein_nr", "rechnung_nr", "auftrag_nr", "projekt"],
      additionalProperties: false,
    },
    mahnung_stufe: { type: ["number", "null"] },
    mahngebuehren: { type: ["number", "null"] },
    verzugszinsen_betrag: { type: ["number", "null"] },
    gesamtforderung: { type: ["number", "null"] },
    betreff: { type: ["string", "null"] },
    inhalt_zusammenfassung: { type: ["string", "null"] },
    bemerkungen: { type: ["string", "null"] },
    dringlichkeit: { type: ["string", "null"] },
  },
  required: [
    "kategorie",
    "extraktions_qualitaet",
    "extraktions_hinweise",
    "dokument_datum",
    "dokument_nummer",
    "dokument_richtung",
    "aussteller",
    "empfaenger",
    "positionen",
    "summe_netto",
    "mwst_betrag",
    "summe_brutto",
    "offener_betrag",
    "zahlungsziel_tage",
    "faellig_am",
    "skonto_prozent",
    "skonto_tage",
    "bank",
    "liefertermin_datum",
    "lieferzeit_wochen",
    "bezug",
    "mahnung_stufe",
    "mahngebuehren",
    "verzugszinsen_betrag",
    "gesamtforderung",
    "betreff",
    "inhalt_zusammenfassung",
    "bemerkungen",
    "dringlichkeit",
  ],
  additionalProperties: false,
};
