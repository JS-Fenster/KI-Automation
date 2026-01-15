# E-Mail Integration - E2E Test Playbook

**Datum:** 2026-01-14
**Version:** 4.1 (Resource Mismatch Fix)

---

## 1. Pre-Flight Checks

### 1.1 Edge Functions Health Check

```bash
# email-webhook (sollte Version 3.4.0 zeigen)
curl -s "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook"

# Erwartete Antwort:
# {"service":"email-webhook","version":"3.4.0","status":"ready","subscriptions":{"count_db":2,"active_count_db":2,"db_healthy":true}}

# process-email (sollte 401 zurueckgeben - JWT required)
curl -s "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/process-email"

# Erwartete Antwort:
# {"code":401,"message":"Missing authorization header"}

# renew-subscriptions (sollte Version 1.0.0 zeigen)
curl -s "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/renew-subscriptions"

# Erwartete Antwort:
# {"service":"renew-subscriptions","version":"1.0.0","status":"ready","configured":{"azure":true,"supabase":true}}
```

### 1.2 Datenbank-Schema pruefen

```sql
-- In Supabase SQL Editor ausfuehren:

-- Composite Unique Index pruefen
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'documents'
AND indexname LIKE '%email%';

-- Processing-Status Spalten pruefen
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'documents'
AND column_name IN ('processing_status', 'processing_attempts', 'processing_last_error', 'processed_at', 'email_attachment_hashes');

-- email_subscriptions Tabelle pruefen
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_subscriptions'
ORDER BY ordinal_position;

-- pg_cron Jobs pruefen
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname LIKE '%subscription%';
```

**Erwartete Ergebnisse:**
- `unique_email_postfach_message_id` Index existiert
- `processing_status` hat CHECK constraint (pending, queued, processing, done, error)
- Alle neuen Spalten sind vorhanden
- `email_subscriptions` Tabelle existiert mit subscription_id, email_postfach, expires_at, is_active
- 2 Cron-Jobs: `renew-email-subscriptions` (06:00, 18:00) + `renew-email-subscriptions-safety` (00:00, 12:00)

---

## 2. Subscription erstellen und verwalten

### 2.1 Mit Node.js (v2.0 mit DB-Integration)

```bash
cd Z:\IT-Sammlung\KI_Automation_Hub\KI_Automation\tools\email_integration\scripts

# Credentials sind in .env gespeichert
# Falls SUPABASE_SERVICE_ROLE_KEY fehlt, wird nur Graph-Operationen ausgefuehrt

# Subscriptions erstellen (Inbox + Sent + DB Sync)
node manage-subscriptions.mjs create info@js-fenster.de
```

### 2.2 Subscriptions auflisten (Graph + DB)

```bash
node manage-subscriptions.mjs list
```

**Erwartete Ausgabe:**
- Graph: 2 Subscriptions (inbox + sentitems)
- DB: 2 aktive Eintraege in email_subscriptions
- Expiration ~3 Tage in der Zukunft

### 2.3 DB Sync (Graph -> DB)

```bash
# Bestehende Graph-Subscriptions in DB synchronisieren
node manage-subscriptions.mjs sync
```

### 2.4 Akzeptanztest A: Subscription + DB Sync

```sql
-- Nach create/sync: Subscriptions in DB pruefen
SELECT subscription_id, email_postfach, resource, expires_at, is_active
FROM email_subscriptions
WHERE is_active = true;

-- Erwartetes Ergebnis: 2 Zeilen (inbox + sentitems)
```

---

## 3. E-Mail Verarbeitung testen

### 3.1 Test-E-Mail senden

1. Sende eine Test-E-Mail an `info@js-fenster.de`
   - Betreff: "Test Kategorisierung - Rechnung 12345"
   - Body: "Anbei die Rechnung Nr. 12345 fuer die Fensterlieferung."
   - Optional: PDF-Anhang

### 3.2 Verarbeitung pruefen (innerhalb 30 Sekunden)

```sql
-- Neueste E-Mails anzeigen
SELECT
  id,
  email_betreff,
  email_von_email,
  kategorie,
  processing_status,
  processing_attempts,
  processed_at,
  created_at
FROM documents
WHERE dokument_typ = 'email'
ORDER BY created_at DESC
LIMIT 5;
```

**Erwartete Werte:**
- `processing_status` = 'done'
- `processing_attempts` = 1
- `processed_at` ist gesetzt
- `kategorie` = 'Rechnung_Eingang' (oder passend zum Inhalt)

### 3.3 Logs pruefen

Im Supabase Dashboard unter "Edge Functions" → "email-webhook" → "Logs":
- `[BG] Processing email for info@js-fenster.de (eingehend)`
- `Email inserted: <message-id> (process: true)`
- `[BG] Triggered process-email for <document-id>`

