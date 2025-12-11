#!/usr/bin/env python3
"""
KI-Wissensdatenbank Updater - PORTABLE VERSION
===============================================

Aktualisiert automatisch eine KI-Wissensdatenbank mit aktuellen
News und Releases aus RSS-Feeds.

PORTABLE: Funktioniert standalone ohne externe Abhaengigkeiten.
Einfach in einen Ordner kopieren und ausfuehren.

Verwendung:
    python ki_wissen_updater.py              # Normaler Lauf
    python ki_wissen_updater.py --force      # Update erzwingen
    python ki_wissen_updater.py --setup      # Erstellt CLAUDE.md Template

Voraussetzungen:
    pip install feedparser pyyaml requests
"""

import os
import sys
import re
import json
import logging
import argparse
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import Counter

# Externe Abhaengigkeiten
try:
    import feedparser
    import yaml
    import requests
except ImportError as e:
    print(f"Fehlende Abhaengigkeit: {e}")
    print("Bitte installieren: pip install feedparser pyyaml requests")
    sys.exit(1)

# =============================================================================
# KONFIGURATION
# =============================================================================

SCRIPT_DIR = Path(__file__).resolve().parent
CONFIG_FILE = SCRIPT_DIR / 'config.yaml'
UPDATE_LOG_FILE = SCRIPT_DIR / 'update_log.json'

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# =============================================================================
# HISTORICAL_RELEASES - Wichtige Releases seit Jan 2025 (portabel im Code)
# =============================================================================
# Format: (datum, name, beschreibung, [tags])
# Tags ermoeglichen Use-Case-basierte Suche
# =============================================================================

HISTORICAL_RELEASES = {
    "Anthropic/Claude": [
        ("2025-01", "Claude 3.5 Haiku", "Schnellstes Modell der Claude 3.5 Familie", ["schnell", "guenstig"]),
        ("2025-05-22", "Claude Opus 4 & Sonnet 4", "Naechste Generation mit verbessertem Reasoning", ["reasoning", "coding"]),
        ("2025-08-05", "Claude Opus 4.1", "Verbessertes Tool-Use und Agentic Capabilities", ["tool-use", "agent"]),
        ("2025-09-29", "Claude Sonnet 4.5", "Hybrid reasoning mit extended thinking", ["reasoning", "extended-thinking"]),
        ("2025-10", "Claude Haiku 4.5", "Schnelles Modell mit hybrid reasoning", ["schnell", "reasoning"]),
        ("2025-10", "Claude Code CLI Launch", "Offizielle CLI fuer Terminal-basierte Entwicklung", ["cli", "dev-tool", "automation"]),
        ("2025-11", "Model Context Protocol (MCP)", "Standard fuer Tool-Integrationen", ["integration", "tool-use", "standard"]),
        ("2025-11-24", "Claude Opus 4.5", "Flaggschiff mit erweitertem reasoning", ["reasoning", "flagship"]),
    ],
    "OpenAI": [
        ("2025-04", "GPT-4.1", "Verbessertes Coding und Instruction Following", ["coding"]),
        ("2025-04-16", "o3 & o4-mini", "Reasoning-Modelle", ["reasoning"]),
        ("2025-06", "o3-pro", "Premium Reasoning-Variante", ["reasoning", "premium"]),
        ("2025-08-07", "GPT-5", "Naechste Generation Flagship", ["flagship"]),
        ("2025-12", "GPT-5.1", "Schnellere, konversationellere Variante", ["schnell"]),
    ],
    "Google": [
        ("2025-01-30", "Gemini 2.0 Flash", "Schnelles multimodales Modell", ["schnell", "multimodal"]),
        ("2025-02-05", "Gemini 2.0 Pro", "Pro-Version mit verbessertem Reasoning", ["reasoning"]),
        ("2025-03-25", "Gemini 2.5 Pro", "Preview mit extended thinking", ["extended-thinking"]),
        ("2025-06-17", "Gemini 2.5 GA", "General Availability", []),
        ("2025-11-18", "Gemini 3.0 Pro", "Frontier Vision AI", ["vision", "multimodal"]),
    ],
    "AI Coding Tools": [
        ("2025-05-15", "Cursor v0.50", "Agent-basiertes Background Coding", ["ide", "agent", "coding"]),
        ("2025-06-04", "Cursor v1.0", "Offizieller 1.0 Release", ["ide", "coding"]),
        ("2025-07-03", "Cursor v1.2", "Bug Hunter Feature", ["ide", "debugging"]),
        ("2025-09-12", "Cursor v1.6", "MCP Support", ["ide", "mcp"]),
        ("2025-10", "Cursor v2.0", "Major Update mit neuen Features", ["ide", "coding"]),
        ("2025", "GitHub Copilot Workspace", "Agentic Coding Environment", ["ide", "agent", "github"]),
        ("2025", "Windsurf (ex-Codeium)", "AI IDE mit Deep Integration", ["ide", "coding"]),
    ],
    "Automation/RAG": [
        ("2025-12-05", "n8n 2.0.0", "Major Release mit AI-fokussierten Features", ["workflow", "automation", "no-code"]),
        ("2025", "LangChain 0.3+", "Stabilere API, bessere Agent-Unterstuetzung", ["framework", "agent", "python"]),
        ("2025", "LlamaIndex", "LlamaCloud und LlamaParse fuer Enterprise RAG", ["rag", "enterprise", "parsing"]),
    ],
    "Bild-KI": [
        ("2025-04-03", "Midjourney V7 Alpha", "Neue Version mit verbesserter Qualitaet", ["bild", "generativ"]),
        ("2025-06-17", "Midjourney V7 Default", "V7 wird Standard", ["bild", "generativ"]),
        ("2025", "Stable Diffusion 3.5", "Large/Medium/Flash Varianten", ["bild", "open-source", "lokal"]),
        ("2025", "FLUX.1 Pro", "Black Forest Labs Alternative", ["bild", "generativ"]),
    ],
    "Audio/Voice": [
        ("2025-05", "ElevenLabs Conversational AI 2.0", "Realtime Voice Agents", ["voice", "tts", "agent"]),
        ("2025-06", "ElevenLabs Mobile App", "iOS/Android Launch", ["voice", "mobil"]),
        ("2025-11", "ElevenLabs Scribe v2 Realtime", "Echtzeit-Transkription", ["stt", "transkription", "realtime"]),
        ("2025", "Eleven v3", "Verbessertes Voice Model", ["voice", "tts"]),
    ],
    "Andere": [
        ("2025-04", "Perplexity Major Update", "Verbesserte Suche und Quellenangaben", ["suche", "recherche"]),
        ("2025-10", "Perplexity Comet Browser", "AI-Browser, automatisierbar, API-Alternative", ["browser-auto", "api-alt", "scraping"]),
        ("2025", "Meta Llama 3.1/3.2", "Open-Source LLMs", ["open-source", "lokal"]),
        ("2025", "Mistral Large 2 / Devstral", "Europaeische LLM-Alternative", ["eu", "open-source"]),
    ],
}

