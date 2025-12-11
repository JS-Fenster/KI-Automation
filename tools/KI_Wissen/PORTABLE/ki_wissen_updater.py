#!/usr/bin/env python3
"""
KI-Wissensdatenbank Updater (Portable Version)
===============================================
Automatisches Update-Tool für KI/Automation Wissen.
Funktioniert auf jedem PC mit Python 3.8+

Verwendung:
    python ki_wissen_updater.py              # Normaler Lauf
    python ki_wissen_updater.py --force      # Update erzwingen
    python ki_wissen_updater.py --analyze    # Nur Gap-Analyse
    python ki_wissen_updater.py --add-source NAME URL "Display Name"
"""
from __future__ import annotations

import os
import sys
import json
import yaml
import logging
import argparse
import feedparser
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any
from collections import Counter

# Pfade relativ zum Skript
SCRIPT_DIR = Path(__file__).parent
CONFIG_FILE = SCRIPT_DIR / 'config.yaml'
UPDATE_LOG_FILE = SCRIPT_DIR / 'update_log.json'
GAP_ANALYSIS_FILE = SCRIPT_DIR / 'source_gaps.json'
KNOWLEDGE_DB_FILE = SCRIPT_DIR / 'KI_Wissensdatenbank.md'

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(SCRIPT_DIR / 'updater.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


def load_config() -> Dict[str, Any]:
    if not CONFIG_FILE.exists():
        logger.error(f"Config nicht gefunden: {CONFIG_FILE}")
        logger.info("Erstelle config.yaml mit Standardwerten...")
        create_default_config()
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def create_default_config():
    default = {
        'update_interval_days': 7,
        'sources': {
            'openai': {'name': 'OpenAI Blog', 'type': 'rss', 'url': 'https://openai.com/blog/rss.xml', 'priority': 1},
            'google_ai': {'name': 'Google AI Blog', 'type': 'rss', 'url': 'https://blog.google/technology/ai/rss/', 'priority': 1},
            'huggingface': {'name': 'Hugging Face Blog', 'type': 'rss', 'url': 'https://huggingface.co/blog/feed.xml', 'priority': 2},
            'techcrunch_ai': {'name': 'TechCrunch AI', 'type': 'rss', 'url': 'https://techcrunch.com/category/artificial-intelligence/feed/', 'priority': 3},
            'langchain': {'name': 'LangChain Blog', 'type': 'rss', 'url': 'https://blog.langchain.com/rss/', 'priority': 2},
        },
        'relevant_topics': ['claude', 'gpt', 'llm', 'agent', 'automation', 'api', 'vision', 'rag', 'langchain']
    }
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        yaml.dump(default, f, default_flow_style=False, allow_unicode=True)


def save_config(config: Dict[str, Any]):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True, sort_keys=False)


def load_update_log() -> Dict[str, Any]:
    if UPDATE_LOG_FILE.exists():
        with open(UPDATE_LOG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"updates": [], "last_update": None}


def save_update_log(log: Dict[str, Any]):
    with open(UPDATE_LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2, ensure_ascii=False, default=str)


def is_update_needed(config: Dict, log: Dict, force: bool = False) -> bool:
    if force:
        logger.info("Update erzwungen (--force)")
        return True
    if not log.get("last_update"):
        logger.info("Erster Lauf - Update wird durchgeführt")
        return True
    last = datetime.fromisoformat(log["last_update"])
    interval = config.get("update_interval_days", 7)
    next_update = last + timedelta(days=interval)
    if datetime.now() >= next_update:
        logger.info(f"Update fällig (letztes: {last.strftime('%Y-%m-%d')})")
        return True
    days = (next_update - datetime.now()).days
    logger.info(f"Kein Update nötig. Nächstes in {days} Tagen")
    return False


def fetch_rss_feed(source: Dict) -> tuple[List[Dict], bool]:
    entries = []
    success = True
    try:
        logger.info(f"Lade: {source['name']}")
        feed = feedparser.parse(source['url'], request_headers={'User-Agent': 'Mozilla/5.0'})
        if feed.bozo and feed.bozo_exception:
            logger.warning(f"Feed-Fehler: {feed.bozo_exception}")
            success = False
        for entry in feed.entries[:10]:
            entries.append({
                'title': entry.get('title', 'Kein Titel'),
                'link': entry.get('link', ''),
                'published': entry.get('published', entry.get('updated', '')),
                'summary': entry.get('summary', entry.get('description', ''))[:500],
                'source': source['name']
            })
        if entries:
            success = True
        logger.info(f"  → {len(entries)} Einträge")
    except Exception as e:
        logger.error(f"Fehler: {e}")
        success = False
    return entries, success


