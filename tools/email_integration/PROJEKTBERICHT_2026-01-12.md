# E-Mail-Integration - Projektbericht

**Datum:** 2026-01-12
**Projekt:** E-Mail als zweiter Input-Kanal für das Dokumentenmanagement
**Firma:** J.S. Fenster & Türen GmbH
**Bearbeitet von:** Claude (Anthropic) in Zusammenarbeit mit Andreas Stolarczyk

---

## 1. Projektziel

Automatische Erfassung, Kategorisierung und Archivierung von E-Mails aus dem Firmen-Postfach `info@js-fenster.de`. Die E-Mails sollen wie gescannte Dokumente behandelt werden:

- Automatische Kategorisierung (regelbasiert + GPT)
- Speicherung in Supabase (PostgreSQL)
- Verknüpfung mit Projekten/Kunden aus dem ERP (Work4All)
- Anhänge werden im Storage-Bucket gespeichert

---

## 2. Architektur

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Microsoft 365  │────►│  Graph API       │────►│  Supabase       │
│  Postfach       │     │  Subscription    │     │  Edge Function  │
│  info@js-...    │     │  (Webhook)       │     │  email-webhook  │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────┐
                        │                                 ▼         │
                        │  ┌─────────────┐    ┌─────────────────┐  │
                        │  │  Storage    │◄───│  process-email  │  │
                        │  │  Bucket     │    │  (GPT-5.2)      │  │
                        │  │  (Anhänge)  │    │  Kategorisierung│  │
                        │  └─────────────┘    └─────────────────┘  │
                        │                                 │         │
                        │                                 ▼         │
                        │                      ┌─────────────────┐  │
                        │                      │  PostgreSQL     │  │
                        │                      │  documents      │  │
                        │                      │  Tabelle        │  │
                        │                      └─────────────────┘  │
                        │                          Supabase         │
                        └───────────────────────────────────────────┘
```

---

## 3. Erledigte Arbeiten

### 3.1 Azure AD App Registration
- **Tenant ID:** `08af0c7f-e407-4561-91f3-eb29b0d58f2e`
- **Client ID:** `c8c7967f-467e-41ef-a485-e4931f77b604`
- **Berechtigungen:** `Mail.Read` (Application)
- **Client Secret:** Erstellt, gültig bis 11.07.2026
- **Status:** ✅ Konfiguriert und getestet

### 3.2 Supabase Edge Functions

| Function | Version | Status | Beschreibung |
|----------|---------|--------|--------------|
| `email-webhook` | v1 | ✅ Deployed | Empfängt Graph Notifications, speichert E-Mails |
| `scan-mailbox` | v4 | ✅ Deployed | Analyse-Tool für bestehende E-Mails |
| `process-email` | - | ⏳ Geplant | GPT-Kategorisierung |

### 3.3 Datenbank-Schema

Migration `add_email_columns` erfolgreich angewandt:

```sql
-- Neue Spalten in documents Tabelle
email_message_id        -- Graph API Message ID
email_conversation_id   -- Thread-Verknüpfung
email_internet_message_id
email_richtung          -- 'eingehend' / 'ausgehend'
email_postfach          -- info@js-fenster.de
email_von_email, email_von_name
email_an_liste          -- JSONB Array
email_cc_liste          -- JSONB Array
email_betreff
email_body_text, email_body_html
email_empfangen_am, email_gesendet_am
email_hat_anhaenge
email_ist_gelesen
email_wichtigkeit
email_ms_kategorien     -- Microsoft Kategorien
email_ms_flag           -- Follow-up Flag
```

### 3.4 Secrets in Supabase
- `AZURE_TENANT_ID` ✅
- `AZURE_CLIENT_ID` ✅
- `AZURE_CLIENT_SECRET` ✅

---

## 4. Kategorien-Analyse

### 4.1 Datenquellen für Analyse

| Quelle | Anzahl | Methode |
|--------|--------|---------|
| Microsoft Graph (Inbox) | ~100 | Live-Scan via scan-mailbox |
| Microsoft Graph (Subfolders) | ~100 | Stichproben aus 103 Ordnern |
| Work4All Datenbank (Briefe) | ~200 | SQL-Abfrage auf dbo.Briefe |

### 4.2 Erkannte Kategorien (v4)

| Kategorie | Erkennungsmethode | Beispiel-Keywords |
|-----------|-------------------|-------------------|
| **Bewerbung** | Betreff, Preview | bewerbung, lebenslauf, bewerbe |
| **Lead_Anfrage** | Absender, Betreff | hubspot, weru.de, produktfinder |
| **BAFA_Foerderung** | Absender, Betreff | fe-bis.de, zuwendungsbescheid, bafa |
| **Versicherung_Schaden** | Absender, Betreff | generali, allianz, versicherungsschaden |
| **Lieferstatus_Update** | Absender | dhl, dpd, ups, gls, hermes, fedex |
| **Rechnung_Eingang** | Betreff | rechnung, invoice |
| **Auftragserteilung** | Betreff | auftragserteilung, beauftragung |
| **Bestellbestaetigung** | Betreff | bestellbestätigung, order confirmation |
| **Angebot_Anforderung** | Betreff | angebot, offerte, quote |
| **Reklamation** | Betreff, Preview | reklamation, mängelanzeige, beschwerde |
| **Serviceanfrage** | Betreff, Preview | reparatur, defekt, überprüfung, sturmschaden, undicht |
| **Anforderung_Unterlagen** | Betreff | bescheinigung, nachweis, freistellung |
| **Terminanfrage** | Betreff | termin, montage, aufmaß |
| **Kundenanfrage** | Absender, Betreff | website@, kontaktanfrage, anfrage |
| **Newsletter_Werbung** | Absender, Preview | newsletter, marketing, abmelden |
| **Antwort_oder_Weiterleitung** | Betreff-Prefix | re:, aw:, fwd:, wg: |
| **Sonstiges** | Fallback | - |

### 4.3 Erkennungsraten aus W4A-Analyse

| Kategorie | Erkannt | Nicht erkannt | Rate |
|-----------|---------|---------------|------|
| Rechnung | 14 | 0 | 100% |
| Antwort | 13 | 0 | 100% |
| Anforderung_Unterlagen | 10 | 0 | 100% |
| Angebot | 10 | 0 | 100% |
| Serviceanfrage | 6 | 2 | 75% |
| Termin | 6 | 0 | 100% |
| Reklamation | 3 | 0 | 100% |
| **Sonstiges (nicht erkannt)** | - | 28 | - |

### 4.4 Typische "Sonstiges" Fälle (benötigen GPT)

- Adressen im Betreff ohne Keywords: "Pfistermeisterstr 1 Amberg"
- Produkt-Anfragen ohne "Anfrage": "Zimmertüren Wohnung"
- Interne Kommunikation: "Mahlzeiten in der Kantine"
- Weihnachtsgrüße: "Frohe Weihnachten"
- Abwesenheitsmeldungen: "Abwesend vom 19.12.2025"

---

## 5. Work4All Integration

### 5.1 E-Mail-Tabelle gefunden

```
Tabelle: dbo.Briefe (22.294 Einträge)

