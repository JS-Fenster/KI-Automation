#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
ChatGPT o3 ERP-Analyse Tool (Maximum Reasoning)
Sendet den gesamten ERP-Projekt-Kontext in Teilen an o3 mit HIGH reasoning.

Verwendung:
  python erp_analyse.py

Voraussetzungen:
  - OPENAI_API_KEY Umgebungsvariable gesetzt
  - requests Bibliothek (pip install requests)
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import json
import time

try:
    import requests
except ImportError:
    print("FEHLER: requests Bibliothek nicht installiert!")
    print("Bitte ausfuehren: pip install requests")
    sys.exit(1)


# Pfad-Konfiguration
BASE_PATH = Path(r"Z:\IT-Sammlung\KI_Automation_Hub")
JS_PROZESSE = BASE_PATH / "JS_Prozesse"
KI_AUTOMATION = BASE_PATH / "KI_Automation"
ERP_PROJECT = Path(r"C:\Users\Andreas\Desktop\erp-system-vite")

# Dateien die gesammelt werden sollen
CONTEXT_FILES = {
    "analysen": [
        JS_PROZESSE / "analysen" / "Anfrageprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "After-Sales_Analyse.md",
        JS_PROZESSE / "analysen" / "Aufmassprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "BAFA_Foerderantrag_Analyse.md",
        JS_PROZESSE / "analysen" / "Bestellprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Buchhaltungsprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Buergschaftsprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Einkaufsprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Fuhrparkprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Inventarprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Lagerprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Montageprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Personalprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Rechnungsprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Reklamationsprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Reparaturprozess_Analyse.md",
        JS_PROZESSE / "analysen" / "Unterstuetzungsprozesse_Analyse.md",
    ],
    "konzepte": [
        JS_PROZESSE / "W4A_ERSATZ" / "README.md",
        JS_PROZESSE / "W4A_ERSATZ" / "01_ANGEBOT.md",
        JS_PROZESSE / "W4A_ERSATZ" / "02_BESTELLUNG.md",
        JS_PROZESSE / "W4A_ERSATZ" / "03_RECHNUNG.md",
        JS_PROZESSE / "W4A_ERSATZ" / "04_MONTAGE.md",
        JS_PROZESSE / "W4A_ERSATZ" / "05_ANFRAGE_CRM.md",
        JS_PROZESSE / "W4A_ERSATZ" / "06_REPARATUR.md",
        JS_PROZESSE / "W4A_ERSATZ" / "DATENMODELL.md",
        JS_PROZESSE / "W4A_ERSATZ" / "GPS_TRACKING.md",
        JS_PROZESSE / "W4A_ERSATZ" / "KI_ASSISTENT.md",
        JS_PROZESSE / "W4A_ERSATZ" / "PROTOTYP_PLAN.md",
        JS_PROZESSE / "W4A_ERSATZ" / "TECHNISCHE_ARCHITEKTUR.md",
        JS_PROZESSE / "W4A_ERSATZ" / "UI_UX_DESIGN.md",
    ],
    "ideen": [
        JS_PROZESSE / "IDEEN.md",
        JS_PROZESSE / "IDEEN_DETAILS.md",
        JS_PROZESSE / "ARCHITEKTUR.md",
        JS_PROZESSE / "CLAUDE.md",
    ],
    "datenbank": [
        KI_AUTOMATION / "docs" / "ERP_Datenbank.md",
    ],
    "neues_erp": [
        ERP_PROJECT / "prisma" / "schema.prisma",
        ERP_PROJECT / "PLAN.md",
        ERP_PROJECT / "CLAUDE.md",
    ],
}

# Token-Limit pro Anfrage (unter 30k TPM bleiben)
MAX_TOKENS_PER_REQUEST = 20000  # ~80.000 Zeichen (4 Zeichen pro Token)
MAX_CHARS_PER_REQUEST = 80000
WAIT_BETWEEN_REQUESTS = 65  # Sekunden zwischen Anfragen


