# Scanner Webhook Automatisierung

Ueberwacht den Scanner-Ordner und sendet neue Dateien automatisch an den n8n Webhook.

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
$WatchFolder = "Z:\Scanner"

# Zu dem lokalen Pfad auf dem Server, z.B.:
$WatchFolder = "D:\Scanner"
# oder
$WatchFolder = "C:\Scans"
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

## Funktionsweise

1. Das Script ueberwacht den Scanner-Ordner mit einem FileSystemWatcher
2. Bei neuen Dateien wird 2 Sekunden gewartet (bis Schreibvorgang abgeschlossen)
3. Die Datei wird per POST als `multipart/form-data` an den Webhook gesendet
4. Erfolg/Fehler wird in `scanner_webhook.log` protokolliert

## Webhook-Details

- **URL:** `https://js-fenster.app.n8n.cloud/webhook/4b49adb1-796b-4818-af75-0ac495f0e389`
- **Methode:** POST
- **Content-Type:** multipart/form-data
- **Feld-Name:** `file`

## Dateien

| Datei | Beschreibung |
|-------|--------------|
| `ScannerWatcher.ps1` | Haupt-Script fuer die Ordnerueberwachung |
| `Install-ScannerService.ps1` | Installations-Script (als Admin ausfuehren) |
| `scanner_webhook.log` | Log-Datei (wird automatisch erstellt) |
| `processed_files.txt` | Liste verarbeiteter Dateien |

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

# Log anzeigen
Get-Content .\scanner_webhook.log -Tail 50
```

## Ignorierte Dateien

Folgende Dateien werden automatisch ignoriert:
- `Thumbs.db` (Windows Thumbnail Cache)
- Temporaere Dateien (`~$...`, `.tmp`)