Relevante Spalten:
- Art: 3 = Eingehend, 22 = Ausgehend
- MailFrom, MailTo, MailCC, MailBCC
- Notiz = Betreff
- MsgNoteText = Body (Plain Text)
- HtmlText = Body (HTML)
- Datum
- ProjektCode (Verknüpfung zu Projekten!)
```

### 5.2 Erkenntnisse aus W4A-Daten

- **8.817 eingehende E-Mails** (Art=3) verfügbar für Training
- **12.385 ausgehende E-Mails** (Art=22)
- E-Mails sind bereits mit **Projekten verknüpft** (ProjektCode)
- Können für ML-Training/Validierung genutzt werden

---

## 6. Sicherheitskonzept

### 6.1 Spam-Schutz
- Microsoft 365 Spam-Filter aktiv (Junk-Ordner war leer)
- Junk-Ordner wird von Subscription ausgeschlossen
- Zusätzliche Spam-Kategorie bei Bedarf

### 6.2 Virenschutz
- **Microsoft Defender for Office 365** scannt alle Anhänge VOR Zustellung
- **Dateityp-Whitelist** geplant: PDF, DOCX, XLSX, JPG, PNG
- **Magic-Byte-Prüfung** in process-document bereits implementiert
- Gefährliche Dateitypen (.exe, .js, .vbs, .bat) werden blockiert

### 6.3 Datenschutz
- Daten bleiben in EU (Supabase Frankfurt)
- Keine Weitergabe an Dritte
- GPT-Verarbeitung nur für Kategorisierung

---

## 7. Offene Aufgaben

| # | Aufgabe | Priorität | Status |
|---|---------|-----------|--------|
| 1 | GPT-Kategorisierung implementieren (process-email) | Hoch | ⏳ Offen |
| 2 | Microsoft Graph Subscription erstellen | Hoch | ⏳ Offen |
| 3 | Anhänge-Verarbeitung mit Whitelist | Mittel | ⏳ Offen |
| 4 | Freitag: Analyse für Marco vorbereiten | Hoch | ⏳ Offen |
| 5 | ERP-Verknüpfung (Kunde/Projekt matching) | Niedrig | ⏳ Später |

---

## 8. Nächste Schritte (Freitag-Session)

1. **Subscription aktivieren** → E-Mails werden ab sofort erfasst
2. **GPT-Kategorisierung** → Bessere Erkennung der "Sonstiges" Fälle
3. **Daten sammeln** → Bis Freitag reale E-Mails kategorisieren
4. **Analyse erstellen** → Kategorieverteilung, Erkennungsraten
5. **Marco präsentieren** → Ergebnisse im KI-Coaching besprechen

---

## 9. Technische Details

### Edge Function URLs
```
https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook
https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/scan-mailbox
```

### Test-Befehle
```bash
# Folder-Liste abrufen
curl "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/scan-mailbox?action=folders"

# E-Mails scannen
curl "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/scan-mailbox?folder=inbox&count=20"

# Webhook Health-Check
curl "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook"
```

### Repository
```
KI_Automation/tools/email_integration/
├── edge-functions/
│   ├── email-webhook/index.ts    # Webhook für Graph Notifications
│   └── scan-mailbox/index.ts     # Analyse-Tool (v4)
├── scripts/
│   └── manage-subscriptions.ts   # CLI für Subscription-Verwaltung
├── PLAN.md                       # Projektplan mit Status
└── PROJEKTBERICHT_2026-01-12.md  # Dieser Bericht
```

---

*Bericht erstellt: 2026-01-12 16:30*
*Nächstes Meeting: Freitag (KI-Coaching mit Marco)*