# =============================================================================
# HILFSFUNKTIONEN
# =============================================================================

def load_config() -> Dict:
    """Laedt Konfiguration aus YAML"""
    if not CONFIG_FILE.exists():
        logger.error(f"Config nicht gefunden: {CONFIG_FILE}")
        sys.exit(1)

    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def load_update_log() -> Dict:
    """Laedt Update-Log oder erstellt neues"""
    if UPDATE_LOG_FILE.exists():
        with open(UPDATE_LOG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"last_update": None, "entries_count": 0}


def save_update_log(log: Dict) -> None:
    """Speichert Update-Log"""
    with open(UPDATE_LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2, ensure_ascii=False)


def is_update_needed(log: Dict, interval_days: int) -> bool:
    """Prueft ob Update faellig ist"""
    if not log.get("last_update"):
        return True

    last = datetime.fromisoformat(log["last_update"])
    return datetime.now() - last > timedelta(days=interval_days)


def fetch_rss_feeds(sources: Dict, topics: List[str]) -> List[Dict]:
    """Holt Eintraege aus RSS-Feeds"""
    all_entries = []

    for source_id, source in sources.items():
        logger.info(f"Lade Feed: {source['name']}")
        try:
            feed = feedparser.parse(
                source['url'],
                request_headers={'User-Agent': 'Mozilla/5.0'}
            )

            if feed.bozo:
                logger.warning(f"Feed-Fehler bei {source['name']}: {feed.bozo_exception}")

            entries = feed.entries[:10]  # Max 10 pro Feed
            logger.info(f"  - {len(entries)} Eintraege gefunden")

            for entry in entries:
                all_entries.append({
                    'title': entry.get('title', ''),
                    'link': entry.get('link', ''),
                    'summary': entry.get('summary', '')[:500],
                    'source': source['name'],
                    'published': entry.get('published', ''),
                    'priority': source.get('priority', 3)
                })
        except Exception as e:
            logger.error(f"Fehler bei {source['name']}: {e}")

    return all_entries


