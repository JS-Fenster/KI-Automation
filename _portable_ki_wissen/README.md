# KI-Wissensdatenbank - Portable Version

Automatisch aktualisierte Wissensdatenbank fuer Claude Code, damit Claude
immer ueber aktuelle KI-Tools und deren Use-Cases Bescheid weiss.

## Schnellstart

```bash
# 1. Abhaengigkeiten installieren
pip install feedparser pyyaml requests

# 2. In dein Projekt-Verzeichnis kopieren
# (Ordner-Inhalt in dein Projekt-Root kopieren)

# 3. Projekt initialisieren (erstellt CLAUDE.md Template)
python ki_wissen_updater.py --setup .

# 4. Wissensdatenbank erstmalig befuellen
python ki_wissen_updater.py --force
```

## Ordnerstruktur nach Setup

```
Dein-Projekt/
├── CLAUDE.md                    # Projekt-Anweisungen fuer Claude
├── docs/
│   └── KI_Wissen.md             # Auto-generierte Wissensdatenbank
├── ki_wissen_updater.py         # Haupt-Skript
├── config.yaml                  # RSS-Feeds und Topics
├── update_log.json              # Update-Historie (auto-generiert)
└── README.md                    # Diese Datei
```

## Verwendung

```bash
# Normaler Lauf (prueft Intervall, default: 7 Tage)
python ki_wissen_updater.py

# Update erzwingen
python ki_wissen_updater.py --force

# Anderes Projekt-Root angeben
python ki_wissen_updater.py --project /pfad/zum/projekt --force
```

## Was passiert?

1. **RSS-Feeds abrufen:** 23 Quellen (OpenAI, Google, Microsoft, etc.)
2. **Filtern:** Nur relevante Themen (Claude, GPT, Automation, etc.)
3. **KI_Wissen.md generieren:** Releases + News + Tags
4. **CLAUDE.md aktualisieren:** Verweis auf Wissensdatenbank

## Warum Tags?

**Vorher (nutzlos):**
```
| 2025-10 | Perplexity Comet Browser | AI-nativer Browser |
```

**Nachher (nuetzlich):**
```
| 2025-10 | Perplexity Comet Browser | AI-Browser, automatisierbar | `browser-auto`, `api-alt` |
```

Wenn du Claude fragst: "Ich brauche Browser-Automation ohne API"
→ Claude findet Comet Browser ueber die Tags!

## Tags erklaert

| Tag | Bedeutung | Beispiel-Tools |
|-----|-----------|----------------|
| `schnell` | Niedrige Latenz, guenstig | Claude Haiku, Gemini Flash |
| `reasoning` | Komplexe Logik-Aufgaben | Claude Opus, o3 |
| `coding` | Programmierung | Cursor, Copilot |
| `agent` | Autonome Ausfuehrung | Claude Code, n8n |
| `tool-use` | Externe Tools nutzen | Claude, MCP |
| `automation` | Workflow-Automatisierung | n8n, Zapier |
| `browser-auto` | Browser steuern ohne API | Comet Browser |
| `api-alt` | Alternative wenn keine API | Comet Browser, Scraping |
| `open-source` | Lokal betreibbar | Llama, Stable Diffusion |
| `multimodal` | Text + Bild + Audio | Gemini, GPT-4 |

## Automatisches Update (optional)

### Windows Task Scheduler

```powershell
# Task erstellen (woechentlich Sonntag 03:00)
schtasks /create /tn "KI_Wissen_Update" /tr "python C:\Pfad\ki_wissen_updater.py --force" /sc weekly /d SUN /st 03:00
```

### Linux/Mac Cron

```bash
# crontab -e
0 3 * * 0 cd /pfad/zum/projekt && python ki_wissen_updater.py --force
```

## Anpassen

### Eigene Quellen hinzufuegen

In `config.yaml`:

```yaml
sources:
  meine_quelle:
    name: Mein Blog
    type: rss
    url: https://example.com/feed.xml
    priority: 3
```

### Eigene Topics hinzufuegen

In `config.yaml`:

```yaml
relevant_topics:
- mein_topic
- anderes_topic
```

### Eigene Releases hinzufuegen

In `ki_wissen_updater.py` bei `HISTORICAL_RELEASES`:

```python
"Meine Kategorie": [
    ("2025-12", "Mein Tool", "Beschreibung", ["tag1", "tag2"]),
],
```

## Troubleshooting

**"Fehlende Abhaengigkeit"**
```bash
pip install feedparser pyyaml requests
```

**"Config nicht gefunden"**
→ Skript im gleichen Ordner wie config.yaml ausfuehren

**"CLAUDE.md nicht gefunden"**
→ Zuerst `python ki_wissen_updater.py --setup .` ausfuehren

## Lizenz

MIT - Frei verwendbar
