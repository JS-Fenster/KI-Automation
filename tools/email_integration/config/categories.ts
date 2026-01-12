// =============================================================================
// E-Mail Kategorien Definition
// Erstellt: 2026-01-12
// =============================================================================

export interface EmailCategory {
  id: string;
  name: string;
  richtung: "eingehend" | "ausgehend" | "beide";
  beschreibung: string;
  typische_absender?: string[];
  erkennungsmerkmale: string[];
  wichtige_felder: string[];
  prioritaet: "hoch" | "mittel" | "niedrig";
}

// =============================================================================
// EINGEHENDE E-MAILS
// =============================================================================

export const EINGEHENDE_KATEGORIEN: EmailCategory[] = [
  {
    id: "Kundenanfrage",
    name: "Kundenanfrage",
    richtung: "eingehend",
    beschreibung: "Allgemeine Anfrage von Kunde oder Interessent",
    erkennungsmerkmale: [
      "Neue Anfrage ohne vorherigen Kontakt",
      "Fragen zu Produkten/Leistungen",
      "Kontaktformular-Eingaenge",
    ],
    wichtige_felder: [
      "email_von_email",
      "email_von_name",
      "inhalt_zusammenfassung",
      "empfaenger_telefon",
    ],
    prioritaet: "hoch",
  },
  {
    id: "Angebot_Anforderung",
    name: "Angebotsanforderung",
    richtung: "eingehend",
    beschreibung: "Kunde moechte ein Angebot erhalten",
    erkennungsmerkmale: [
      "Betreff enthaelt 'Angebot', 'Kosten', 'Preis'",
      "Anfrage fuer spezifische Leistung",
      "Massangaben, Produktbeschreibungen",
    ],
    wichtige_felder: [
      "email_von_email",
      "email_von_name",
      "inhalt_zusammenfassung",
      "empfaenger_strasse",
      "empfaenger_plz",
      "empfaenger_ort",
    ],
    prioritaet: "hoch",
  },
  {
    id: "Auftragserteilung",
    name: "Auftragserteilung",
    richtung: "eingehend",
    beschreibung: "Kunde erteilt Auftrag per E-Mail",
    erkennungsmerkmale: [
      "Bezug auf Angebot",
      "Explizite Beauftragung",
      "Bestellbestaetigung vom Kunden",
    ],
    wichtige_felder: [
      "bezug_angebot_nr",
      "email_von_email",
      "dokument_datum",
    ],
    prioritaet: "hoch",
  },
  {
    id: "Reklamation",
    name: "Reklamation",
    richtung: "eingehend",
    beschreibung: "Beschwerde, Maengelruege, Reklamation",
    erkennungsmerkmale: [
      "Betreff: 'Reklamation', 'Mangel', 'Beschwerde', 'Problem'",
      "Unzufriedenheit ausgedrueckt",
      "Bezug zu Auftrag/Lieferung",
    ],
    wichtige_felder: [
      "bezug_auftrag_nr",
      "inhalt_zusammenfassung",
      "dringlichkeit",
    ],
    prioritaet: "hoch",
  },
  {
    id: "Statusnachfrage",
    name: "Statusnachfrage",
    richtung: "eingehend",
    beschreibung: "Kunde fragt nach Status von Auftrag/Lieferung",
    erkennungsmerkmale: [
      "Fragen wie 'Wo bleibt...', 'Wann wird...'",
      "Bezug zu bestehendem Auftrag",
    ],
    wichtige_felder: ["bezug_auftrag_nr", "bezug_bestellung_nr"],
    prioritaet: "mittel",
  },
  {
    id: "Terminanfrage",
    name: "Terminanfrage",
    richtung: "eingehend",
    beschreibung: "Anfrage fuer Montage- oder Besprechungstermin",
    erkennungsmerkmale: [
      "Betreff: 'Termin', 'Montage', 'Aufmass'",
      "Terminvorschlaege",
      "Verfuegbarkeitsanfrage",
    ],
    wichtige_felder: ["liefertermin_datum", "bemerkungen"],
    prioritaet: "mittel",
  },
  {
    id: "Lieferant_Allgemein",
    name: "Lieferanten-Kommunikation (allgemein)",
    richtung: "eingehend",
    beschreibung: "Allgemeine Kommunikation mit Lieferanten",
    typische_absender: [
      "Lieferanten-Domains",
      "Grosshaendler",
      "Hersteller",
    ],
    erkennungsmerkmale: [
      "Absender ist bekannter Lieferant",
      "Keine Bestellung/Rechnung/Tracking",
    ],
    wichtige_felder: ["aussteller_firma", "inhalt_zusammenfassung"],
    prioritaet: "mittel",
  },
  {
    id: "Bestellbestaetigung",
    name: "Bestellbestaetigung",
    richtung: "eingehend",
    beschreibung: "Lieferant/Online-Haendler bestaetigt unsere Bestellung",
    typische_absender: [
      "amazon.de",
      "ebay.de",
      "wuerth.de",
      "Lieferanten",
    ],
    erkennungsmerkmale: [
      "Betreff: 'Bestellbestaetigung', 'Order Confirmation', 'Ihre Bestellung'",
      "Bestellnummer enthalten",
      "Artikelliste",
      "Liefertermin",
    ],
    wichtige_felder: [
      "dokument_nummer",
      "aussteller_firma",
      "positionen",
      "summe_brutto",
      "liefertermin_datum",
    ],
    prioritaet: "mittel",
  },
  {
    id: "Versandbestaetigung",
    name: "Versandbestaetigung",
    richtung: "eingehend",
    beschreibung: "Paket wurde versendet, enthaelt Tracking-Nummer",
    typische_absender: [
      "Lieferanten",
      "Online-Haendler",
      "Versanddienstleister",
    ],
    erkennungsmerkmale: [
      "Betreff: 'Versandbestaetigung', 'Ihre Sendung', 'Shipped'",
      "Tracking-Nummer enthalten",
      "Link zur Sendungsverfolgung",
    ],
    wichtige_felder: [
      "tracking_nummer",
      "tracking_versender",
      "bezug_bestellung_nr",
      "tracking_lieferdatum",
    ],
    prioritaet: "mittel",
  },
  {
    id: "Lieferstatus_Update",
    name: "Lieferstatus-Update",
    richtung: "eingehend",
    beschreibung: "Tracking-Updates von Paketdiensten",
    typische_absender: [
      "dhl.de",
      "dpd.de",
      "ups.com",
      "gls-group.eu",
      "hermes-privatkunden.de",
      "fedex.com",
    ],
    erkennungsmerkmale: [
      "Absender ist Paketdienst",
      "Betreff: 'Sendungsverfolgung', 'Ihr Paket', 'Delivery Update'",
      "Status-Update (unterwegs, zugestellt, etc.)",
    ],
    wichtige_felder: [
      "tracking_nummer",
      "tracking_versender",
      "tracking_status",
      "tracking_lieferdatum",
    ],
    prioritaet: "niedrig",
  },
  {
    id: "Rechnung_Eingang",
    name: "Eingangsrechnung",
    richtung: "eingehend",
    beschreibung: "Rechnung vom Lieferanten (meist als PDF-Anhang)",
    erkennungsmerkmale: [
      "Betreff: 'Rechnung', 'Invoice'",
      "PDF-Anhang vorhanden",
      "Rechnungsnummer im Text",
    ],
    wichtige_felder: [
      "dokument_nummer",
      "aussteller_firma",
      "summe_brutto",
      "faellig_am",
      "email_hat_anhaenge",
    ],
    prioritaet: "hoch",
  },
  {
    id: "Newsletter_Werbung",
    name: "Newsletter/Werbung",
    richtung: "eingehend",
    beschreibung: "Marketing, Spam, Newsletter - meist irrelevant",
    erkennungsmerkmale: [
      "Abmelden-Link vorhanden",
      "Marketing-Sprache",
      "Massenmailing-Header",
    ],
    wichtige_felder: [],
    prioritaet: "niedrig",
  },
  {
    id: "Sonstiges_Eingehend",
    name: "Sonstiges (eingehend)",
    richtung: "eingehend",
    beschreibung: "Nicht eindeutig zuordenbare eingehende E-Mail",
    erkennungsmerkmale: ["Keine der anderen Kategorien passt"],
    wichtige_felder: ["inhalt_zusammenfassung"],
    prioritaet: "niedrig",
  },
];

