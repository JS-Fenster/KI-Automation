@echo off
echo ========================================
echo KI-Wissensdatenbank - Setup
echo ========================================
echo.

REM Prüfe Python
python --version >nul 2>&1
if errorlevel 1 (
    echo FEHLER: Python nicht gefunden!
    echo Bitte Python 3.8+ installieren: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python gefunden. Installiere Abhängigkeiten...
pip install -r requirements.txt

echo.
echo ========================================
echo Setup abgeschlossen!
echo ========================================
echo.
echo Verwendung:
echo   python ki_wissen_updater.py              - Update durchführen
echo   python ki_wissen_updater.py --force      - Update erzwingen
echo   python ki_wissen_updater.py --analyze    - Nur Analyse
echo.
echo Passe config.yaml an deine Themen an!
echo.
pause
