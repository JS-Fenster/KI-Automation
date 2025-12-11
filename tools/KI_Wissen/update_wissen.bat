@echo off
REM KI-Wissensdatenbank Update-Skript
REM Kann manuell oder via Task Scheduler ausgeführt werden

cd /d "Z:\IT-Sammlung\KI_Automation\KI_Wissen"
python ki_wissen_updater.py %*

if %ERRORLEVEL% NEQ 0 (
    echo Update fehlgeschlagen!
    exit /b 1
)

echo Update erfolgreich.
