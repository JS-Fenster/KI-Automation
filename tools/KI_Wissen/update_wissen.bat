@echo off
REM KI-Wissensdatenbank Update-Skript
REM Kann manuell oder via Task Scheduler ausgefuehrt werden
REM Mit Auto-Commit fuer Multi-Rechner-Sync

set REPO_ROOT=C:\Claude_Workspace\WORK\repos\KI_Automation
set TOOL_DIR=%REPO_ROOT%\tools\KI_Wissen

REM === Git Pull vor Update (um Konflikte zu vermeiden) ===
echo Hole aktuelle Aenderungen von Remote...
cd /d "%REPO_ROOT%"
git pull --rebase 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNUNG: Git Pull fehlgeschlagen - fahre trotzdem fort
)

REM === Python-Script ausfuehren ===
cd /d "%TOOL_DIR%"
python ki_wissen_updater.py %*

if %ERRORLEVEL% NEQ 0 (
    echo Update fehlgeschlagen!
    exit /b 1
)

echo Update erfolgreich.

REM === Auto-Commit und Push ===
echo.
echo Committe Aenderungen...
cd /d "%REPO_ROOT%"

REM Nur die relevanten Dateien adden
git add tools/KI_Wissen/discovered_releases.json 2>nul
git add tools/KI_Wissen/source_gaps.json 2>nul
git add tools/KI_Wissen/update_log.json 2>nul
git add CLAUDE.md 2>nul

REM Commit nur wenn es Aenderungen gibt
git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
    git commit -m "auto: KI_Wissen Update %date%"
    echo Pushe zu Remote...
    git push
    if %ERRORLEVEL% EQU 0 (
        echo Auto-Commit und Push erfolgreich.
    ) else (
        echo WARNUNG: Push fehlgeschlagen - bitte manuell pushen
    )
) else (
    echo Keine Aenderungen zum Committen.
)