def read_file(path: Path) -> str:
    """Liest eine Datei und gibt den Inhalt zurueck."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return f"[DATEI NICHT GEFUNDEN: {path}]"
    except Exception as e:
        return f"[FEHLER BEIM LESEN: {path} - {e}]"


def collect_context_by_category() -> dict:
    """Sammelt alle Kontext-Dateien nach Kategorie."""
    context_by_cat = {}

    for category, files in CONTEXT_FILES.items():
        parts = []
        for file_path in files:
            content = read_file(file_path)
            parts.append(f"\n--- DATEI: {file_path.name} ---\n{content}")
        context_by_cat[category] = "\n".join(parts)

    return context_by_cat


def split_into_chunks(context_by_cat: dict) -> list:
    """Teilt den Kontext in Chunks die unter dem Token-Limit bleiben."""
    chunks = []
    current_chunk = ""
    current_categories = []

    for category, content in context_by_cat.items():
        # Wenn dieser Inhalt alleine schon zu gross ist, muss er geteilt werden
        if len(content) > MAX_CHARS_PER_REQUEST:
            # Erst aktuellen Chunk speichern wenn vorhanden
            if current_chunk:
                chunks.append({
                    "categories": current_categories,
                    "content": current_chunk
                })
                current_chunk = ""
                current_categories = []

            # Grossen Inhalt in Teile splitten
            words = content.split('\n')
            part_content = f"# KATEGORIE: {category.upper()} (Teil 1)\n"
            part_num = 1

            for line in words:
                if len(part_content) + len(line) > MAX_CHARS_PER_REQUEST:
                    chunks.append({
                        "categories": [f"{category} (Teil {part_num})"],
                        "content": part_content
                    })
                    part_num += 1
                    part_content = f"# KATEGORIE: {category.upper()} (Teil {part_num})\n"

                part_content += line + "\n"

            if part_content:
                chunks.append({
                    "categories": [f"{category} (Teil {part_num})"],
                    "content": part_content
                })

        # Pruefen ob noch Platz im aktuellen Chunk ist
        elif len(current_chunk) + len(content) > MAX_CHARS_PER_REQUEST:
            # Aktuellen Chunk speichern
            if current_chunk:
                chunks.append({
                    "categories": current_categories,
                    "content": current_chunk
                })

            # Neuen Chunk starten
            current_chunk = f"# KATEGORIE: {category.upper()}\n{content}"
            current_categories = [category]

        else:
            # Zum aktuellen Chunk hinzufuegen
            current_chunk += f"\n\n# KATEGORIE: {category.upper()}\n{content}"
            current_categories.append(category)

    # Letzten Chunk speichern
    if current_chunk:
        chunks.append({
            "categories": current_categories,
            "content": current_chunk
        })

    return chunks


def call_openai(api_key: str, messages: list, is_final: bool = False) -> dict:
    """Ruft die OpenAI API mit o3 und HIGH reasoning auf."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    data = {
        "model": "o3",  # Staerkstes Reasoning-Modell
        "messages": messages,
        "reasoning_effort": "high",  # MAXIMUM REASONING
        "max_completion_tokens": 16000 if is_final else 8000,
    }

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=600  # 10 Minuten Timeout
        )

        if response.status_code != 200:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text}"
            }

        result = response.json()

        return {
            "success": True,
            "content": result["choices"][0]["message"]["content"],
            "model": result.get("model", "o3"),
            "usage": result.get("usage", {})
        }

    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Timeout - Die Anfrage hat zu lange gedauert (>10 Minuten)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def save_response(content: str, context_length: int, total_tokens: int):
    """Speichert die Antwort in einer Datei."""
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = output_dir / f"erp_analyse_{timestamp}.md"

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"# ChatGPT o3 ERP-Analyse (Maximum Reasoning)\n\n")
        f.write(f"**Datum:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"**Model:** o3 mit reasoning_effort: high\n")
        f.write(f"**Kontext:** {context_length:,} Zeichen\n")
        f.write(f"**Tokens verbraucht:** {total_tokens:,}\n")
        f.write("\n---\n\n")
        f.write(content)

    return output_file


def main():
    print("=" * 70)
    print("ChatGPT o3 ERP-Analyse Tool (MAXIMUM REASONING)")
    print("=" * 70)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("\nFEHLER: OPENAI_API_KEY Umgebungsvariable nicht gesetzt!")
        sys.exit(1)

    # 1. Kontext sammeln
    print("\n[1/4] Sammle Kontext-Dateien...")
    context_by_cat = collect_context_by_category()
    total_chars = sum(len(c) for c in context_by_cat.values())
    print(f"      Gesammelt: {total_chars:,} Zeichen in {len(context_by_cat)} Kategorien")

    # 2. In Chunks aufteilen
    print("\n[2/4] Teile Kontext in Chunks auf...")
    chunks = split_into_chunks(context_by_cat)
    print(f"      Erstellt: {len(chunks)} Chunks")
    for i, chunk in enumerate(chunks):
        print(f"        Chunk {i+1}: {len(chunk['content']):,} Zeichen - {', '.join(chunk['categories'])}")

    # 3. Chunks nacheinander an o3 senden
    print(f"\n[3/4] Sende Chunks an o3 (mit {WAIT_BETWEEN_REQUESTS}s Pausen)...")
    print("      Das kann mehrere Minuten dauern...\n")

    chunk_summaries = []
    total_tokens = 0

    for i, chunk in enumerate(chunks):
        print(f"  [{i+1}/{len(chunks)}] Sende Chunk ({', '.join(chunk['categories'])})...")

        messages = [
            {
                "role": "user",
                "content": f"""Du analysierst ein ERP-Projekt fuer eine Fensterbau-Firma.
Dies ist Teil {i+1} von {len(chunks)} des Kontexts.

AUFGABE: Lies diese Dokumentation und extrahiere die WICHTIGSTEN Punkte:
- Was ist der Zweck/Inhalt?
- Welche Prozesse/Features werden beschrieben?
- Welche technischen Details sind relevant?
- Was sind potenzielle Probleme oder Luecken?

Fasse KOMPAKT zusammen (max 500 Worte).

KONTEXT:
{chunk['content']}"""
            }
        ]

        response = call_openai(api_key, messages)

        if not response["success"]:
            print(f"      FEHLER: {response['error']}")
            # Warte und versuche es nochmal
            print(f"      Warte 60 Sekunden und versuche erneut...")
            time.sleep(60)
            response = call_openai(api_key, messages)
            if not response["success"]:
                print(f"      FEHLER ERNEUT: {response['error']}")
                continue

        chunk_summaries.append({
            "categories": chunk["categories"],
            "summary": response["content"]
        })

        usage = response.get("usage", {})
        tokens_used = usage.get("total_tokens", 0)
        total_tokens += tokens_used
        print(f"      OK! ({tokens_used:,} Tokens)")

        # Warte vor der naechsten Anfrage (ausser bei der letzten)
        if i < len(chunks) - 1:
            print(f"      Warte {WAIT_BETWEEN_REQUESTS} Sekunden...")
            time.sleep(WAIT_BETWEEN_REQUESTS)

    # 4. Finale Analyse mit allen Zusammenfassungen
    print(f"\n[4/4] Erstelle finale Analyse mit o3 HIGH reasoning...")

    combined_summaries = "\n\n".join([
        f"## {', '.join(s['categories'])}\n{s['summary']}"
        for s in chunk_summaries
    ])

    final_messages = [
        {
            "role": "user",
            "content": f"""Du bist ein ERP-Experte und Software-Architekt.

Ich habe dir gerade ein komplettes ERP-Projekt fuer eine kleine Fensterbau-Firma (JS Fenster & Tueren) in Teilen gezeigt. Hier sind die Zusammenfassungen aller Teile:

{combined_summaries}

---

JETZT DEINE AUFGABE - Erstelle eine AUSFUEHRLICHE Analyse:

## 1. IST-ANALYSE
- Welche Prozesse wurden analysiert?
- Was ist das geplante Datenmodell?
- Welche Features sind geplant?
- Was ist bereits implementiert?

## 2. ERP BEST PRACTICES
- Wie strukturieren erfolgreiche ERPs fuer kleine Handwerksbetriebe ihre Daten?
- Welche Workflows sind Standard in der Branche?
- Was sind haeufige Fallstricke die vermieden werden sollten?

## 3. BEWERTUNG DES AKTUELLEN PLANS
- Was ist GUT konzipiert?
- Was FEHLT noch?
- Wo gibt es PROBLEME oder INKONSISTENZEN?

## 4. VERBESSERUNGSVORSCHLAEGE
- Konkrete Empfehlungen fuer die naechsten Schritte
- PRIORISIERUNG (was zuerst? was kann warten?)
- Technische Hinweise zur Implementierung

## 5. FEHLENDE INFORMATIONEN
- Welche Infos fehlen dir noch um besser beraten zu koennen?
- Welche Fragen sollte sich der Entwickler stellen?

## 6. ROADMAP-VORSCHLAG
- Schlage eine realistische Reihenfolge der Implementierung vor
- Was ist MVP (Minimum Viable Product)?
- Was kommt in Phase 2, 3, etc.?

WICHTIGE RANDBEDINGUNGEN:
- Kleine Firma (5-10 Mitarbeiter)
- Hauptfokus: Fenster/Tueren Verkauf + Montage + Reparatur
- Aktuelles ERP (Work4All) soll ersetzt werden
- Tech-Stack: Vite + React + TypeScript + Supabase (PostgreSQL)
- KI-Features gewuenscht (Spracheingabe, Bild-Erkennung, etc.)
- Muss von Nicht-Programmierern bedienbar sein

Antworte SEHR AUSFUEHRLICH und STRUKTURIERT. Nutze dein Maximum an Reasoning!"""
        }
    ]

    print("      Sende finale Anfrage (das dauert laenger wegen HIGH reasoning)...")
    final_response = call_openai(api_key, final_messages, is_final=True)

    if not final_response["success"]:
        print(f"\nFEHLER bei finaler Analyse: {final_response['error']}")
        # Speichere zumindest die Zusammenfassungen
        save_response(
            f"# Chunk-Zusammenfassungen\n\n{combined_summaries}\n\n---\n\n# FEHLER BEI FINALER ANALYSE\n{final_response['error']}",
            total_chars,
            total_tokens
        )
        sys.exit(1)

    final_usage = final_response.get("usage", {})
    total_tokens += final_usage.get("total_tokens", 0)

    # 5. Ergebnis speichern
    output_file = save_response(final_response["content"], total_chars, total_tokens)
    print(f"      Gespeichert: {output_file}")

    # 6. Ausgabe
    print("\n" + "=" * 70)
    print("CHATGPT o3 ANALYSE (MAXIMUM REASONING):")
    print("=" * 70 + "\n")
    print(final_response["content"])

    print("\n" + "-" * 70)
    print(f"TOTAL Token-Verbrauch: {total_tokens:,}")
    print(f"Anzahl API-Calls: {len(chunks) + 1}")
    print(f"\n[OK] Vollstaendige Analyse gespeichert in: {output_file}")

    return final_response


if __name__ == "__main__":
    result = main()
