#!/usr/bin/env python3
"""
KI-Wissensdatenbank Updater
===========================
Automatisches Update-Tool für die KI/Automation Wissensdatenbank.
Läuft wöchentlich und aktualisiert KI_Wissensdatenbank.md mit aktuellen Infos.

Features:
- RSS-Feeds aggregieren für aktuelle KI/Automation-News
- Historische Releases (Jan-Dez 2025) im Code enthalten für Portabilität
- Discovery-Mode erkennt neue Tools am Markt
- Gap-Analyse zeigt Wissenslücken auf

SCHREIBREGELN fuer KI_Wissen.md (Token-Effizienz!):
- Verdichtet & praegnant: Nur Kern-Infos, keine langen Beschreibungen
- Token-effizient: Ganzen Inhalt verstehen, aber minimal formulieren
- Use-Cases nennen: Nicht nur "Tool X existiert" sondern "Tool X fuer Y nuetzlich"
- Kategorien/Tags: Bei Tools immer Einsatzgebiet angeben (automation, browser, api-alternative, etc.)

Verwendung:
    python ki_wissen_updater.py              # Normaler Lauf (prüft Intervall)
    python ki_wissen_updater.py --force      # Update erzwingen
    python ki_wissen_updater.py --check-only # Nur prüfen, kein Update
    python ki_wissen_updater.py --analyze    # Gap-Analyse für Claude
    python ki_wissen_updater.py --catchup    # Historische Releases einmalig holen
    python ki_wissen_updater.py --discover   # Neue Tools am Markt erkennen
"""
from __future__ import annotations

import os
import sys
import json
import yaml
import logging
import argparse
import feedparser
import requests
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from collections import Counter

# Füge lib-Ordner zum Pfad hinzu (tools/KI_Wissen -> tools -> KI_Automation)
LIB_PATH = Path(__file__).resolve().parent.parent.parent / 'lib'
sys.path.insert(0, str(LIB_PATH.parent))
try:
    from lib.claude_md_helper import update_claude_md_section, sync_ideen_count_to_claude_md
