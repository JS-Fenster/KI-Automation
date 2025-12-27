# Install-ScannerService.ps1
# Richtet den ScannerWatcher als Windows-Dienst ein (muss als Admin ausgefuehrt werden)

$ServiceName = "ScannerWebhookWatcher"
$ServiceDisplayName = "Scanner Webhook Watcher"
$ServiceDescription = "Ueberwacht den Scanner-Ordner und sendet neue Dateien an Supabase Edge Function"
$ScriptPath = "$PSScriptRoot\ScannerWatcher.ps1"

# Pruefe Admin-Rechte
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "FEHLER: Dieses Script muss als Administrator ausgefuehrt werden!" -ForegroundColor Red
    Write-Host "Rechtsklick -> Als Administrator ausfuehren" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Scanner Webhook Service Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Option 1: Als geplante Aufgabe (einfacher)
Write-Host "Option 1: Als geplante Aufgabe einrichten (empfohlen)" -ForegroundColor Green
Write-Host "-" * 50

$taskAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`""

# Trigger 1: Bei Systemstart
$triggerStartup = New-ScheduledTaskTrigger -AtStartup

# Trigger 2: Alle 5 Minuten (Sicherheitsnetz falls Task abstuerzt)
$triggerRepeat = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)

$taskPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Robuste Settings: Unbegrenzte Neustarts, nicht stoppen wenn laeuft
$taskSettings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Days 9999)

try {
    # Loesche bestehende Aufgabe falls vorhanden
    Unregister-ScheduledTask -TaskName $ServiceName -Confirm:$false -ErrorAction SilentlyContinue

    # Erstelle neue Aufgabe mit beiden Triggern
    Register-ScheduledTask -TaskName $ServiceName -Action $taskAction -Trigger @($triggerStartup, $triggerRepeat) -Principal $taskPrincipal -Settings $taskSettings -Description $ServiceDescription

    Write-Host "Geplante Aufgabe '$ServiceName' erfolgreich erstellt!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Konfiguration:" -ForegroundColor Yellow
    Write-Host "  - Startet bei Systemstart" -ForegroundColor White
    Write-Host "  - Prueft alle 5 Minuten ob noch aktiv" -ForegroundColor White
    Write-Host "  - Bei Absturz: Unbegrenzte Neustartversuche" -ForegroundColor White
    Write-Host "  - Mehrfachstart wird ignoriert (IgnoreNew)" -ForegroundColor White
    Write-Host ""

    # Aufgabe sofort starten
    $startNow = Read-Host "Moechtest du den Watcher jetzt starten? (j/n)"
    if ($startNow -eq "j" -or $startNow -eq "J") {
        Start-ScheduledTask -TaskName $ServiceName
        Write-Host "Watcher gestartet!" -ForegroundColor Green
    }
}
catch {
    Write-Host "FEHLER bei der Installation: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nuetzliche Befehle:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Status pruefen:  Get-ScheduledTask -TaskName '$ServiceName'" -ForegroundColor White
Write-Host "Manuell starten: Start-ScheduledTask -TaskName '$ServiceName'" -ForegroundColor White
Write-Host "Stoppen:         Stop-ScheduledTask -TaskName '$ServiceName'" -ForegroundColor White
Write-Host "Deinstallieren:  Unregister-ScheduledTask -TaskName '$ServiceName'" -ForegroundColor White
Write-Host ""
Write-Host "Log-Datei: $PSScriptRoot\scanner_webhook.log" -ForegroundColor Yellow
Write-Host ""
pause
