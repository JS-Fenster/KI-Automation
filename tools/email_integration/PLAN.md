# E-Mail Integration - Projektdokumentation

> **Projekt:** E-Mail-Kanal als Input fuer Dokumentenmanagement
> **Status:** Phase 4 abgeschlossen (email-webhook deployed) - Secrets setzen, Subscription erstellen
> **Erstellt:** 2026-01-12
> **Letzte Aktualisierung:** 2026-01-12

---

## Inhaltsverzeichnis

1. [Projektziel](#projektziel)
2. [Anforderungen](#anforderungen)
3. [Architektur](#architektur)
4. [E-Mail-Kategorien](#e-mail-kategorien)
5. [Datenbank-Schema](#datenbank-schema)
6. [Implementierungsphasen](#implementierungsphasen)
7. [Fortschritt](#fortschritt)
8. [Probleme und Loesungen](#probleme-und-loesungen)
9. [Technische Details](#technische-details)
10. [Konfiguration](#konfiguration)
11. [Testplan](#testplan)
12. [Changelog](#changelog)

---

## Projektziel

Automatische Verarbeitung von E-Mails aus mehreren Postfaechern (Microsoft 365/Exchange) als zweiter Input-Kanal fuer die zentrale `documents`-Tabelle in Supabase.

### Kernfunktionen

1. **E-Mail-Empfang:** Eingehende UND ausgehende E-Mails erfassen
2. **Kategorisierung:** LLM-gestuetzte Klassifizierung (GPT-5.2)
3. **Extraktion:** Strukturierte Datenextraktion je nach Kategorie
4. **Anhang-Verarbeitung:** PDF-Anhaenge durch bestehende `process-document` Pipeline
5. **Speicherung:** In `documents`-Tabelle mit Typ `email`
6. **Nachvollziehbarkeit:** Kompletter E-Mail-Verkehr dokumentiert

### Abgrenzung zum Scanner-Kanal

| Aspekt | Scanner-Kanal | E-Mail-Kanal |
|--------|---------------|--------------|
| Input | PDF-Dateien | E-Mails + Anhaenge |
| Trigger | FileSystemWatcher | Microsoft Graph Webhook |
| OCR | Mistral | Nicht noetig (Text vorhanden) |
| Anhaenge | - | → Scanner-Pipeline |
| dokument_typ | `scan` | `email` |

---

## Anforderungen

### Funktionale Anforderungen

| ID | Anforderung | Prioritaet | Status |
|----|-------------|------------|--------|
| F01 | Eingehende E-Mails verarbeiten | Hoch | Offen |
| F02 | Ausgehende E-Mails verarbeiten | Hoch | Offen |
| F03 | Mehrere Postfaecher unterstuetzen (15+) | Hoch | Offen |
| F04 | LLM-Kategorisierung | Hoch | Offen |
| F05 | Strukturierte Extraktion | Hoch | Offen |
| F06 | PDF-Anhaenge separat verarbeiten | Hoch | Offen |
| F07 | Bestellbestaetigungen erkennen | Mittel | Offen |
| F08 | Tracking/Lieferstatus erkennen | Mittel | Offen |
| F09 | Deduplizierung (keine doppelten E-Mails) | Hoch | Offen |
| F10 | E-Mail ↔ Anhang Verknuepfung | Hoch | Offen |

### Nicht-funktionale Anforderungen

| ID | Anforderung | Wert |
|----|-------------|------|
| NF01 | Verarbeitungszeit pro E-Mail | < 30 Sekunden |
| NF02 | Volumen | ~50 E-Mails/Tag (info@) + weitere |
| NF03 | Verfuegbarkeit | 99% (abhaengig von Microsoft) |
| NF04 | Latenz (neue E-Mail → DB) | < 5 Minuten |

### Technische Vorgaben

- **E-Mail-Provider:** Microsoft 365 / Exchange
- **API:** Microsoft Graph API
- **Backend:** Supabase Edge Functions (KEIN n8n)
- **LLM:** OpenAI GPT-5.2
- **Datenbank:** Bestehende `documents`-Tabelle erweitern

---

## Architektur

### Uebersichtsdiagramm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Microsoft 365                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │ info@        │  │ buchhaltung@ │  │ ...weitere   │  (15 Postfaecher)     │
│  │ js-fenster.de│  │ js-fenster.de│  │ Postfaecher  │                       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                       │
│         │                 │                 │                                │
│         └────────────────┬┴─────────────────┘                                │
│                          │                                                   │
│                          ▼                                                   │
│              ┌───────────────────────┐                                       │
│              │ Microsoft Graph API   │                                       │
│              │ Change Notifications  │                                       │
│              └───────────┬───────────┘                                       │
└──────────────────────────┼───────────────────────────────────────────────────┘
                           │ Webhook POST
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Supabase (js-fenster-erp)                            │
│                                                                              │
│  ┌─────────────────────┐     ┌─────────────────────┐                        │
│  │ Edge Function:      │     │ Edge Function:      │                        │
│  │ email-webhook       │────▶│ process-email       │                        │
│  │ (Empfaengt          │     │ (Verarbeitung)      │                        │
│  │  Notification)      │     │                     │                        │
│  └─────────────────────┘     └──────────┬──────────┘                        │
│                                         │                                    │
│                    ┌────────────────────┼────────────────────┐              │
│                    │                    │                    │              │
│                    ▼                    ▼                    ▼              │
│           ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │
│           │ OpenAI API   │     │ Storage      │     │ PostgreSQL   │       │
│           │ GPT-5.2      │     │ (E-Mails)    │     │ documents    │       │
│           │ Kategoris.   │     │              │     │ Tabelle      │       │
│           │ + Extraktion │     │              │     │              │       │
│           └──────────────┘     └──────────────┘     └──────────────┘       │
│                                                              ▲              │
│                                                              │              │
│  ┌─────────────────────┐                                     │              │
│  │ Edge Function:      │     Anhaenge (PDF)                  │              │
│  │ process-document    │─────────────────────────────────────┘              │
│  │ (bestehend)         │     mit bezug_email_id                             │
│  └─────────────────────┘                                                    │
│                                                                              │
│  ┌─────────────────────┐                                                    │
│  │ Scheduled Function: │     Alle 2 Tage                                    │
│  │ renew-subscriptions │     Subscriptions erneuern                         │
│  └─────────────────────┘                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Komponenten

| Komponente | Funktion | Dateien |
|------------|----------|---------|
| `email-webhook` | Empfaengt Microsoft Graph Notifications | `edge-functions/email-webhook/index.ts` |
| `process-email` | Verarbeitet E-Mail (Kategorisierung, Extraktion) | `edge-functions/process-email/` |
| `renew-subscriptions` | Erneuert Graph Subscriptions (scheduled) | `edge-functions/renew-subscriptions/` |
| `process-document` | Bestehend - fuer Anhaenge | `../dokumentenmanagement/edge-function/` |

### Datenfluss

1. **Neue E-Mail kommt an** (Inbox oder Sent)
2. **Microsoft Graph** sendet Notification an `email-webhook`
3. **email-webhook** validiert und ruft `process-email` auf
4. **process-email**:
   - Holt E-Mail-Details via Graph API
   - Kategorisiert mit GPT-5.2
   - Extrahiert strukturierte Daten
   - Speichert E-Mail-Body in Storage (optional)
   - Speichert Metadaten + extrahierte Daten in `documents`
5. **Bei Anhaengen**:
   - Fuer jeden PDF-Anhang: `process-document` aufrufen
   - Mit `bezug_email_id` verknuepfen

---

## E-Mail-Kategorien

### Eingehende E-Mails

| Nr | Kategorie | Beschreibung | Typische Absender | Wichtige Felder |
|----|-----------|--------------|-------------------|-----------------|
| 1 | `Kundenanfrage` | Allgemeine Anfrage von Kunde/Interessent | Privat/Firmen | Kontaktdaten, Anfrage-Text |
| 2 | `Angebot_Anforderung` | Kunde moechte Angebot | Kunde | Kontakt, gewuenschte Leistung |
| 3 | `Auftragserteilung` | Kunde erteilt Auftrag per E-Mail | Kunde | Bezug zu Angebot, Kundendaten |
| 4 | `Reklamation` | Beschwerde, Maengelruege | Kunde | Auftragsbezug, Mangel-Beschreibung |
| 5 | `Statusnachfrage` | "Wo bleibt mein Auftrag/Lieferung?" | Kunde | Auftragsbezug |
| 6 | `Terminanfrage` | Montage-/Besprechungstermin | Kunde | Gewuenschtes Datum |
| 7 | `Lieferant_Allgemein` | Allgemeine Kommunikation mit Lieferant | Lieferant | Firmenname, Ansprechpartner |
| 8 | `Bestellbestaetigung` | Lieferant bestaetigt unsere Bestellung | Lieferant/Onlinehaendler | Bestellnummer, Positionen, Liefertermin |
| 9 | `Versandbestaetigung` | Paket wurde versendet | Lieferant/Versender | Tracking-Nummer, Versanddatum |
| 10 | `Lieferstatus_Update` | Tracking-Updates von Paketdiensten | DHL, DPD, UPS, etc. | Tracking-Nr, Status, vorr. Lieferdatum |
| 11 | `Rechnung_Eingang` | Rechnung vom Lieferanten (oft als Anhang) | Lieferant | Rechnungsnr, Betrag → Anhang verarbeiten |
| 12 | `Newsletter_Werbung` | Marketing, Spam, Newsletter | Diverse | Ignorieren oder niedrige Prio |
| 13 | `Sonstiges_Eingehend` | Nicht zuordenbar | - | Zusammenfassung |

### Ausgehende E-Mails

| Nr | Kategorie | Beschreibung | Typische Empfaenger | Wichtige Felder |
|----|-----------|--------------|---------------------|-----------------|
| 14 | `Antwort_Kunde` | Unsere Antwort an Kunden | Kunde | Bezug zur Anfrage |
| 15 | `Angebot_Gesendet` | Wir senden Angebot | Kunde | Angebotsnr, Kunde |
| 16 | `Auftragsbestaetigung_Gesendet` | AB an Kunden gesendet | Kunde | Auftragsnr |
| 17 | `Bestellung_Gesendet` | Wir bestellen bei Lieferant | Lieferant | Bestellpositionen |
| 18 | `Anfrage_Lieferant` | Preisanfrage an Lieferant | Lieferant | Angefragte Artikel |
| 19 | `Rechnung_Gesendet` | Rechnung an Kunden | Kunde | Rechnungsnr → Anhang |
| 20 | `Mahnung_Gesendet` | Zahlungserinnerung/Mahnung | Kunde | Mahnstufe, offener Betrag |
| 21 | `Terminbestaetigung` | Montage-/Besprechungstermin bestaetigt | Kunde | Datum, Uhrzeit |
| 22 | `Sonstiges_Ausgehend` | Nicht zuordenbar | - | Zusammenfassung |

### Besonderheiten bei Bestellungen/Tracking

**Bestellbestaetigungen erkennen an:**
- Absender: Amazon, eBay, Wuerth, Lieferanten-Domains
- Betreff: "Bestellbestaetigung", "Order Confirmation", "Ihre Bestellung"
- Inhalt: Bestellnummer, Artikelliste, Liefertermin

**Tracking-E-Mails erkennen an:**
- Absender: DHL, DPD, UPS, GLS, Hermes, FedEx
- Betreff: "Sendungsverfolgung", "Ihr Paket", "Shipment Update"
- Inhalt: Tracking-Nummer, Status, voraussichtliches Lieferdatum

**Extraktion bei Tracking:**
```json
{
  "tracking_nummer": "1234567890",
  "versender": "DHL",
  "status": "In Zustellung",
  "voraussichtliche_lieferung": "2026-01-13",
  "bezug_bestellung_nr": "B-2024-001234"
}
```

---

## Datenbank-Schema

### Erweiterung der `documents`-Tabelle

```sql
-- =====================================================
-- E-Mail Integration: Schema-Erweiterung
-- Migration: 001_add_email_columns.sql
-- Datum: 2026-01-12
-- =====================================================

-- Dokument-Typ zur Unterscheidung
ALTER TABLE documents ADD COLUMN IF NOT EXISTS dokument_typ TEXT DEFAULT 'scan';
-- Moegliche Werte: 'scan', 'email', 'upload'

-- E-Mail Identifikation (fuer Deduplizierung)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_message_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_conversation_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_internet_message_id TEXT;

-- E-Mail Metadaten
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_richtung TEXT;
-- 'eingehend' | 'ausgehend'

ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_postfach TEXT;
-- z.B. 'info@js-fenster.de'

-- Absender
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_von_email TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_von_name TEXT;

-- Empfaenger (JSONB Arrays fuer mehrere)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_an_liste JSONB;
-- Format: [{"email": "...", "name": "..."}, ...]

ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_cc_liste JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_bcc_liste JSONB;

-- Inhalt
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_betreff TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_body_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_body_html TEXT;

-- Zeitstempel
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_empfangen_am TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_gesendet_am TIMESTAMPTZ;

-- Anhaenge
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_hat_anhaenge BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_anhaenge_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_anhaenge_meta JSONB;
-- Format: [{"filename": "...", "size": 1234, "content_type": "application/pdf", "document_id": "uuid"}, ...]

-- Status
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_ist_gelesen BOOLEAN;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_ist_beantwortet BOOLEAN;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_wichtigkeit TEXT;
-- 'low' | 'normal' | 'high'

-- Microsoft-spezifisch
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_ms_kategorien JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_ms_flag JSONB;

-- Tracking-spezifisch (fuer Lieferstatus)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tracking_nummer TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tracking_versender TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tracking_status TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tracking_lieferdatum DATE;

-- Verknuepfung: Anhang → E-Mail
ALTER TABLE documents ADD COLUMN IF NOT EXISTS bezug_email_id UUID REFERENCES documents(id);

-- =====================================================
-- Constraints und Indizes
-- =====================================================

-- Unique Constraint fuer Deduplizierung
ALTER TABLE documents ADD CONSTRAINT IF NOT EXISTS unique_email_message_id
  UNIQUE (email_message_id)
  WHERE email_message_id IS NOT NULL;

-- Indizes fuer haeufige Abfragen
CREATE INDEX IF NOT EXISTS idx_documents_dokument_typ ON documents(dokument_typ);
CREATE INDEX IF NOT EXISTS idx_documents_email_postfach ON documents(email_postfach);
CREATE INDEX IF NOT EXISTS idx_documents_email_richtung ON documents(email_richtung);
CREATE INDEX IF NOT EXISTS idx_documents_email_von ON documents(email_von_email);
CREATE INDEX IF NOT EXISTS idx_documents_email_empfangen ON documents(email_empfangen_am);
CREATE INDEX IF NOT EXISTS idx_documents_bezug_email ON documents(bezug_email_id);
CREATE INDEX IF NOT EXISTS idx_documents_tracking_nummer ON documents(tracking_nummer);
```

### Beispiel-Datensatz: Eingehende E-Mail

```json
{
  "id": "uuid-1234",
  "created_at": "2026-01-12T10:30:00Z",
  "dokument_typ": "email",
  "kategorie": "Bestellbestaetigung",

  "email_message_id": "AAMkAGI2...",
  "email_conversation_id": "AAQkAGI2...",
  "email_richtung": "eingehend",
  "email_postfach": "info@js-fenster.de",

  "email_von_email": "bestellung@amazon.de",
  "email_von_name": "Amazon.de",
  "email_an_liste": [{"email": "info@js-fenster.de", "name": "J.S. Fenster"}],

  "email_betreff": "Ihre Bestellung bei Amazon.de (#302-1234567-8901234)",
  "email_body_text": "Vielen Dank fuer Ihre Bestellung...",
  "email_empfangen_am": "2026-01-12T10:28:00Z",

  "email_hat_anhaenge": false,
  "email_anhaenge_count": 0,

  "extraktions_qualitaet": "hoch",
  "dokument_nummer": "302-1234567-8901234",
  "aussteller_firma": "Amazon EU S.a.r.l.",

  "inhalt_zusammenfassung": "Bestellbestaetigung fuer Artikel XYZ, Lieferung voraussichtlich 15.01.2026"
}
```

---

## Implementierungsphasen

### Phase 1: Grundlagen ✅ (2026-01-12)
- [x] Projektdokumentation erstellen
- [x] Ordnerstruktur anlegen
- [x] E-Mail-Kategorien definieren
- [x] Datenbank-Schema planen
- [x] Initiales Commit

### Phase 2: Azure Setup ✅ (2026-01-12)
- [x] Azure App Registration erstellen
- [x] API Permissions konfigurieren (Mail.Read, Mail.ReadWrite)
- [x] Admin Consent erteilt
- [x] Client Secret generieren
- [x] Tenant-ID, Client-ID dokumentieren (siehe unten)
- [ ] Service Principal Rechte fuer alle 15 Postfaecher pruefen

### Phase 3: Datenbank-Migration ✅ (2026-01-12)
- [x] Migration SQL finalisieren
- [x] Migration auf Supabase anwenden (001_add_email_columns.sql)
- [x] Indizes erstellt (8 neue Indizes)
- [ ] RLS Policies aktualisieren (falls noetig)

### Phase 4: Edge Function - email-webhook ✅ (2026-01-12)
- [x] Webhook-Endpunkt implementieren
- [x] Microsoft Validation Token Handler
- [x] Notification Parser + E-Mail abrufen
- [x] Speicherung in documents-Tabelle
- [x] Deployed (v1)
- [ ] GPT-Kategorisierung (ausgelagert nach process-email)

### Phase 5: Edge Function - process-email
- [ ] E-Mail via Graph API abrufen
- [ ] GPT-5.2 Kategorisierungs-Prompt
- [ ] GPT-5.2 Extraktions-Prompt (je Kategorie)
- [ ] Speicherung in documents-Tabelle
- [ ] E-Mail-Body in Storage speichern (optional)

### Phase 6: Anhang-Verarbeitung
- [ ] Anhaenge aus E-Mail extrahieren
- [ ] PDF-Filter (nur PDFs verarbeiten)
- [ ] process-document aufrufen mit bezug_email_id
- [ ] Verknuepfung in email_anhaenge_meta speichern

### Phase 7: Subscription Management
- [ ] Subscription fuer jedes Postfach erstellen
- [ ] Subscription fuer Inbox UND SentItems
- [ ] renew-subscriptions Scheduled Function
- [ ] Fehlerbehandlung bei abgelaufenen Subscriptions

### Phase 8: Mehrere Postfaecher
- [ ] Konfiguration fuer 15 Postfaecher
- [ ] Postfach-Liste in Supabase Secrets oder DB
- [ ] Skalierungstests

### Phase 9: Testing & Stabilisierung
- [ ] Unit Tests fuer Kategorisierung
- [ ] Integration Tests End-to-End
- [ ] Fehlerszenarien testen
- [ ] Performance-Monitoring

### Phase 10: Produktivsetzung
- [ ] Schrittweise Aktivierung (erst info@, dann weitere)
- [ ] Monitoring Dashboard
- [ ] Alerting bei Fehlern
- [ ] Dokumentation finalisieren

---

## Fortschritt

### Erledigte Aufgaben

| Datum | Aufgabe | Details |
|-------|---------|---------|
| 2026-01-12 | Projektplanung | Anforderungen mit Andreas besprochen |
| 2026-01-12 | Ordnerstruktur | `tools/email_integration/` angelegt |
| 2026-01-12 | PLAN.md | Diese Dokumentation erstellt |
| 2026-01-12 | Kategorien | 22 E-Mail-Kategorien definiert |
| 2026-01-12 | DB-Schema | Migration geplant |
| 2026-01-12 | **Azure App Registration** | `JSFenster-Email-Integration` erstellt |
| 2026-01-12 | **API Permissions** | Mail.Read + Mail.ReadWrite (Application) |
| 2026-01-12 | **Admin Consent** | Fuer J.S. Fenster & Tueren erteilt |
| 2026-01-12 | **Client Secret** | Erstellt, gueltig bis 11.07.2026 |
| 2026-01-12 | **Git Commit** | Phase 1+2 committed (168313d) |
| 2026-01-12 | **DB-Migration** | 001_add_email_columns.sql angewendet |
| 2026-01-12 | **email-webhook** | Edge Function deployed (v1) |
| 2026-01-12 | **Subscription Script** | manage-subscriptions.ts erstellt |

### Ausstehende Aufgaben

| Prioritaet | Aufgabe | Abhaengigkeit |
|------------|---------|---------------|
| 1 | **Supabase Secrets setzen** | ⚠️ Manuell im Dashboard! |
| 2 | **Subscription erstellen** | Secrets gesetzt, dann Script ausfuehren |
| 5 | process-email Function | email-webhook |
| 6 | Anhang-Pipeline | process-email |
| 7 | Subscription Management | Alle Functions |
| 8 | Postfach-Rollout | Alles getestet |

---

## Probleme und Loesungen

> Dieser Abschnitt dokumentiert aufgetretene Probleme und deren Loesungen.

### Problem 1: [Noch keine]

**Datum:** -
**Beschreibung:** -
**Loesung:** -

---

## Technische Details

### Microsoft Graph API

**Endpunkte:**
```
# Subscription erstellen
POST https://graph.microsoft.com/v1.0/subscriptions

# E-Mail abrufen
GET https://graph.microsoft.com/v1.0/users/{user}/messages/{message-id}

# Anhang abrufen
GET https://graph.microsoft.com/v1.0/users/{user}/messages/{message-id}/attachments/{attachment-id}
```

**Subscription Payload:**
```json
{
  "changeType": "created",
  "notificationUrl": "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook",
  "resource": "/users/info@js-fenster.de/mailFolders/inbox/messages",
  "expirationDateTime": "2026-01-15T12:00:00Z",
  "clientState": "secretClientState"
}
```

**Fuer Sent-Folder:**
```json
{
  "resource": "/users/info@js-fenster.de/mailFolders/sentitems/messages"
}
```

### Authentifizierung

**Flow:** Client Credentials (App-only)
- Keine User-Interaktion noetig
- Service Principal mit Mail.Read Permission
- Fuer alle Postfaecher: Mail.Read auf Application-Ebene

**Tokens:**
- Access Token Lifetime: 1 Stunde
- Subscription Lifetime: Max 4230 Minuten (~3 Tage)

### Edge Function Limits (Supabase)

| Limit | Wert | Auswirkung |
|-------|------|------------|
| Timeout | 150 Sekunden (Pro) | Grosse E-Mails mit Anhaengen |
| Memory | 1GB | Ausreichend |
| Payload | 6MB | Anhaenge einzeln abrufen |

---

## Konfiguration

### Azure App Registration

> **App Name:** JSFenster-Email-Integration
> **Erstellt:** 2026-01-12
> **Portal:** https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/c8c7967f-467e-41ef-a485-e4931f77b604

| Feld | Wert |
|------|------|
| **Tenant ID** | `08af0c7f-e407-4561-91f3-eb29b0d58f2e` |
| **Client ID (Application ID)** | `c8c7967f-467e-41ef-a485-e4931f77b604` |
| **Object ID** | `c88daf3b-0de6-4cd4-bbe1-bf0bdb755801` |
| **Tenant Name** | J.S. Fenster & Tueren |
| **Primary Domain** | js-fenster.de |

### Client Secret

| Feld | Wert |
|------|------|
| **Beschreibung** | Supabase-Edge-Function |
| **Secret Value** | ⚠️ In Supabase Secrets gespeichert (AZURE_CLIENT_SECRET) |
| **Secret ID** | `47337bee-dc0b-4f61-860a-1576db81c6de` |
| **Gueltig bis** | **11.07.2026** |

> ⚠️ **WICHTIG:** Secret vor Ablauf erneuern! Kalender-Erinnerung fuer Juni 2026.

### API Permissions (Application)

| Permission | Typ | Admin Consent |
|------------|-----|---------------|
| Mail.Read | Application | ✅ Erteilt |
| Mail.ReadWrite | Application | ✅ Erteilt |
| User.Read | Delegated | Nicht erforderlich |

### Supabase Secrets (zu erstellen)

```bash
# Azure AD / Microsoft Graph
AZURE_TENANT_ID=08af0c7f-e407-4561-91f3-eb29b0d58f2e
AZURE_CLIENT_ID=c8c7967f-467e-41ef-a485-e4931f77b604
AZURE_CLIENT_SECRET=<aus Azure Portal kopieren - NICHT in Git speichern!>

# Webhook Validation
EMAIL_WEBHOOK_CLIENT_STATE=... (geheim, fuer Validation - noch zu generieren)

# OpenAI (bereits vorhanden)
OPENAI_API_KEY=...
```

### Postfach-Konfiguration

Spaeter in Supabase Tabelle `email_postfaecher`:

| postfach | aktiv | subscription_id_inbox | subscription_id_sent |
|----------|-------|----------------------|---------------------|
| info@js-fenster.de | true | uuid | uuid |
| buchhaltung@js-fenster.de | true | uuid | uuid |
| ... | | | |

---

## Testplan

### Unit Tests

1. **Kategorisierung:**
   - Input: E-Mail-Text
   - Output: Korrekte Kategorie
   - Testfaelle: Je Kategorie mind. 3 Beispiele

2. **Extraktion:**
   - Input: E-Mail-Text + Kategorie
   - Output: Strukturierte Daten
   - Testfaelle: Bestellbestaetigung, Tracking, Rechnung

### Integration Tests

1. **Webhook → process-email → DB:**
   - Simulierte Microsoft Notification
   - Pruefen: Datensatz in documents

2. **E-Mail mit Anhang:**
   - E-Mail mit PDF
   - Pruefen: 2 Datensaetze (E-Mail + Dokument)
   - Pruefen: bezug_email_id gesetzt

### Manueller Test

1. Test-E-Mail an info@ senden
2. Verarbeitung in Logs pruefen
3. Datensatz in Supabase pruefen

---

## Changelog

| Datum | Version | Aenderung | Autor |
|-------|---------|-----------|-------|
| 2026-01-12 | 0.1 | Initiale Projektdokumentation | Claude/Andreas |
| 2026-01-12 | 0.2 | Azure App Registration + Credentials dokumentiert | Claude/Andreas |
| 2026-01-12 | 0.3 | DB-Migration angewendet (001_add_email_columns.sql) | Claude/Andreas |
| 2026-01-12 | 0.4 | email-webhook Edge Function deployed (v1) | Claude/Andreas |
| 2026-01-12 | 0.4 | manage-subscriptions.ts Script erstellt | Claude/Andreas |

---

## Schnellreferenz

```
# Projektordner
tools/email_integration/

# Edge Functions (Supabase)
- email-webhook      (empfaengt Microsoft Notifications)
- process-email      (verarbeitet E-Mails)
- renew-subscriptions (scheduled, erneuert Subscriptions)

# Datenbank
- Tabelle: documents (erweitert)
- dokument_typ: 'email'

# Microsoft Graph
- API: https://graph.microsoft.com/v1.0/
- Subscriptions fuer Inbox + SentItems

# Supabase Projekt
- ID: rsmjgdujlpnydbsfuiek
- Name: js-fenster-erp
```

---

*Dokumentation wird laufend aktualisiert.*