def filter_relevant(entries: List[Dict], topics: List[str]) -> tuple[List[Dict], Counter]:
    relevant = []
    topics_lower = [t.lower() for t in topics]
    counts = Counter()
    for entry in entries:
        text = f"{entry['title']} {entry['summary']}".lower()
        matching = [t for t in topics_lower if t in text]
        if matching:
            entry['matching_topics'] = matching
            relevant.append(entry)
            for t in matching:
                counts[t] += 1
    logger.info(f"Relevant: {len(relevant)} von {len(entries)}")
    return relevant, counts


def fetch_all_sources(config: Dict) -> tuple[List[Dict], Counter, Dict[str, bool]]:
    all_entries = []
    topics = config.get('relevant_topics', [])
    health = {}
    sources = sorted(config.get('sources', {}).items(), key=lambda x: x[1].get('priority', 99))
    for name, src in sources:
        if src.get('type') == 'rss':
            entries, ok = fetch_rss_feed(src)
            all_entries.extend(entries)
            health[name] = ok
    relevant, counts = filter_relevant(all_entries, topics)
    return relevant, counts, health


def analyze_gaps(config: Dict, counts: Counter, health: Dict[str, bool]) -> Dict:
    topics = config.get('relevant_topics', [])
    low = [{'topic': t, 'count': counts.get(t.lower(), 0)} for t in topics if counts.get(t.lower(), 0) < 2]
    broken = [n for n, ok in health.items() if not ok]
    return {
        'analyzed_at': datetime.now().isoformat(),
        'low_coverage_topics': low,
        'broken_sources': broken,
        'well_covered': [{'topic': t, 'count': c} for t, c in counts.most_common(10)]
    }


def deduplicate(entries: List[Dict]) -> List[Dict]:
    seen = set()
    unique = []
    for e in entries:
        key = e['title'].lower()[:40]
        if key not in seen:
            seen.add(key)
            unique.append(e)
    return unique


def generate_content(entries: List[Dict], config: Dict, gaps: Dict = None) -> str:
    now = datetime.now()
    next_upd = now + timedelta(days=config.get('update_interval_days', 7))
    entries = deduplicate(entries)
    entries = sorted(entries, key=lambda x: len(x.get('matching_topics', [])), reverse=True)

    content = f"""# KI-Wissensdatenbank

> Aktualisiert: {now.strftime('%Y-%m-%d')} | Nächstes Update: {next_upd.strftime('%Y-%m-%d')} | {len(entries)} Einträge

---

## Top-News

"""
    for e in entries[:10]:
        topics = ", ".join(e.get('matching_topics', []))
        content += f"- **[{e['title']}]({e['link']})** ({e['source']}) `{topics}`\n"

    content += "\n---\n\n## Nach Quelle\n\n"
    by_source = {}
    for e in entries:
        src = e['source']
        if src not in by_source:
            by_source[src] = []
        by_source[src].append(e)

    for src, items in by_source.items():
        content += f"### {src}\n"
        for e in items[:3]:
            summary = re.sub('<[^<]+?>', '', e.get('summary', ''))
            if len(summary) > 50:
                summary = summary[:80] + '...'
                content += f"- [{e['title']}]({e['link']}): {summary}\n"
            else:
                content += f"- [{e['title']}]({e['link']})\n"
        content += "\n"

    if gaps and gaps.get('low_coverage_topics'):
        low = [t['topic'] for t in gaps['low_coverage_topics'][:5]]
        content += f"\n---\n\n**Lücken:** {', '.join(low)}\n"

    content += f"\n---\n\n*Generiert: {now.strftime('%Y-%m-%d %H:%M')}*\n"
    return content


def validate_rss(url: str) -> bool:
    try:
        feed = feedparser.parse(url, request_headers={'User-Agent': 'Mozilla/5.0'})
        return len(feed.entries) > 0 and not feed.bozo
    except:
        return False


def add_source(config: Dict, name: str, url: str, display: str) -> bool:
    if name in config.get('sources', {}):
        logger.warning(f"'{name}' existiert bereits")
        return False
    if not validate_rss(url):
        logger.warning(f"Ungültiger RSS-Feed: {url}")
        return False
    if 'sources' not in config:
        config['sources'] = {}
    config['sources'][name] = {
        'name': display, 'type': 'rss', 'url': url, 'priority': 3,
        'added': datetime.now().strftime('%Y-%m-%d')
    }
    logger.info(f"Hinzugefügt: {display}")
    return True


