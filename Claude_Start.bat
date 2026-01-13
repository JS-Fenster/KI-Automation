@echo off
REM Claude Code Starter mit Bootstrap-Verzeichnis

REM Git Repos im Hub aktualisieren
cd /d "%~dp0.."
echo === Git Repos aktualisieren ===
for /d %%D in (*) do (
    if exist "%%D\.git" (
        echo Pulling %%D...
        cd "%%D" && git pull && cd ..
    )
)

echo.
REM Wechsle ins Bootstrap-Verzeichnis (lokale CLAUDE.md + paths.local.yml)
cd /d "%USERPROFILE%\Desktop\Claude"
echo === Claude starten aus %CD% ===

:start
claude --dangerously-skip-permissions "/init"
echo.
set /p restart="Claude neu starten? (j/n): "
if /i "%restart%"=="j" goto start