def filter_relevant(entries: List[Dict], topics: List[str]) -> List[Dict]:
    """Filtert relevante Eintraege nach Topics"""
    relevant = []
    topics_lower = [t.lower() for t in topics]

    for entry in entries:
        text = f"{entry['title']} {entry['summary']}".lower()

        matched_topics = [t for t in topics_lower if t in text]
        if matched_topics:
            entry['matched_topics'] = matched_topics[:3]
            relevant.append(entry)

    # Nach Prioritaet sortieren
    relevant.sort(key=lambda x: x['priority'])
    return relevant


def generate_historical_content() -> str:
    """Generiert Markdown-Content aus HISTORICAL_RELEASES"""
    content = "## Wichtige Releases 2025\n\n"
    content += "> Historische Entwicklungen seit Januar 2025 (fest im Code fuer Portabilitaet)\n\n"

    for category, releases in HISTORICAL_RELEASES.items():
        content += f"### {category}\n"
        content += "| Datum | Release | Beschreibung | Tags |\n"
        content += "|-------|---------|-------------|------|\n"
        for item in releases:
            date, name, desc = item[0], item[1], item[2]
            tags = item[3] if len(item) > 3 else []
            tags_str = ", ".join(f"`{t}`" for t in tags) if tags else ""
            content += f"| {date} | **{name}** | {desc} | {tags_str} |\n"
        content += "\n"

    return content


def generate_news_content(entries: List[Dict]) -> str:
    """Generiert Markdown-Content aus News-Eintraegen"""
    if not entries:
        return ""

    content = "## Aktuelle News\n\n"
    content += f"> Letzte Aktualisierung: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"

    # Gruppiere nach Source
    by_source = {}
    for entry in entries[:30]:  # Max 30 Eintraege
        source = entry['source']
        if source not in by_source:
            by_source[source] = []
        by_source[source].append(entry)

    for source, items in by_source.items():
        content += f"### {source}\n"
        for item in items[:5]:  # Max 5 pro Source
            topics = ", ".join(item.get('matched_topics', []))
            content += f"- **[{item['title']}]({item['link']})** ({source}) `{topics}`\n"
        content += "\n"

    return content


def write_knowledge_db(path: Path, historical: str, news: str) -> None:
    """Schreibt die Wissensdatenbank"""
    content = f"""# KI-Wissensdatenbank

> Auto-generiert von ki_wissen_updater.py
> Letzte Aktualisierung: {datetime.now().strftime('%Y-%m-%d %H:%M')}

{historical}

{news}

---

## Quick Reference

| Tag | Bedeutung |
|-----|-----------|
| `schnell` | Niedrige Latenz, guenstig |
| `reasoning` | Komplexe Aufgaben, Logik |
| `coding` | Programmierung |
| `agent` | Autonome Ausfuehrung |
| `tool-use` | Kann externe Tools nutzen |
| `automation` | Fuer Automatisierung geeignet |
| `workflow` | Prozess-Automatisierung |
| `open-source` | Lokal betreibbar |
| `browser-auto` | Browser-Automatisierung |
| `api-alt` | Alternative wenn keine API |
| `multimodal` | Text + Bild + Audio |
| `vision` | Bilderkennung |
"""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')
    logger.info(f"Wissensdatenbank aktualisiert: {path}")


def update_claude_md(claude_md_path: Path, kb_path: Path) -> bool:
    """Aktualisiert den KI-WISSEN Abschnitt in CLAUDE.md"""

    start_marker = "<!-- KI-WISSEN-START -->"
    end_marker = "<!-- KI-WISSEN-END -->"

    # Relativer Pfad (POSIX-Format fuer Regex-Kompatibilitaet)
    try:
        rel_path = kb_path.relative_to(claude_md_path.parent)
    except ValueError:
        rel_path = kb_path
    rel_path_str = rel_path.as_posix() if hasattr(rel_path, 'as_posix') else str(rel_path).replace('\\', '/')

    # Neuer Abschnitt
    section = f"""{start_marker}
## KI-Wissen (Auto-generiert)

> **Aktualisiert:** {datetime.now().strftime('%Y-%m-%d %H:%M')}
>
> **IMMER einlesen:** `{rel_path_str}`
>
> Enthaelt aktuelle KI/Automation-News und Tools. Wird woechentlich automatisch aktualisiert.
{end_marker}"""

    try:
        if claude_md_path.exists():
            content = claude_md_path.read_text(encoding='utf-8')

            if start_marker in content:
                # Ersetze existierenden Abschnitt
                pattern = f"{re.escape(start_marker)}.*?{re.escape(end_marker)}"
                new_content = re.sub(pattern, section, content, flags=re.DOTALL)
            else:
                # Am Ende hinzufuegen
                new_content = content.rstrip() + "\n\n" + section + "\n"

            claude_md_path.write_text(new_content, encoding='utf-8')
            logger.info(f"CLAUDE.md aktualisiert")
            return True
        else:
            logger.warning(f"CLAUDE.md nicht gefunden: {claude_md_path}")
            return False

    except Exception as e:
        logger.error(f"Fehler beim CLAUDE.md Update: {e}")
        return False


