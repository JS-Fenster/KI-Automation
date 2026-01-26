# =============================================================================
# ScannerWatcher.ps1 - Scanner Ordner Webhook
# Version: 2.0 - 2026-01-15
# =============================================================================
# Aenderungen v2.0:
# - API-Key Authentifizierung (SCANNER_WEBHOOK_API_KEY Environment Variable)
# - Klarer ERROR-Log wenn API-Key fehlt (kein silent fail)
# - HTTP-Retry mit Exponential Backoff (3 Versuche)
# - Health-Check Logging bei Start
#
# Aenderungen v1.0:
# - Initial Release (2026-01-12)
# =============================================================================

# ============ KONFIGURATION ============
# WICHTIG: Auf dem Server den lokalen Pfad verwenden (z.B. "D:\Scanner" oder "C:\Scanner")
$WatchFolder = "D:\Daten\Dokumente\Scanner"
$WebhookUrl = "https://rsmjgdujlpnydbsfuiek.supabase.co/functions/v1/process-document"
$LogFile = "$PSScriptRoot\scanner_webhook.log"
$ProcessedFile = "$PSScriptRoot\processed_files.txt"

# v2.0: API-Key aus Environment Variable (PFLICHT!)
# Muss denselben Wert haben wie INTERNAL_API_KEY in der Edge Function
$ApiKey = $env:SCANNER_WEBHOOK_API_KEY

# v2.0: Retry-Konfiguration
$MaxHttpRetries = 3
$InitialRetryDelaySec = 2
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

    # v2.0: API-Key Validierung - KEIN silent fail!
    if (-not $ApiKey) {
        Write-Log "ERROR [AUTH]: SCANNER_WEBHOOK_API_KEY Environment Variable nicht gesetzt!"
        Write-Log "ERROR [AUTH]: Bitte setzen mit: [Environment]::SetEnvironmentVariable('SCANNER_WEBHOOK_API_KEY', 'KEY', 'Machine')"
        Write-Log "ERROR [AUTH]: Datei wird NICHT gesendet: $FilePath"
        return $false
    }

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

        # v2.0: HTTP Headers MIT API-Key
        $headers = @{
            "Content-Type" = "multipart/form-data; boundary=$boundary"
            "x-api-key" = $ApiKey
        }

        Write-Log "Sende Datei: $fileName ($('{0:N2}' -f ($fileBytes.Length / 1KB)) KB)"

        # v2.0: HTTP-Retry mit Exponential Backoff
        $currentRetryDelay = $InitialRetryDelaySec
        $response = $null
        $lastError = $null

        for ($httpRetry = 1; $httpRetry -le $MaxHttpRetries; $httpRetry++) {
            try {
                $response = Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $requestBody -Headers $headers -ContentType "multipart/form-data; boundary=$boundary" -TimeoutSec 120
                # Erfolg - Schleife verlassen
                break
            }
            catch {
                $lastError = $_
                $statusCode = $_.Exception.Response.StatusCode.value__

                # v2.0: Bei 401 (Auth-Fehler) NICHT retrien - ist sinnlos
                if ($statusCode -eq 401) {
                    Write-Log "ERROR [AUTH]: 401 Unauthorized - API-Key ungueltig oder nicht akzeptiert"
                    Write-Log "ERROR [AUTH]: Pruefe ob SCANNER_WEBHOOK_API_KEY == INTERNAL_API_KEY der Edge Function"
                    throw
                }

                if ($httpRetry -lt $MaxHttpRetries) {
                    Write-Log "HTTP-Fehler (Versuch $httpRetry/$MaxHttpRetries): Status=$statusCode - Retry in ${currentRetryDelay}s"
                    Start-Sleep -Seconds $currentRetryDelay
                    $currentRetryDelay = $currentRetryDelay * 2  # Exponential Backoff
                }
                else {
                    Write-Log "HTTP-Fehler: Alle $MaxHttpRetries Versuche fehlgeschlagen"
                    throw
                }
            }
        }

        # Erfolg pruefen
        if ($response.success -eq $false -and $response.duplicate -eq $true) {
            Write-Log "DUPLIKAT: $fileName - bereits verarbeitet (Original: $($response.duplicate_of))"
        }
        else {
            Write-Log "ERFOLG: $fileName gesendet. Response: $($response | ConvertTo-Json -Compress)"
        }

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
    Write-Log "Scanner Watcher v2.0 gestartet"
    Write-Log "Ueberwache: $WatchFolder"
    Write-Log "Webhook: $WebhookUrl"
    Write-Log "=========================================="

    # v2.0: API-Key Validierung beim Start - KRITISCH!
    if (-not $ApiKey) {
        Write-Log "=========================================="
        Write-Log "ERROR [STARTUP]: SCANNER_WEBHOOK_API_KEY nicht gesetzt!"
        Write-Log "ERROR [STARTUP]: Watcher wird NICHT gestartet."
        Write-Log ""
        Write-Log "Loesung (als Admin ausfuehren):"
        Write-Log '  [Environment]::SetEnvironmentVariable("SCANNER_WEBHOOK_API_KEY", "DEIN_KEY", "Machine")'
        Write-Log ""
        Write-Log "Danach: Scheduled Task neu starten oder PC neu starten."
        Write-Log "=========================================="
        exit 1
    }
    else {
        # Safe Logging: Nur ersten/letzten Teil des Keys zeigen
        $keyPreview = $ApiKey.Substring(0, [Math]::Min(4, $ApiKey.Length)) + "***" + $ApiKey.Substring([Math]::Max(0, $ApiKey.Length - 4))
        Write-Log "API-Key konfiguriert: $keyPreview"
    }

    # v2.0: Health-Check der Edge Function beim Start
    Write-Log "Pruefe Edge Function Health..."
    try {
        $healthHeaders = @{ "x-api-key" = $ApiKey }
        $health = Invoke-RestMethod -Uri $WebhookUrl -Method Get -Headers $healthHeaders -TimeoutSec 10
        Write-Log "Edge Function Status: $($health.status) (v$($health.version))"
        if ($health.status -ne "ready") {
            Write-Log "WARNUNG: Edge Function nicht 'ready' - Status: $($health.status)"
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Log "ERROR [STARTUP]: Health-Check 401 Unauthorized - API-Key ungueltig!"
            Write-Log "ERROR [STARTUP]: SCANNER_WEBHOOK_API_KEY stimmt nicht mit INTERNAL_API_KEY ueberein."
            exit 1
        }
        else {
            Write-Log "WARNUNG: Health-Check fehlgeschlagen ($statusCode) - Watcher startet trotzdem"
        }
    }

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
