# Scanner Webhook Automatisierung

> **Status:** Produktiv (seit 2026-01-12)
> **Version:** 2.0 (2026-01-15)
> **Ziel:** Supabase Edge Function `process-document`

Ueberwacht den Scanner-Ordner und sendet neue Dateien automatisch an die Supabase Edge Function zur Dokumentenverarbeitung.

---

## WICHTIG: API-Key Konfiguration (v2.0)

Die Edge Function `process-document` erfordert einen API-Key. Dieser muss als **Environment Variable** auf dem Server gesetzt werden.

### 1. API-Key setzen (einmalig, als Admin)

```powershell
# PowerShell als Administrator oeffnen
[Environment]::SetEnvironmentVariable("SCANNER_WEBHOOK_API_KEY", "DEIN_INTERNAL_API_KEY", "Machine")
```

**WICHTIG:** Der Wert muss identisch sein mit `INTERNAL_API_KEY` in der Supabase Edge Function!

### 2. Scheduled Task neu starten

```powershell
Stop-ScheduledTask -TaskName 'ScannerWebhookWatcher'
Start-ScheduledTask -TaskName 'ScannerWebhookWatcher'
```

### 3. Pruefen ob Key geladen wurde

```powershell
# Log anzeigen - sollte "API-Key konfiguriert: XXXX***XXXX" zeigen
Get-Content C:\Scripts\Scanner_Webhook\scanner_webhook.log -Tail 20
```

---

## Architektur

```
┌──────────────────────┐      HTTPS POST       ┌─────────────────────────────────┐
│  Windows Server      │  ─────────────────►   │  Supabase (js-fenster-erp)      │
│  (Buero / DC)        │                       │                                 │
│                      │                       │  Edge Function:                 │
│  D:\Daten\Dokumente\ │                       │  process-document               │
│  Scanner\            │                       │                                 │
│  + ScannerWatcher.ps1│                       │  → Mistral OCR                  │
└──────────────────────┘                       │  → GPT-5.2 Kategorisierung      │
                                               │  → Storage + PostgreSQL         │
                                               └─────────────────────────────────┘
```

---

## Aktuelle Konfiguration (Stand 2026-01-12)

| Parameter | Wert |
|-----------|------|
| **Watch-Ordner** | `D:\Daten\Dokumente\Scanner` |
| **Webhook-URL** | `https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/process-document` |
| **Supabase-Projekt** | `js-fenster-erp` (ID: `rsmjgdujlpnydbsfuiek`) |
| **Scheduled Task** | `ScannerWebhookWatcher` |

---

## Installation auf dem Server

### 1. Dateien auf Server kopieren

Kopiere den gesamten `Scanner_Webhook` Ordner auf den Server, z.B. nach:
```
C:\Scripts\Scanner_Webhook\
```

### 2. Pfad anpassen

Oeffne `ScannerWatcher.ps1` und passe den `$WatchFolder` an den **lokalen** Pfad auf dem Server an:

```powershell
# Aendere diese Zeile:
$WatchFolder = "D:\Daten\Dokumente\Scanner"

# Zu dem lokalen Pfad auf dem Server, z.B.:
$WatchFolder = "D:\Scanner"
```

### 3. Als Dienst installieren

PowerShell als Administrator oeffnen und ausfuehren:

```powershell
cd C:\Scripts\Scanner_Webhook
.\Install-ScannerService.ps1
```

Das Script richtet eine geplante Aufgabe ein, die:
- Automatisch beim Systemstart laeuft
- Bei Fehlern automatisch neustartet
- Als SYSTEM-Konto laeuft (keine Anmeldung noetig)

### 4. Manueller Test

Zum Testen kannst du das Script auch direkt starten:

```powershell
powershell -ExecutionPolicy Bypass -File .\ScannerWatcher.ps1
```

---

## Funktionsweise

1. Das Script ueberwacht den Scanner-Ordner mit einem FileSystemWatcher
2. Bei neuen Dateien wird 2 Sekunden gewartet (bis Schreibvorgang abgeschlossen)
3. Datei-Lock wird geprueft (max. 10 Versuche)
4. Die Datei wird per POST als `multipart/form-data` an die Edge Function gesendet
5. Erfolg/Fehler wird in `scanner_webhook.log` protokolliert

---

## Edge Function Details

| Aspekt | Details |
|--------|---------|
| **Name** | `process-document` |
| **OCR** | Mistral API (`mistral-ocr-latest`) |
| **Kategorisierung** | OpenAI GPT-5.2 mit strukturiertem Output |
| **Storage** | Supabase Storage Bucket `documents` |
| **Datenbank** | Tabelle `documents` mit 50+ Feldern |
| **Kategorien** | 18 Dokumenttypen (Rechnung, Angebot, Mahnung, etc.) |

---

## Dateien

| Datei | Beschreibung |
|-------|--------------|
| `ScannerWatcher.ps1` | Haupt-Script fuer die Ordnerueberwachung |
| `Install-ScannerService.ps1` | Installations-Script (als Admin ausfuehren) |
| `scanner_webhook.log` | Log-Datei (wird automatisch erstellt) |
| `processed_files.txt` | Liste verarbeiteter Dateien |

---

## Befehle

```powershell
# Status pruefen
Get-ScheduledTask -TaskName 'ScannerWebhookWatcher'

# Manuell starten
Start-ScheduledTask -TaskName 'ScannerWebhookWatcher'

# Stoppen
Stop-ScheduledTask -TaskName 'ScannerWebhookWatcher'

# Deinstallieren
Unregister-ScheduledTask -TaskName 'ScannerWebhookWatcher'

# Log anzeigen (letzte 50 Zeilen)
Get-Content .\scanner_webhook.log -Tail 50

# Log live verfolgen
Get-Content .\scanner_webhook.log -Wait -Tail 10
```

---

## Ignorierte Dateien

Folgende Dateien werden automatisch uebersprungen:
- `Thumbs.db` (Windows Thumbnail Cache)
- Temporaere Dateien (`~$...`, `.tmp`)
- Outlook E-Mails (`.msg`)
- Kleine PNG-Dateien < 100KB (QR-Codes in Rechnungen)

---

## Troubleshooting

### Datei wird nicht gesendet
1. Log pruefen: `Get-Content .\scanner_webhook.log -Tail 20`
2. Ist die Datei in `processed_files.txt`? → Bereits verarbeitet
3. Scheduled Task laeuft? → `Get-ScheduledTask -TaskName 'ScannerWebhookWatcher'`

### Edge Function Fehler
1. Supabase Dashboard → Edge Functions → process-document → Logs
2. Haeufige Fehler:
   - `No file provided`: Datei konnte nicht gelesen werden
   - `Mistral OCR failed`: OCR-Limit erreicht oder API-Fehler
   - `Storage upload failed`: Bucket existiert nicht oder keine Rechte

### Webhook-URL aendern
In `ScannerWatcher.ps1` die Variable `$WebhookUrl` anpassen.

---

## Historie

| Datum | Aenderung |
|-------|-----------|
| 2025-12-20 | Erster Entwurf mit n8n Webhook |
| 2025-12-27 | Umstellung auf Supabase Edge Function geplant |
| 2026-01-12 | **Produktiv:** Scanner → Edge Function Pipeline abgeschlossen |
| 2026-01-15 | **v2.0:** API-Key Auth (SCANNER_WEBHOOK_API_KEY), HTTP-Retry mit Backoff, Health-Check |

---

*Zuletzt aktualisiert: 2026-01-15*