def setup_project(project_path: Path) -> None:
    """Richtet ein neues Projekt mit CLAUDE.md ein"""

    claude_md = project_path / "CLAUDE.md"
    docs_dir = project_path / "docs"

    if claude_md.exists():
        logger.info(f"CLAUDE.md existiert bereits: {claude_md}")
        return

    docs_dir.mkdir(exist_ok=True)

    template = """# Projektanweisungen

## Allgemeine Anforderungen

| Bereich | Anforderung |
|---------|-------------|
| **Sprache** | Deutsch (Konversation), Englisch (Code) |
| **Entscheidungen** | Selbststaendig treffen wenn moeglich |
| **Rueckfragen** | Bei Unklarheiten immer nachfragen |

## Wissensdatenbanken

| Datei | Inhalt | Pfad |
|-------|--------|------|
| **KI_Wissen.md** | Aktuelle KI/Automation-Tools | `docs/` |

**KI_Wissen.md Schreibregeln:**
- **Verdichtet & praegnant** - Nur Kern-Infos
- **Use-Cases nennen** - Nicht nur "Tool X existiert" sondern "Tool X fuer Y nuetzlich"
- **Tags nutzen** - z.B. `automation`, `browser-auto`, `api-alt`

<!-- KI-WISSEN-START -->
## KI-Wissen (Auto-generiert)

> **Aktualisiert:** Noch nicht initialisiert
>
> **IMMER einlesen:** `docs/KI_Wissen.md`
>
> Fuehre `python ki_wissen_updater.py --force` aus um zu initialisieren.
<!-- KI-WISSEN-END -->
"""

    claude_md.write_text(template, encoding='utf-8')
    logger.info(f"CLAUDE.md Template erstellt: {claude_md}")
    logger.info(f"Fuehre jetzt aus: python ki_wissen_updater.py --force")


# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='KI-Wissensdatenbank Updater (Portable)',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--force', action='store_true', help='Update erzwingen')
    parser.add_argument('--setup', type=Path, metavar='PATH', help='Projekt-Setup in PATH')
    parser.add_argument('--project', type=Path, default=SCRIPT_DIR, help='Projekt-Root (default: Skript-Ordner)')

    args = parser.parse_args()

    # Setup-Modus
    if args.setup:
        setup_project(args.setup)
        return

    logger.info("=" * 50)
    logger.info("KI-Wissensdatenbank Updater gestartet")
    logger.info("=" * 50)

    # Konfiguration laden
    config = load_config()
    log = load_update_log()

    # Pfade aufloesen
    project_root = args.project.resolve()
    kb_path = project_root / config['paths']['knowledge_db']
    claude_md_path = project_root / 'CLAUDE.md'

    # Update-Check
    if not args.force and not is_update_needed(log, config['update_interval_days']):
        logger.info(f"Kein Update noetig (letztes: {log.get('last_update', 'nie')})")
        logger.info(f"Naechstes Update in {config['update_interval_days']} Tagen oder mit --force")
        return

    if args.force:
        logger.info("Update erzwungen (--force)")

    # Feeds abrufen
    logger.info("\nStarte Feed-Abruf...")
    entries = fetch_rss_feeds(config['sources'], config['relevant_topics'])

    # Filtern
    relevant = filter_relevant(entries, config['relevant_topics'])
    logger.info(f"Relevante Eintraege: {len(relevant)} von {len(entries)}")

    # Content generieren
    historical = generate_historical_content()
    news = generate_news_content(relevant)

    # Wissensdatenbank schreiben
    logger.info("\nAktualisiere Wissensdatenbank...")
    write_knowledge_db(kb_path, historical, news)

    # CLAUDE.md aktualisieren
    logger.info("\nAktualisiere CLAUDE.md...")
    update_claude_md(claude_md_path, kb_path)

    # Log speichern
    log['last_update'] = datetime.now().isoformat()
    log['entries_count'] = len(relevant)
    save_update_log(log)

    logger.info("\n" + "=" * 50)
    logger.info("Update erfolgreich abgeschlossen!")
    logger.info(f"Relevante Eintraege: {len(relevant)}")
    logger.info("=" * 50)


if __name__ == '__main__':
    main()
