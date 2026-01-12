@echo off
cd /d "%~dp0.."

echo === Git Repos aktualisieren ===
for /d %%D in (*) do (
    if exist "%%D\.git" (
        echo Pulling %%D...
        cd "%%D" && git pull && cd ..
    )
)

echo.
echo === Claude starten ===
:start
claude --dangerously-skip-permissions "/init"
echo.
set /p restart="Claude neu starten? (j/n): "
if /i "%restart%"=="j" goto start