except ImportError:
    # Fallback: Direkter Import
    import importlib.util
    spec = importlib.util.spec_from_file_location("claude_md_helper", LIB_PATH / "claude_md_helper.py")
    claude_md_helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(claude_md_helper)
    update_claude_md_section = claude_md_helper.update_claude_md_section
    sync_ideen_count_to_claude_md = claude_md_helper.sync_ideen_count_to_claude_md

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(Path(__file__).parent / 'updater.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Pfade (mit resolve() für absolute Pfade)
SCRIPT_DIR = Path(__file__).resolve().parent
CONFIG_FILE = SCRIPT_DIR / 'config.yaml'
UPDATE_LOG_FILE = SCRIPT_DIR / 'update_log.json'
GAP_ANALYSIS_FILE = SCRIPT_DIR / 'source_gaps.json'
# Relativ zum Script: tools/KI_Wissen -> tools -> KI-Automation -> Arbeit -> JS-Prozesse
IDEEN_FILE = SCRIPT_DIR.parent.parent.parent / 'JS-Prozesse' / 'IDEEN.md'

# =============================================================================
# HISTORICAL_RELEASES - Wichtige Releases seit Jan 2025 (portabel im Code)
# =============================================================================
# Diese Daten sind fest im Code, damit auf neuen PCs sofort alle
# historischen Informationen verfügbar sind ohne externe Dateien.
# Aktualisiert: 2025-12-10
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
# KNOWN_TOOLS - Für Discovery Mode (erkennt neue Player am Markt)
# =============================================================================
KNOWN_TOOLS = {
    # LLM Providers
    "claude", "anthropic", "gpt", "openai", "gemini", "google ai",
    "llama", "meta ai", "mistral", "cohere", "ai21",
    # Coding Tools
    "cursor", "copilot", "windsurf", "codeium", "replit", "bolt",
    "v0", "vercel ai", "tabnine", "cody",
    # Bild-KI
    "midjourney", "dall-e", "stable diffusion", "flux", "imagen",
    "leonardo", "ideogram", "firefly",
    # Audio
    "elevenlabs", "whisper", "play.ht", "murf", "resemble",
    # Automation
    "n8n", "zapier", "make", "power automate",
    # RAG/Agents
    "langchain", "llamaindex", "haystack", "autogen",
    # Search
    "perplexity", "you.com", "phind",
}


def load_config() -> Dict[str, Any]:
    """Lädt die Konfiguration aus config.yaml"""
    if not CONFIG_FILE.exists():
        logger.error(f"Config-Datei nicht gefunden: {CONFIG_FILE}")
        sys.exit(1)

    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def save_config(config: Dict[str, Any]) -> None:
    """Speichert die Konfiguration in config.yaml"""
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
    logger.info(f"Config gespeichert: {CONFIG_FILE}")


def load_update_log() -> Dict[str, Any]:
    """Lädt das Update-Log oder erstellt ein leeres"""
    if UPDATE_LOG_FILE.exists():
        with open(UPDATE_LOG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"updates": [], "last_update": None, "topic_coverage": {}, "source_health": {}}


def save_update_log(log: Dict[str, Any]) -> None:
    """Speichert das Update-Log"""
    with open(UPDATE_LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2, ensure_ascii=False, default=str)


def extract_topics_from_ideen() -> List[str]:
    """Extrahiert relevante Themen aus IDEEN.md"""
    additional_topics = []

    if IDEEN_FILE.exists():
        try:
            with open(IDEEN_FILE, 'r', encoding='utf-8') as f:
                content = f.read().lower()

            # Suche nach technischen Begriffen in IDEEN.md
            tech_patterns = [
                r'\b(pdf|ocr|vision|api|sql|excel|automation)\b',
                r'\b(whisper|speech|transcription)\b',
                r'\b(n8n|langchain|rag|agent)\b',
                r'\b(claude|anthropic|openai|gemini)\b',
                r'\b(mcp|protocol|integration)\b',
            ]

            for pattern in tech_patterns:
                matches = re.findall(pattern, content)
                additional_topics.extend(matches)

            # Deduplizieren
            additional_topics = list(set(additional_topics))
            logger.info(f"Aus IDEEN.md extrahiert: {len(additional_topics)} zusätzliche Themen")
        except Exception as e:
            logger.warning(f"Konnte IDEEN.md nicht lesen: {e}")

    return additional_topics


def is_update_needed(config: Dict, log: Dict, force: bool = False) -> bool:
    """Prüft ob ein Update nötig ist basierend auf dem Intervall"""
    if force:
        logger.info("Update erzwungen (--force)")
        return True

    if not log.get("last_update"):
        logger.info("Noch kein Update durchgeführt - initialer Lauf")
        return True

    last_update = datetime.fromisoformat(log["last_update"])
    interval_days = config.get("update_interval_days", 7)
    next_update = last_update + timedelta(days=interval_days)

    if datetime.now() >= next_update:
        logger.info(f"Update fällig (letztes Update: {last_update.strftime('%Y-%m-%d')})")
        return True

    days_until = (next_update - datetime.now()).days
    logger.info(f"Kein Update nötig. Nächstes Update in {days_until} Tagen ({next_update.strftime('%Y-%m-%d')})")
    return False


def fetch_rss_feed(source: Dict) -> tuple[List[Dict], bool]:
    """Holt Einträge von einem RSS Feed. Gibt (entries, success) zurück."""
    entries = []
    success = True
    try:
        logger.info(f"Lade Feed: {source['name']}")
        feed = feedparser.parse(source['url'], request_headers={'User-Agent': 'Mozilla/5.0'})

        if feed.bozo and feed.bozo_exception:
            logger.warning(f"Feed-Fehler bei {source['name']}: {feed.bozo_exception}")
            success = False

        for entry in feed.entries[:10]:  # Maximal 10 Einträge pro Feed
            entries.append({
                'title': entry.get('title', 'Kein Titel'),
                'link': entry.get('link', ''),
                'published': entry.get('published', entry.get('updated', '')),
                'summary': entry.get('summary', entry.get('description', ''))[:500],
                'source': source['name']
            })

        if entries:
            success = True  # Wenn Einträge gefunden, ist der Feed OK

        logger.info(f"  - {len(entries)} Eintraege gefunden")
    except Exception as e:
        logger.error(f"Fehler beim Laden von {source['name']}: {e}")
        success = False

    return entries, success


def filter_relevant_entries(entries: List[Dict], topics: List[str]) -> tuple[List[Dict], Counter]:
    """Filtert Einträge nach relevanten Themen. Gibt (entries, topic_counts) zurück."""
    relevant = []
    topics_lower = [t.lower() for t in topics]
    topic_counts = Counter()

    for entry in entries:
        text = f"{entry['title']} {entry['summary']}".lower()

        # Prüfe ob mindestens ein Topic vorkommt
        matching_topics = [t for t in topics_lower if t in text]
        if matching_topics:
            entry['matching_topics'] = matching_topics
            relevant.append(entry)
            for topic in matching_topics:
                topic_counts[topic] += 1

    logger.info(f"Relevante Einträge: {len(relevant)} von {len(entries)}")
    return relevant, topic_counts


def fetch_all_sources(config: Dict) -> tuple[List[Dict], Counter, Dict[str, bool]]:
    """Holt alle Feeds und filtert nach Relevanz"""
    all_entries = []
    sources = config.get('sources', {})
    topics = config.get('relevant_topics', [])

    # Zusätzliche Themen aus IDEEN.md
    ideen_topics = extract_topics_from_ideen()
    all_topics = list(set(topics + ideen_topics))

    source_health = {}

    # Nach Priorität sortieren
    sorted_sources = sorted(
        [(name, src) for name, src in sources.items()],
        key=lambda x: x[1].get('priority', 99)
    )

    for name, source in sorted_sources:
        if source.get('type') == 'rss':
            entries, success = fetch_rss_feed(source)
            all_entries.extend(entries)
            source_health[name] = success

    # Filtern nach relevanten Themen
    relevant, topic_counts = filter_relevant_entries(all_entries, all_topics)

    return relevant, topic_counts, source_health


def analyze_gaps(config: Dict, topic_counts: Counter, source_health: Dict[str, bool]) -> Dict:
    """Analysiert Wissenslücken und schlägt Verbesserungen vor"""
    topics = config.get('relevant_topics', [])

    # Topics ohne oder mit wenig Coverage
    low_coverage_topics = []
    for topic in topics:
        count = topic_counts.get(topic.lower(), 0)
        if count < 2:  # Weniger als 2 Treffer = geringe Abdeckung
            low_coverage_topics.append({
                'topic': topic,
                'count': count,
                'search_suggestion': f"{topic} RSS feed blog 2025"
            })

    # Kaputte Quellen
    broken_sources = [name for name, healthy in source_health.items() if not healthy]

    # Top-Topics (gut abgedeckt)
    well_covered = topic_counts.most_common(10)

    gap_analysis = {
        'analyzed_at': datetime.now().isoformat(),
        'total_topics': len(topics),
        'low_coverage_topics': low_coverage_topics,
        'broken_sources': broken_sources,
        'well_covered_topics': [{'topic': t, 'count': c} for t, c in well_covered],
        'recommendations': []
    }

    # Empfehlungen generieren
    if low_coverage_topics:
        gap_analysis['recommendations'].append({
            'type': 'search_new_sources',
            'message': f"{len(low_coverage_topics)} Topics haben geringe Abdeckung",
            'action': 'Claude sollte nach neuen RSS-Feeds für diese Topics suchen',
            'topics': [t['topic'] for t in low_coverage_topics[:5]]
        })

    if broken_sources:
        gap_analysis['recommendations'].append({
            'type': 'fix_broken_sources',
            'message': f"{len(broken_sources)} Quellen haben Fehler",
            'action': 'URLs prüfen oder alternative Feeds suchen',
            'sources': broken_sources
        })

    return gap_analysis


def save_gap_analysis(analysis: Dict) -> None:
    """Speichert die Gap-Analyse für Claude"""
    with open(GAP_ANALYSIS_FILE, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    logger.info(f"Gap-Analyse gespeichert: {GAP_ANALYSIS_FILE}")


def validate_rss_url(url: str) -> bool:
    """Prüft ob eine URL ein gültiger RSS-Feed ist"""
    try:
        feed = feedparser.parse(url, request_headers={'User-Agent': 'Mozilla/5.0'})
        return len(feed.entries) > 0 and not feed.bozo
    except:
        return False


def is_catchup_needed(log: Dict) -> bool:
    """Prüft ob Catch-Up noch nie gelaufen ist"""
    return not log.get("catchup_completed", False)


def generate_historical_content() -> str:
    """Generiert Markdown-Content aus HISTORICAL_RELEASES"""
    content = "## Wichtige Releases 2025\n\n"
    content += "> Historische Entwicklungen seit Januar 2025 (fest im Code für Portabilität)\n\n"

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


def discover_new_tools(entries: List[Dict]) -> List[Dict]:
    """
    Analysiert RSS-Einträge auf Erwähnungen neuer Tools.
    Gibt Liste von potenziell neuen Tools zurück die nicht in KNOWN_TOOLS sind.
    """
    # Patterns für Tool-Namen in News (z.B. "announces X", "launches Y", "introduces Z")
    tool_patterns = [
        r'(?:announces?|launches?|introduces?|unveils?|releases?)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)',
        r'([A-Z][a-zA-Z0-9]+)\s+(?:AI|IDE|agent|assistant|model)\b',
        r'new\s+(?:AI\s+)?tool\s+(?:called\s+)?([A-Z][a-zA-Z0-9]+)',
    ]

    # Erweiterte Blocklist für generische Begriffe
    blocked_words = {
        # Artikel/Pronomen
        'the', 'new', 'our', 'your', 'this', 'that', 'its', 'their',
        # Adjektive
        'first', 'best', 'top', 'free', 'pro', 'open', 'next', 'latest',
        'large', 'small', 'fast', 'deep', 'multi', 'new',
        # Generische Tech-Begriffe
        'type', 'language', 'model', 'models', 'data', 'code', 'coding',
        'machine', 'learning', 'neural', 'network', 'generative',
        'enterprise', 'cloud', 'server', 'api', 'sdk', 'framework',
        'using', 'for', 'with', 'and', 'how', 'what', 'why',
        # Verben/Aktionen
        'introducing', 'announcing', 'launching', 'building', 'creating',
        # Andere
        'stability', 'amazon', 'google', 'microsoft', 'meta', 'apple',
        'research', 'paper', 'blog', 'post', 'article', 'update',
    }

    potential_tools = Counter()

    for entry in entries:
        text = f"{entry['title']} {entry.get('summary', '')}"

        for pattern in tool_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                tool_name = match.strip().lower()
                # Filter: Mindestens 4 Zeichen, nicht in known_tools, nicht geblockt
                if (len(tool_name) >= 4 and
                    tool_name not in KNOWN_TOOLS and
                    tool_name not in blocked_words):
                    potential_tools[tool_name] += 1

    # Nur Tools mit >= 3 Erwähnungen (um Rauschen zu filtern)
    discovered = []
    for tool, count in potential_tools.most_common(10):
        if count >= 3:
            discovered.append({
                'name': tool.title(),
                'mentions': count,
                'first_seen': datetime.now().strftime('%Y-%m-%d'),
                'suggested_action': 'RSS-Feed suchen und hinzufuegen',
            })

    return discovered


def run_discovery_mode(config: Dict) -> Dict:
    """Führt Discovery-Mode aus: sucht nach neuen Tools am Markt"""
    logger.info("\n" + "=" * 50)
    logger.info("DISCOVERY MODE - Suche nach neuen Tools")
    logger.info("=" * 50)

    # Alle Feeds abrufen (unfiltered)
    all_entries = []
    sources = config.get('sources', {})

    for name, source in sources.items():
        if source.get('type') == 'rss':
            entries, _ = fetch_rss_feed(source)
            all_entries.extend(entries)

    logger.info(f"Analysiere {len(all_entries)} Einträge auf neue Tools...")

    # Neue Tools entdecken
    discovered = discover_new_tools(all_entries)

    # Gap-Analyse laden und erweitern
    gap_analysis = {}
    if GAP_ANALYSIS_FILE.exists():
        with open(GAP_ANALYSIS_FILE, 'r', encoding='utf-8') as f:
            gap_analysis = json.load(f)

    gap_analysis['new_tools_discovered'] = discovered
    gap_analysis['discovery_run'] = datetime.now().isoformat()

    if discovered:
        logger.info(f"\n{len(discovered)} potentiell neue Tools entdeckt:")
        for tool in discovered:
            logger.info(f"  - {tool['name']}: {tool['mentions']}x erwähnt")

        gap_analysis['recommendations'].append({
            'type': 'new_tools_discovered',
            'message': f"{len(discovered)} neue Tools am Markt entdeckt",
            'action': 'Claude sollte prüfen ob diese Tools relevant sind',
            'tools': [t['name'] for t in discovered]
        })
    else:
        logger.info("\nKeine neuen Tools entdeckt (oder alle bereits bekannt)")

    # Speichern
    save_gap_analysis(gap_analysis)

    return gap_analysis


def run_catchup_mode(config: Dict, log: Dict) -> bool:
    """
    Führt einmalige Catch-Up aus: fügt historische Releases zur Wissensdatenbank.
    Wird nur einmal ausgeführt (markiert in update_log.json).
    """
    logger.info("\n" + "=" * 50)
    logger.info("CATCH-UP MODE - Historische Releases hinzufügen")
    logger.info("=" * 50)

    kb_path = Path(config['paths']['knowledge_db'])

    # Wissensdatenbank einlesen (falls vorhanden)
    existing_content = ""
    if kb_path.exists():
        with open(kb_path, 'r', encoding='utf-8') as f:
            existing_content = f.read()

    # Historische Sektion generieren
    historical_content = generate_historical_content()

    # Prüfen ob historische Sektion schon existiert
    if "## Wichtige Releases 2025" in existing_content:
        logger.info("Historische Sektion existiert bereits - überspringe")
        log['catchup_completed'] = True
        save_update_log(log)
        return True

    # Einfügen nach dem ersten "---" (nach Header)
    if "---" in existing_content:
        parts = existing_content.split("---", 2)
        if len(parts) >= 3:
            new_content = parts[0] + "---\n\n" + historical_content + "\n---" + parts[2]
        else:
            new_content = existing_content + "\n\n" + historical_content
    else:
        new_content = existing_content + "\n\n" + historical_content

    # Speichern
    try:
        with open(kb_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        logger.info(f"Historische Releases hinzugefügt zu: {kb_path}")

        # Markieren als abgeschlossen
        log['catchup_completed'] = True
        log['catchup_date'] = datetime.now().isoformat()
        save_update_log(log)

        # Statistik ausgeben
        total_releases = sum(len(releases) for releases in HISTORICAL_RELEASES.values())
        logger.info(f"{total_releases} historische Releases in {len(HISTORICAL_RELEASES)} Kategorien hinzugefuegt")

        return True
    except Exception as e:
        logger.error(f"Fehler beim Speichern: {e}")
        return False


def add_source_to_config(config: Dict, name: str, url: str, display_name: str, priority: int = 3) -> bool:
    """Fügt eine neue Quelle zur Config hinzu nach Validierung"""
    if name in config.get('sources', {}):
        logger.warning(f"Quelle '{name}' existiert bereits")
        return False

    if not validate_rss_url(url):
        logger.warning(f"URL ist kein gültiger RSS-Feed: {url}")
        return False

    if 'sources' not in config:
        config['sources'] = {}

    config['sources'][name] = {
        'name': display_name,
        'type': 'rss',
        'url': url,
        'priority': priority,
        'added': datetime.now().strftime('%Y-%m-%d')
    }

    logger.info(f"Neue Quelle hinzugefügt: {display_name}")
    return True


def deduplicate_entries(entries: List[Dict]) -> List[Dict]:
    """Entfernt Duplikate basierend auf ähnlichen Titeln"""
    seen_titles = set()
    unique = []

    for entry in entries:
        # Normalisiere Titel für Vergleich
        title_normalized = entry['title'].lower()
        # Entferne häufige Wörter für besseren Match
        for word in ['the', 'a', 'an', 'is', 'are', 'and', 'or', 'to', 'for']:
            title_normalized = title_normalized.replace(f' {word} ', ' ')

        # Prüfe auf sehr ähnliche Titel (erste 40 Zeichen)
        title_key = title_normalized[:40]

        if title_key not in seen_titles:
            seen_titles.add(title_key)
            unique.append(entry)

    return unique


def is_useful_summary(summary: str) -> bool:
    """Prüft ob eine Zusammenfassung nützlich ist"""
    if not summary or len(summary) < 50:
        return False
    # Nutzlose Patterns
    useless_patterns = [
        'mp4 showing', 'image with', 'let\'s get started',
        'arXiv:', 'announce type:', 'abstract:'
    ]
    summary_lower = summary.lower()
    return not any(p in summary_lower for p in useless_patterns)


def generate_knowledge_content(entries: List[Dict], config: Dict, gap_analysis: Dict = None, include_historical: bool = True) -> str:
    """Generiert den Markdown-Inhalt für die Wissensdatenbank (VERDICHTET)"""
    now = datetime.now()
    next_update = now + timedelta(days=config.get('update_interval_days', 7))

    # Deduplizieren
    entries = deduplicate_entries(entries)

    # Priorisiere nach Relevanz (mehr matching_topics = wichtiger)
    entries = sorted(entries, key=lambda x: len(x.get('matching_topics', [])), reverse=True)

    content = f"""# KI & Automation Wissensdatenbank

> Aktualisiert: {now.strftime('%Y-%m-%d')} | Naechstes Update: {next_update.strftime('%Y-%m-%d')} | {len(entries)} Eintraege

---

"""
    # Historische Releases immer inkludieren
    if include_historical:
        content += generate_historical_content()
        content += "---\n\n"

    content += """## Top-News (Highlights)

"""

    # Top 10 wichtigste Einträge (nach Anzahl matching topics)
    top_entries = entries[:10]
    for entry in top_entries:
        topics_str = ", ".join(entry.get('matching_topics', []))
        content += f"- **[{entry['title']}]({entry['link']})** ({entry['source']}) `{topics_str}`\n"

    content += "\n---\n\n## Nach Quelle\n\n"

    # Gruppiere nach Quelle - nur 3 pro Quelle
    by_source = {}
    for entry in entries:
        source = entry['source']
        if source not in by_source:
            by_source[source] = []
        by_source[source].append(entry)

    # Sortiere Quellen nach Priorität (weniger arXiv)
    priority_sources = ['LangChain Blog', 'n8n Blog', 'TechCrunch AI', 'The Verge AI',
                        'AWS Machine Learning', 'OpenAI Blog', 'Google AI Blog',
                        'Hugging Face Blog', 'AI News', 'InfoQ AI/ML']

    for source in priority_sources:
        if source in by_source:
            source_entries = by_source[source][:3]  # Max 3 pro Quelle
            content += f"### {source}\n"
            for entry in source_entries:
                summary = entry.get('summary', '')
                summary = re.sub('<[^<]+?>', '', summary)
                # Nur nützliche Summaries
                if is_useful_summary(summary):
                    summary = summary[:100] + '...' if len(summary) > 100 else summary
                    content += f"- [{entry['title']}]({entry['link']}): {summary}\n"
                else:
                    content += f"- [{entry['title']}]({entry['link']})\n"
            content += "\n"

    # Gap-Analyse (kurz)
    if gap_analysis and gap_analysis.get('low_coverage_topics'):
        low_topics = [t['topic'] for t in gap_analysis['low_coverage_topics'][:5]]
        content += f"\n---\n\n**Wissenslücken:** {', '.join(low_topics)}\n"

    # Kompakte Referenz
    content += """
---

## Schnellreferenz

| Tool | Zweck |
|------|-------|
| **Claude Opus 4.5** | Flaggschiff-LLM (aktuell) |
| **Claude Code** | CLI für Entwicklung |
| **MCP** | Tool-Integrationen (filesystem, postgres, puppeteer) |
| **n8n** | Workflow-Automation (Self-hosted) |
| **LangChain** | RAG, Agents, Chains |
| **Whisper** | Speech-to-Text |

"""

    content += f"*Letztes Update: {now.strftime('%Y-%m-%d')}*\n"

    return content


def update_knowledge_db(config: Dict, entries: List[Dict], gap_analysis: Dict = None) -> bool:
    """Aktualisiert die Wissensdatenbank-Datei"""
    kb_path = Path(config['paths']['knowledge_db'])

    # Verzeichnis erstellen falls nicht vorhanden
    kb_path.parent.mkdir(parents=True, exist_ok=True)

    # Inhalt generieren
    content = generate_knowledge_content(entries, config, gap_analysis)

    # Datei schreiben
    try:
        with open(kb_path, 'w', encoding='utf-8') as f:
            f.write(content)
        logger.info(f"Wissensdatenbank aktualisiert: {kb_path}")
        return True
    except Exception as e:
        logger.error(f"Fehler beim Schreiben der Wissensdatenbank: {e}")
        return False


def update_claude_md(config: Dict) -> bool:
    """Aktualisiert CLAUDE.md mit Hinweis auf die Wissensdatenbank.

    Nutzt den zentralen claude_md_helper für sichere Marker-basierte Updates.
    """
    # CLAUDE.md Pfad (zwei Ebenen nach oben: tools/KI_Wissen -> tools -> root)
    claude_md_path = SCRIPT_DIR.parent.parent / 'CLAUDE.md'
    kb_path = Path(config['paths']['knowledge_db'])

    # Relativer Pfad zur Wissensdatenbank (POSIX-Format fuer Regex-Kompatibilitaet)
    try:
        rel_path = kb_path.relative_to(claude_md_path.parent)
    except ValueError:
        rel_path = kb_path
    # Windows-Backslashes vermeiden (sonst Regex-Fehler: "bad escape \K")
    rel_path_str = rel_path.as_posix() if hasattr(rel_path, 'as_posix') else str(rel_path).replace('\\', '/')

    # Inhalt für den Abschnitt
    content = f"""> **Aktualisiert:** {datetime.now().strftime('%Y-%m-%d %H:%M')}
>
> **IMMER einlesen:** `{rel_path_str}`
>
> Enthält aktuelle KI/Automation-News und Tools. Wird wöchentlich automatisch aktualisiert."""

    # Nutze den zentralen Helper für sichere Updates
    return update_claude_md_section(
        claude_md_path=claude_md_path,
        tool_name="KI-WISSEN",
        new_content=content,
        section_title="## KI-Wissen (Auto-generiert)"
    )


def main():
    parser = argparse.ArgumentParser(
        description='KI-Wissensdatenbank Updater',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Beispiele:
  python ki_wissen_updater.py                    # Normaler Lauf
  python ki_wissen_updater.py --force            # Update erzwingen
  python ki_wissen_updater.py --catchup          # Historische Releases hinzufügen
  python ki_wissen_updater.py --catchup --force  # Historische Releases + RSS Update
  python ki_wissen_updater.py --discover         # Neue Tools am Markt erkennen
  python ki_wissen_updater.py --analyze          # Wissenslücken analysieren
        """
    )
    parser.add_argument('--force', action='store_true', help='Update erzwingen')
    parser.add_argument('--check-only', action='store_true', help='Nur prüfen, kein Update')
    parser.add_argument('--analyze', action='store_true', help='Gap-Analyse durchführen')
    parser.add_argument('--catchup', action='store_true',
                        help='Historische Releases (2025) zur Wissensdatenbank hinzufügen')
    parser.add_argument('--discover', action='store_true',
                        help='Neue Tools am Markt erkennen (analysiert RSS auf unbekannte Namen)')
    parser.add_argument('--add-source', nargs=3, metavar=('NAME', 'URL', 'DISPLAY_NAME'),
                        help='Neue Quelle hinzufügen: --add-source key url "Display Name"')
    args = parser.parse_args()

    logger.info("=" * 50)
    logger.info("KI-Wissensdatenbank Updater gestartet")
    logger.info("=" * 50)

    # Konfiguration laden
    config = load_config()
    log = load_update_log()

    # Neue Quelle hinzufügen
    if args.add_source:
        name, url, display_name = args.add_source
        if add_source_to_config(config, name, url, display_name):
            save_config(config)
            logger.info(f"Quelle '{display_name}' erfolgreich hinzugefügt!")
        return 0

    # Discovery Mode
    if args.discover:
        run_discovery_mode(config)
        return 0

    # Catch-Up Mode (historische Releases)
    if args.catchup:
        success = run_catchup_mode(config, log)
        if not args.force:
            # Nur Catchup, kein RSS-Update
            return 0 if success else 1
        # Mit --force: nach Catchup auch RSS-Update durchführen

    # Prüfen ob Update nötig
    if not args.analyze and not is_update_needed(config, log, args.force):
        if args.check_only:
            logger.info("Check abgeschlossen - kein Update nötig")
        return 0

    if args.check_only:
        logger.info("Update wäre fällig (--check-only aktiv, kein Update)")
        return 0

    # Feeds abrufen
    logger.info("\nStarte Feed-Abruf...")
    entries, topic_counts, source_health = fetch_all_sources(config)

    if not entries:
        logger.warning("Keine relevanten Einträge gefunden")

    # Gap-Analyse
    logger.info("\nAnalysiere Wissenslücken...")
    gap_analysis = analyze_gaps(config, topic_counts, source_health)
    save_gap_analysis(gap_analysis)

    # Nur Analyse-Modus
    if args.analyze:
        logger.info("\n" + "=" * 50)
        logger.info("GAP-ANALYSE ERGEBNIS")
        logger.info("=" * 50)
        logger.info(f"Topics mit geringer Abdeckung: {len(gap_analysis['low_coverage_topics'])}")
        for item in gap_analysis['low_coverage_topics'][:5]:
            logger.info(f"  - {item['topic']}: {item['count']} Treffer")
        logger.info(f"Kaputte Quellen: {len(gap_analysis['broken_sources'])}")
        for src in gap_analysis['broken_sources']:
            logger.info(f"  - {src}")
        logger.info(f"\nDetails in: {GAP_ANALYSIS_FILE}")
        return 0

    # Wissensdatenbank aktualisieren
    logger.info("\nAktualisiere Wissensdatenbank...")
    success = update_knowledge_db(config, entries, gap_analysis)

    if success:
        # Update-Log aktualisieren
        log['last_update'] = datetime.now().isoformat()
        log['topic_coverage'] = dict(topic_counts)
        log['source_health'] = source_health
        log['updates'].append({
            'date': datetime.now().isoformat(),
            'entries_found': len(entries),
            'sources_checked': len(config.get('sources', {})),
            'low_coverage_topics': len(gap_analysis['low_coverage_topics']),
            'broken_sources': len(gap_analysis['broken_sources'])
        })
        # Nur die letzten 50 Updates behalten
        log['updates'] = log['updates'][-50:]
        save_update_log(log)

        # CLAUDE.md aktualisieren (mit Hinweis auf Wissensdatenbank)
        logger.info("\nAktualisiere CLAUDE.md...")
        if update_claude_md(config):
            logger.info("CLAUDE.md erfolgreich aktualisiert")
        else:
            logger.warning("CLAUDE.md konnte nicht aktualisiert werden (Wissensdatenbank trotzdem OK)")

        # IDEEN-Zaehler synchronisieren
        logger.info("\nSynchronisiere IDEEN-Zaehler...")
        claude_md_path = SCRIPT_DIR.parent.parent / 'CLAUDE.md'
        sync_ideen_count_to_claude_md(claude_md_path, IDEEN_FILE)

        logger.info("\n" + "=" * 50)
        logger.info("Update erfolgreich abgeschlossen!")
        logger.info(f"Gefundene relevante Einträge: {len(entries)}")
        logger.info(f"Topics mit geringer Abdeckung: {len(gap_analysis['low_coverage_topics'])}")
        logger.info("=" * 50)
        return 0
    else:
        logger.error("Update fehlgeschlagen!")
        return 1


if __name__ == '__main__':
    sys.exit(main())