// =============================================================================
// AUSGEHENDE E-MAILS
// =============================================================================

export const AUSGEHENDE_KATEGORIEN: EmailCategory[] = [
  {
    id: "Antwort_Kunde",
    name: "Antwort an Kunde",
    richtung: "ausgehend",
    beschreibung: "Unsere Antwort auf Kundenanfrage",
    erkennungsmerkmale: [
      "Re: oder AW: im Betreff",
      "Antwort auf vorherige E-Mail",
    ],
    wichtige_felder: ["email_conversation_id"],
    prioritaet: "mittel",
  },
  {
    id: "Angebot_Gesendet",
    name: "Angebot gesendet",
    richtung: "ausgehend",
    beschreibung: "Wir senden Angebot an Kunden",
    erkennungsmerkmale: [
      "Betreff: 'Angebot', 'Offerte'",
      "PDF-Anhang (Angebot)",
      "Preise genannt",
    ],
    wichtige_felder: [
      "dokument_nummer",
      "empfaenger_firma",
      "summe_brutto",
      "email_hat_anhaenge",
    ],
    prioritaet: "hoch",
  },
  {
    id: "Auftragsbestaetigung_Gesendet",
    name: "Auftragsbestaetigung gesendet",
    richtung: "ausgehend",
    beschreibung: "AB an Kunden gesendet",
    erkennungsmerkmale: [
      "Betreff: 'Auftragsbestaetigung', 'AB'",
      "Bezug zu Auftrag",
    ],
    wichtige_felder: ["dokument_nummer", "bezug_angebot_nr", "empfaenger_firma"],
    prioritaet: "hoch",
  },
  {
    id: "Bestellung_Gesendet",
    name: "Bestellung gesendet",
    richtung: "ausgehend",
    beschreibung: "Wir bestellen bei Lieferant",
    erkennungsmerkmale: [
      "Betreff: 'Bestellung', 'Order'",
      "Empfaenger ist Lieferant",
      "Artikelliste",
    ],
    wichtige_felder: [
      "dokument_nummer",
      "empfaenger_firma",
      "positionen",
      "summe_brutto",
    ],
    prioritaet: "hoch",
  },
  {
    id: "Anfrage_Lieferant",
    name: "Anfrage an Lieferant",
    richtung: "ausgehend",
    beschreibung: "Preisanfrage oder allgemeine Anfrage an Lieferant",
    erkennungsmerkmale: [
      "Empfaenger ist Lieferant",
      "Anfrage-Charakter",
      "Preisanfrage",
    ],
    wichtige_felder: ["empfaenger_firma", "inhalt_zusammenfassung"],
    prioritaet: "mittel",
  },
  {
    id: "Rechnung_Gesendet",
    name: "Rechnung gesendet",
    richtung: "ausgehend",
    beschreibung: "Ausgangsrechnung an Kunden",
    erkennungsmerkmale: [
      "Betreff: 'Rechnung'",
      "PDF-Anhang (Rechnung)",
      "Rechnungsnummer",
    ],
    wichtige_felder: [
      "dokument_nummer",
      "empfaenger_firma",
      "summe_brutto",
      "email_hat_anhaenge",
    ],
    prioritaet: "hoch",
  },
  {
    id: "Mahnung_Gesendet",
    name: "Mahnung gesendet",
    richtung: "ausgehend",
    beschreibung: "Zahlungserinnerung oder Mahnung an Kunden",
    erkennungsmerkmale: [
      "Betreff: 'Mahnung', 'Zahlungserinnerung'",
      "Bezug zu offener Rechnung",
    ],
    wichtige_felder: [
      "bezug_rechnung_nr",
      "mahnung_stufe",
      "offener_betrag",
      "empfaenger_firma",
    ],
    prioritaet: "hoch",
  },
  {
    id: "Terminbestaetigung",
    name: "Terminbestaetigung",
    richtung: "ausgehend",
    beschreibung: "Montage- oder Besprechungstermin bestaetigt",
    erkennungsmerkmale: [
      "Betreff: 'Terminbestaetigung', 'Montage'",
      "Datum/Uhrzeit genannt",
    ],
    wichtige_felder: ["liefertermin_datum", "empfaenger_firma", "bemerkungen"],
    prioritaet: "mittel",
  },
  {
    id: "Sonstiges_Ausgehend",
    name: "Sonstiges (ausgehend)",
    richtung: "ausgehend",
    beschreibung: "Nicht eindeutig zuordenbare ausgehende E-Mail",
    erkennungsmerkmale: ["Keine der anderen Kategorien passt"],
    wichtige_felder: ["inhalt_zusammenfassung"],
    prioritaet: "niedrig",
  },
];

