# Install-ScannerService.ps1
# Richtet den ScannerWatcher als Windows-Dienst ein (muss als Admin ausgefuehrt werden)

$ServiceName = "ScannerWebhookWatcher"
$ServiceDisplayName = "Scanner Webhook Watcher"
$ServiceDescription = "Ueberwacht den Scanner-Ordner und sendet neue Dateien an n8n Webhook"
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
$taskTrigger = New-ScheduledTaskTrigger -AtStartup
$taskPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$taskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

try {
    # Loesche bestehende Aufgabe falls vorhanden
    Unregister-ScheduledTask -TaskName $ServiceName -Confirm:$false -ErrorAction SilentlyContinue

    # Erstelle neue Aufgabe
    Register-ScheduledTask -TaskName $ServiceName -Action $taskAction -Trigger $taskTrigger -Principal $taskPrincipal -Settings $taskSettings -Description $ServiceDescription

    Write-Host "Geplante Aufgabe '$ServiceName' erfolgreich erstellt!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Die Aufgabe startet automatisch beim Systemstart." -ForegroundColor Yellow
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