---

## 4. Idempotenz-Test

### 4.1 Duplikat-Notification simulieren

```bash
# Gleiche E-Mail nochmal via Webhook schicken (simuliert Microsoft Retry)
# Sollte "Email updated" statt "Email inserted" loggen
# process-email sollte NICHT erneut getriggert werden wenn status=done
```

### 4.2 Datenbank pruefen

```sql
-- Sollte nur EINEN Eintrag pro E-Mail geben
SELECT email_message_id, COUNT(*)
FROM documents
WHERE dokument_typ = 'email'
GROUP BY email_message_id
HAVING COUNT(*) > 1;

-- Erwartetes Ergebnis: Leer (keine Duplikate)
```

---

## 5. Attachment Hardening Test

### 5.1 Test mit verschiedenen Anhaengen

Sende E-Mails mit:
1. **PDF < 25MB** → Sollte verarbeitet werden
2. **Bild (image001.png)** → Sollte als Inline erkannt und uebersprungen werden
3. **EXE-Datei** → Sollte von Whitelist geblockt werden
4. **Datei > 25MB** → Sollte von Size-Limit geblockt werden

### 5.2 Logs pruefen

```
Attachment document.pdf is inline/signature - skipping
Attachment malware.exe not in whitelist - skipping
Attachment bigfile.pdf exceeds size limit (30000000 > 26214400) - skipping
Processing attachment: invoice.pdf (1234567 bytes)
Attachment hash: a1b2c3d4e5f6...
```

---

## 6. Error Handling Test

### 6.1 Fehler bei GPT-Kategorisierung

Falls OPENAI_API_KEY nicht gesetzt:
- Kategorie sollte auf "Sonstiges" fallen
- E-Mail sollte trotzdem `processing_status = 'done'` haben

### 6.2 Fehler bei Attachment-Verarbeitung

- E-Mail sollte trotzdem als `done` markiert werden
- `processing_last_error` bleibt leer (Attachment-Fehler sind non-fatal)

---

## 7. Subscription Renewal

### 7.1 Manuell ueber Script

```bash
node manage-subscriptions.mjs renew-all
```

### 7.2 Manuell ueber Edge Function (Akzeptanztest D)

```bash
# Service Role Key erforderlich
curl -X POST "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/renew-subscriptions" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"

# Erwartete Antwort (wenn keine Subscriptions ablaufen):
# {"status":"ok","message":"No subscriptions need renewal","checked":0,"renewed":0,"failed":0}

# Erwartete Antwort (wenn Subscriptions erneuert wurden):
# {"status":"ok","message":"Renewed 2/2 subscription(s)","checked":2,"renewed":2,"failed":0,"subscriptions":[...]}
```

### 7.3 Automatisierung (pg_cron aktiv)

Die Erneuerung laeuft automatisch alle 6-12 Stunden via pg_cron:
- `renew-email-subscriptions`: 06:00 + 18:00 UTC
- `renew-email-subscriptions-safety`: 00:00 + 12:00 UTC

```sql
-- Cron-Job Status pruefen
SELECT * FROM cron.job WHERE jobname LIKE '%subscription%';

-- Letzte Ausfuehrungen pruefen
SELECT * FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE '%subscription%')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 8. Subscription-Validierung Tests

### 8.1 Akzeptanztest B: Valide subscriptionId

```bash
# POST mit gueltigem subscriptionId (aus email_subscriptions Tabelle)
curl -X POST "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "value": [{
      "subscriptionId": "<GUELTIGE_SUBSCRIPTION_ID>",
      "changeType": "created",
      "resource": "/users/info@js-fenster.de/mailFolders/inbox/messages/TEST123",
      "clientState": "js-fenster-email-webhook-secret"
    }]
  }'

# Erwartete Antwort:
# {"status":"accepted","received":1,"processing":1}

# Logs sollten zeigen:
# - Security validation passed
# - [BG] Processing email...
```

### 8.2 Akzeptanztest C: Unbekannte subscriptionId

```bash
# POST mit ungueltigem subscriptionId (fake)
curl -X POST "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "value": [{
      "subscriptionId": "fake-subscription-id-12345",
      "changeType": "created",
      "resource": "/users/info@js-fenster.de/mailFolders/inbox/messages/TEST123",
      "clientState": "js-fenster-email-webhook-secret"
    }]
  }'

# Erwartete Antwort:
# {"status":"accepted","received":1,"processing":0}