// =============================================================================
// ALLE KATEGORIEN
// =============================================================================

export const ALLE_KATEGORIEN: EmailCategory[] = [
  ...EINGEHENDE_KATEGORIEN,
  ...AUSGEHENDE_KATEGORIEN,
];

// Kategorie-IDs als Type
export type EmailCategoryId =
  | "Kundenanfrage"
  | "Angebot_Anforderung"
  | "Auftragserteilung"
  | "Reklamation"
  | "Statusnachfrage"
  | "Terminanfrage"
  | "Lieferant_Allgemein"
  | "Bestellbestaetigung"
  | "Versandbestaetigung"
  | "Lieferstatus_Update"
  | "Rechnung_Eingang"
  | "Newsletter_Werbung"
  | "Sonstiges_Eingehend"
  | "Antwort_Kunde"
  | "Angebot_Gesendet"
  | "Auftragsbestaetigung_Gesendet"
  | "Bestellung_Gesendet"
  | "Anfrage_Lieferant"
  | "Rechnung_Gesendet"
  | "Mahnung_Gesendet"
  | "Terminbestaetigung"
  | "Sonstiges_Ausgehend";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getCategoryById(id: string): EmailCategory | undefined {
  return ALLE_KATEGORIEN.find((cat) => cat.id === id);
}

export function getKategorienFuerRichtung(
  richtung: "eingehend" | "ausgehend"
): EmailCategory[] {
  if (richtung === "eingehend") {
    return EINGEHENDE_KATEGORIEN;
  }
  return AUSGEHENDE_KATEGORIEN;
}

export function getKategorieNamen(): string[] {
  return ALLE_KATEGORIEN.map((cat) => cat.id);
}

// =============================================================================
// BEKANNTE ABSENDER (fuer schnellere Kategorisierung)
// =============================================================================

export const BEKANNTE_PAKETDIENSTE = [
  "dhl.de",
  "dpd.de",
  "ups.com",
  "gls-group.eu",
  "hermes-privatkunden.de",
  "fedex.com",
  "trans-o-flex.com",
];

export const BEKANNTE_ONLINEHAENDLER = [
  "amazon.de",
  "amazon.com",
  "ebay.de",
  "ebay.com",
  "otto.de",
];

export function istPaketdienstAbsender(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return BEKANNTE_PAKETDIENSTE.some((pd) => domain?.includes(pd));
}

export function istOnlinehaendlerAbsender(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return BEKANNTE_ONLINEHAENDLER.some((oh) => domain?.includes(oh));
}
