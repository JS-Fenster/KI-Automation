@echo off
REM KI-Wissensdatenbank Update-Skript
REM Kann manuell oder via Task Scheduler ausgeführt werden

cd /d "C:\Claude_Workspace\WORK\repos\KI-Automation\tools\KI_Wissen"
python ki_wissen_updater.py %*

if %ERRORLEVEL% NEQ 0 (
    echo Update fehlgeschlagen!
    exit /b 1
)

echo Update erfolgreich.