def update_claude_md() -> bool:
    """Aktualisiert CLAUDE.md mit Hinweis auf die Wissensdatenbank (mit Sicherheitsmaßnahmen)"""
    # CLAUDE.md im selben Verzeichnis wie das Skript (portabel)
    claude_md_path = SCRIPT_DIR / 'CLAUDE.md'
    backup_path = SCRIPT_DIR / 'CLAUDE.md.bak'

    # Marker für auto-generierten Abschnitt
    START_MARKER = "<!-- KI-WISSEN-START -->"
    END_MARKER = "<!-- KI-WISSEN-END -->"

    # Neuer Abschnitt
    new_section = f"""{START_MARKER}
## KI-Wissen (Auto-generiert)

> **Aktualisiert:** {datetime.now().strftime('%Y-%m-%d %H:%M')}
>
> **IMMER einlesen:** `KI_Wissensdatenbank.md`
>
> Enthält aktuelle KI/Automation-News und Tools. Wird wöchentlich automatisch aktualisiert.
{END_MARKER}"""

    try:
        # CLAUDE.md lesen (oder neu erstellen)
        if claude_md_path.exists():
            original_content = claude_md_path.read_text(encoding='utf-8')
            original_length = len(original_content)

            # SICHERHEIT: Backup erstellen vor Änderung
            backup_path.write_text(original_content, encoding='utf-8')
            logger.info(f"Backup erstellt: {backup_path}")
        else:
            # Neue CLAUDE.md für portable Version erstellen
            original_content = """# Projektanweisungen

Diese Datei wird von Claude Code automatisch eingelesen.

"""
            original_length = 0
            logger.info(f"Erstelle neue CLAUDE.md: {claude_md_path}")

        content = original_content

        # Alten Abschnitt ersetzen oder neuen einfügen
        if START_MARKER in content:
            pattern = f"{re.escape(START_MARKER)}.*?{re.escape(END_MARKER)}"
            content = re.sub(pattern, new_section, content, flags=re.DOTALL)
            logger.info("CLAUDE.md: KI-Wissen Abschnitt aktualisiert")
        else:
            content = content.rstrip() + "\n\n" + new_section + "\n"
            logger.info("CLAUDE.md: KI-Wissen Abschnitt hinzugefügt")

        # SICHERHEIT: Validierung - prüfen dass Inhalte nicht geschrumpft sind
        if original_length > 100:
            content_without_marker = re.sub(f"{re.escape(START_MARKER)}.*?{re.escape(END_MARKER)}", "", content, flags=re.DOTALL)
            original_without_marker = re.sub(f"{re.escape(START_MARKER)}.*?{re.escape(END_MARKER)}", "", original_content, flags=re.DOTALL)

            if len(content_without_marker) < len(original_without_marker) * 0.9:
                logger.error("SICHERHEIT: Inhalt außerhalb Marker würde schrumpfen! Abbruch.")
                return False

        # Speichern
        claude_md_path.write_text(content, encoding='utf-8')
        logger.info(f"CLAUDE.md aktualisiert ({len(content)} Zeichen)")
        return True

    except Exception as e:
        logger.error(f"Fehler bei CLAUDE.md: {e}")
        # Bei Fehler: Backup wiederherstellen
        if backup_path.exists():
            try:
                backup_path.rename(claude_md_path)
                logger.info("Backup wiederhergestellt!")
            except:
                pass
        return False


def main():
    parser = argparse.ArgumentParser(description='KI-Wissensdatenbank Updater')
    parser.add_argument('--force', action='store_true', help='Update erzwingen')
    parser.add_argument('--analyze', action='store_true', help='Nur Gap-Analyse')
    parser.add_argument('--add-source', nargs=3, metavar=('NAME', 'URL', 'DISPLAY'))
    args = parser.parse_args()

    logger.info("=" * 40)
    logger.info("KI-Wissensdatenbank Updater")
    logger.info("=" * 40)

    config = load_config()
    log = load_update_log()

    if args.add_source:
        name, url, display = args.add_source
        if add_source(config, name, url, display):
            save_config(config)
        return 0

    if not args.analyze and not is_update_needed(config, log, args.force):
        return 0

    logger.info("\nLade Feeds...")
    entries, counts, health = fetch_all_sources(config)

    logger.info("\nAnalysiere...")
    gaps = analyze_gaps(config, counts, health)
    with open(GAP_ANALYSIS_FILE, 'w', encoding='utf-8') as f:
        json.dump(gaps, f, indent=2, ensure_ascii=False)

    if args.analyze:
        logger.info(f"\nLücken: {len(gaps['low_coverage_topics'])}")
        for t in gaps['low_coverage_topics'][:5]:
            logger.info(f"  - {t['topic']}: {t['count']}")
        return 0

    logger.info("\nSchreibe Wissensdatenbank...")
    content = generate_content(entries, config, gaps)
    with open(KNOWLEDGE_DB_FILE, 'w', encoding='utf-8') as f:
        f.write(content)

    log['last_update'] = datetime.now().isoformat()
    log['updates'].append({
        'date': datetime.now().isoformat(),
        'entries': len(entries)
    })
    log['updates'] = log['updates'][-50:]
    save_update_log(log)

    # CLAUDE.md aktualisieren
    logger.info("\nAktualisiere CLAUDE.md...")
    if update_claude_md():
        logger.info("CLAUDE.md aktualisiert")
    else:
        logger.warning("CLAUDE.md konnte nicht aktualisiert werden")

    logger.info("\n" + "=" * 40)
    logger.info(f"Fertig! {len(entries)} Einträge")
    logger.info("=" * 40)
    return 0


if __name__ == '__main__':
    sys.exit(main())
