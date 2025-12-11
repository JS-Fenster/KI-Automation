========================================
KI-WISSENSDATENBANK - PORTABLE VERSION
========================================

INSTALLATION
------------
1. Python 3.8+ installieren (falls nicht vorhanden)
   https://www.python.org/downloads/

2. setup.bat ausführen (installiert Abhängigkeiten)

3. config.yaml anpassen:
   - relevant_topics: Themen die dich interessieren
   - sources: Weitere RSS-Feeds hinzufügen


VERWENDUNG
----------
Doppelklick auf update.bat
  oder
Kommandozeile:
  python ki_wissen_updater.py              # Normales Update
  python ki_wissen_updater.py --force      # Update erzwingen
  python ki_wissen_updater.py --analyze    # Nur Analyse zeigen


NEUE QUELLE HINZUFÜGEN
----------------------
python ki_wissen_updater.py --add-source KURZNAME "https://example.com/rss" "Anzeigename"

Beispiel:
python ki_wissen_updater.py --add-source hackernews "https://news.ycombinator.com/rss" "Hacker News"


DATEIEN
-------
config.yaml           - Konfiguration (Quellen, Themen)
KI_Wissensdatenbank.md - Die generierte Wissensdatei
update_log.json       - Update-Historie
source_gaps.json      - Lücken-Analyse
updater.log           - Log-Datei


AUTOMATISIERUNG (optional)
--------------------------
Windows Task Scheduler:
1. Taskplaner öffnen
2. Neue Aufgabe erstellen
3. Trigger: Wöchentlich
4. Aktion: update.bat ausführen


TIPPS
-----
- Füge relevante Topics für deine Projekte hinzu
- Entferne Quellen die dich nicht interessieren
- Die Wissensdatenbank wird automatisch verdichtet
- Duplikate werden automatisch entfernt


Bei Fragen: Die config.yaml ist selbsterklärend!
