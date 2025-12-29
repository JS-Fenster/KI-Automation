# ScannerWatcher.ps1
# Ueberwacht einen Ordner auf neue Dateien und sendet diese per Webhook
# Fuer den Einsatz auf dem Server - dort den lokalen Pfad anpassen!

# ============ KONFIGURATION ============
# WICHTIG: Auf dem Server den lokalen Pfad verwenden (z.B. "D:\Scanner" oder "C:\Scanner")
$WatchFolder = "D:\Daten\Dokumente\Scanner"
$WebhookUrl = "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/process-document"
$LogFile = "$PSScriptRoot\scanner_webhook.log"
$ProcessedFile = "$PSScriptRoot\processed_files.txt"
# =======================================

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry -Encoding UTF8
}

function Send-FileToWebhook {
    param([string]$FilePath)

    try {
        # Warte kurz, bis die Datei vollstaendig geschrieben ist
        Start-Sleep -Seconds 2

        # Pruefe ob Datei existiert und lesbar ist
        if (-not (Test-Path $FilePath)) {
            Write-Log "FEHLER: Datei nicht gefunden: $FilePath"
            return $false
        }

        # Warte bis Datei nicht mehr gesperrt ist
        $maxRetries = 10
        $retryCount = 0
        while ($retryCount -lt $maxRetries) {
            try {
                $fileStream = [System.IO.File]::Open($FilePath, 'Open', 'Read', 'None')
                $fileStream.Close()
                break
            }
            catch {
                $retryCount++
                Write-Log "Datei noch gesperrt, warte... (Versuch $retryCount/$maxRetries)"
                Start-Sleep -Seconds 1
            }
        }

        if ($retryCount -eq $maxRetries) {
            Write-Log "FEHLER: Datei bleibt gesperrt: $FilePath"
            return $false
        }

        $fileName = [System.IO.Path]::GetFileName($FilePath)
        $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)

        # Multipart Form-Data erstellen
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"

        # Content-Type basierend auf Dateiendung
        $extension = [System.IO.Path]::GetExtension($FilePath).ToLower()
        $contentType = switch ($extension) {
            ".pdf"  { "application/pdf" }
            ".xlsx" { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
            ".xls"  { "application/vnd.ms-excel" }
            ".doc"  { "application/msword" }
            ".docx" { "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            ".jpeg" { "image/jpeg" }
            ".tif"  { "image/tiff" }
            ".tiff" { "image/tiff" }
            default { "application/octet-stream" }
        }

        # Body zusammenbauen
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
            "Content-Type: $contentType",
            "",
            ""
        )

        $bodyStart = [System.Text.Encoding]::UTF8.GetBytes(($bodyLines -join $LF))
        $bodyEnd = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")

        # Alles zusammenfuegen
        $requestBody = New-Object byte[] ($bodyStart.Length + $fileBytes.Length + $bodyEnd.Length)
        [System.Buffer]::BlockCopy($bodyStart, 0, $requestBody, 0, $bodyStart.Length)
        [System.Buffer]::BlockCopy($fileBytes, 0, $requestBody, $bodyStart.Length, $fileBytes.Length)
        [System.Buffer]::BlockCopy($bodyEnd, 0, $requestBody, $bodyStart.Length + $fileBytes.Length, $bodyEnd.Length)

        # HTTP Request senden
        $headers = @{
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        }

        Write-Log "Sende Datei: $fileName ($('{0:N2}' -f ($fileBytes.Length / 1KB)) KB)"

        $response = Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $requestBody -Headers $headers -ContentType "multipart/form-data; boundary=$boundary"

        Write-Log "ERFOLG: $fileName gesendet. Response: $($response | ConvertTo-Json -Compress)"

        # Datei als verarbeitet markieren
        Add-Content -Path $ProcessedFile -Value $FilePath -Encoding UTF8

        return $true
    }
    catch {
        Write-Log "FEHLER beim Senden von $FilePath : $($_.Exception.Message)"
        return $false
    }
}

function Start-FolderWatcher {
    Write-Log "=========================================="
    Write-Log "Scanner Watcher gestartet"
    Write-Log "Ueberwache: $WatchFolder"
    Write-Log "Webhook: $WebhookUrl"
    Write-Log "=========================================="

    # Pruefe ob Ordner existiert
    if (-not (Test-Path $WatchFolder)) {
        Write-Log "FEHLER: Ordner existiert nicht: $WatchFolder"
        exit 1
    }

    # FileSystemWatcher erstellen
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $WatchFolder
    $watcher.Filter = "*.*"
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    # Event-Handler fuer neue Dateien
    $action = {
        $path = $Event.SourceEventArgs.FullPath
        $name = $Event.SourceEventArgs.Name
        $changeType = $Event.SourceEventArgs.ChangeType

        # Ignoriere Thumbs.db, temporaere Dateien und Outlook E-Mails
        if ($name -match "^(Thumbs\.db|~\$|\.tmp)") {
            return
        }

        # Skip MSG files (Outlook emails)
        $extension = [System.IO.Path]::GetExtension($path).ToLower()
        if ($extension -eq ".msg") {
            Write-Log "SKIP: Outlook E-Mail: $name"
            return
        }

        # Skip small PNGs (<100KB) - likely QR codes already embedded in invoices
        if ($extension -eq ".png") {
            Start-Sleep -Milliseconds 500  # Wait for file to be written
            if (Test-Path $path) {
                $fileSize = (Get-Item $path).Length
                if ($fileSize -lt 100KB) {
                    Write-Log "SKIP: Kleine PNG-Datei (vermutlich QR-Code): $name ($([math]::Round($fileSize/1KB, 1)) KB)"
                    return
                }
            }
        }

        Write-Log "Neue Datei erkannt: $name"
        Send-FileToWebhook -FilePath $path
    }

    # Event registrieren
    $created = Register-ObjectEvent -InputObject $watcher -EventName Created -Action $action

    Write-Log "Watcher aktiv. Druecke Ctrl+C zum Beenden."

    # Endlosschleife um das Script am Laufen zu halten
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
    finally {
        # Aufraeumen bei Beendigung
        Unregister-Event -SubscriptionId $created.Id
        $watcher.Dispose()
        Write-Log "Watcher beendet."
    }
}

# Script starten
Start-FolderWatcher