# Logs sollten zeigen:
# - [SEC] Unknown subscriptionId: fake-subscription-id-12345
# - Security validation failed - skipping notification
```

---

## 9. Checkliste

| Test | Status | Notizen |
|------|--------|---------|
| **Edge Functions** | | |
| email-webhook Health Check | ⬜ | Version 3.4.0? subscriptions.db_healthy:true? |
| process-email Health Check | ⬜ | 401 Unauthorized? |
| renew-subscriptions Health Check | ⬜ | Version 1.0.0? |
| **Datenbank** | | |
| documents Indexes vorhanden | ⬜ | Composite Unique? |
| email_subscriptions Tabelle | ⬜ | Subscription-Tracking? |
| pg_cron Jobs aktiv | ⬜ | 4 Ausfuehrungen/Tag? |
| **Subscription Management** | | |
| Akzeptanztest A: Create + Sync | ⬜ | DB zeigt 2 aktive Subscriptions? |
| Akzeptanztest B: Valide subscriptionId | ⬜ | processing:1? |
| Akzeptanztest C: Fake subscriptionId | ⬜ | processing:0? |
| Akzeptanztest D: Renewal Function | ⬜ | Edge Function antwortet ok? |
| **E-Mail Verarbeitung** | | |
| Test-E-Mail verarbeitet | ⬜ | processing_status=done? |
| Kategorie korrekt | ⬜ | GPT-Kategorisierung? |
| Duplikat-Schutz funktioniert | ⬜ | Keine doppelten Eintraege? |
| **Attachment Hardening** | | |
| Inline-Attachments uebersprungen | ⬜ | image001 etc.? |
| Whitelist funktioniert | ⬜ | EXE geblockt? |
| Size-Limit funktioniert | ⬜ | >25MB geblockt? |

---

## 10. Resource Mismatch Regression Test (v3.4.0)

### 10.1 Hintergrund

**Problem (v3.3):** Webhook lehnte ALLE echten Notifications ab wegen "resource mismatch":
- DB speichert: `/users/info@js-fenster.de/mailFolders/inbox/messages`
- Graph sendet: `Users/f39679f6-38d2-48b1-9d6f-6e4e6f0f9e98/Messages/<messageId>`

Die Formate sind inkompatibel (Email vs GUID) und koennen nicht verglichen werden.

**Loesung (v3.4):** Intelligente Format-Erkennung:
- `resourceUsesGuidFormat()`: Erkennt GUID-Muster im Resource-String
- `resourcesAreComparable()`: Prueft ob beide Formate gleich sind
- Resource-Vergleich wird uebersprungen wenn Formate unterschiedlich

### 10.2 Simulated Webhook Test

```powershell
# PowerShell Script: test-webhook-simulation.ps1
$body = @{
    value = @(@{
        subscriptionId = '<AKTIVE_SUBSCRIPTION_ID>'  # aus DB holen
        changeType = 'created'
        resource = 'Users/f39679f6-38d2-48b1-9d6f-6e4e6f0f9e98/Messages/AAMkADYzTestMessage123'
        clientState = 'js-fenster-email-webhook-secret'
        tenantId = '08af0c7f-e407-4561-91f3-eb29b0d58f2e'
        resourceData = @{
            '@odata.type' = '#Microsoft.Graph.Message'
            '@odata.id' = 'Users/f39679f6-38d2-48b1-9d6f-6e4e6f0f9e98/Messages/AAMkADYzTestMessage123'
            id = 'AAMkADYzTestMessage123'
        }
    })
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri 'https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/email-webhook' -Method Post -ContentType 'application/json' -Body $body
```

**Erwartete Antwort:**
```json
{"status":"accepted","received":1,"processing":1}
```

**NICHT erwartete Antwort (v3.3 Bug):**
```json
{"status":"accepted","received":1,"processing":0}
// mit Log: "[SEC] resource mismatch..."
```

### 10.3 Real E-Mail Test

1. Sende eine Test-E-Mail an `info@js-fenster.de`
2. Warte auf Graph-Notification (max. 30 Sekunden)
3. Pruefe Logs: Kein "resource mismatch" in [SEC] Eintraegen
4. Pruefe DB: `processing_status = 'done'`

```sql
-- Neueste Notifications pruefen
SELECT email_betreff, processing_status, created_at
FROM documents
WHERE dokument_typ = 'email'
ORDER BY created_at DESC
LIMIT 3;
```

### 10.4 Checkliste Regression Test

| Pruefpunkt | Status | Notizen |
|------------|--------|---------|
| email-webhook Version 3.4.0 | ⬜ | Health Check |
| Simulated Test: processing=1 | ⬜ | Kein Reject bei GUID-Format |
| Real E-Mail: processing_status=done | ⬜ | Echte Notification |
| Keine "resource mismatch" Logs | ⬜ | Edge Function Logs |

---

*Erstellt: 2026-01-13*
*Aktualisiert: 2026-01-14 (v4.1 - Resource Mismatch Fix)*
