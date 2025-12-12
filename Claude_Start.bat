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
claude --dangerously-skip-permissions
