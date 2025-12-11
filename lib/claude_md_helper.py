#!/usr/bin/env python3
"""
CLAUDE.md Helper - Sichere Bearbeitung von CLAUDE.md Dateien
=============================================================

Dieses Modul bietet sichere Funktionen zur Bearbeitung von CLAUDE.md Dateien
mit einem Marker-basierten Schutzsystem.

Jedes Tool das CLAUDE.md ändert, verwendet eigene Marker und darf NUR
seinen Bereich ändern. Alles außerhalb der Marker bleibt unberührt.

Beispiel-Struktur in CLAUDE.md:
```markdown
# Projektanweisungen
(manueller Inhalt - wird NIE geändert)

<!-- KI-WISSEN-START -->
## KI-Wissen (Auto-generiert)
...
<!-- KI-WISSEN-END -->

<!-- PREISLISTEN-TOOL-START -->
## Preislisten (Auto-generiert)
...
<!-- PREISLISTEN-TOOL-END -->
```

Verwendung:
    from lib.claude_md_helper import update_claude_md_section

    success = update_claude_md_section(
        claude_md_path=Path("CLAUDE.md"),
        tool_name="KI-WISSEN",
        new_content="Neuer Inhalt hier",
        section_title="## KI-Wissen (Auto-generiert)"
    )
"""
from __future__ import annotations

import re
import logging
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Tuple

logger = logging.getLogger(__name__)


class ClaudeMdProtector:
    """
    Klasse zur sicheren Verwaltung von CLAUDE.md mit Marker-basiertem Schutz.

    Features:
    - Automatische Backups mit Versionierung
    - Marker-basierte Abschnittsverwaltung
    - Validierung vor dem Speichern
    - Automatische Wiederherstellung bei Fehlern
    """

    MAX_BACKUPS = 10  # Maximale Anzahl Backup-Dateien

    def __init__(self, claude_md_path: Path):
        """
        Initialisiert den Protector für eine CLAUDE.md Datei.

        Args:
            claude_md_path: Pfad zur CLAUDE.md Datei
        """
        self.claude_md_path = Path(claude_md_path)
        self.backup_dir = self.claude_md_path.parent / '.claude_md_backups'

    def _get_markers(self, tool_name: str) -> Tuple[str, str]:
        """Generiert die Marker für ein Tool."""
        return (
            f"<!-- {tool_name}-START -->",
            f"<!-- {tool_name}-END -->"
        )

    def _create_backup(self) -> Optional[Path]:
        """
        Erstellt ein Backup der aktuellen CLAUDE.md.

        Returns:
            Pfad zum Backup oder None bei Fehler
        """
        if not self.claude_md_path.exists():
            return None

        try:
            # Backup-Verzeichnis erstellen
            self.backup_dir.mkdir(exist_ok=True)

            # Backup mit Timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_path = self.backup_dir / f'CLAUDE.md.{timestamp}.bak'

            shutil.copy2(self.claude_md_path, backup_path)
            logger.info(f"Backup erstellt: {backup_path}")

            # Alte Backups aufräumen
            self._cleanup_old_backups()

            return backup_path
        except Exception as e:
            logger.error(f"Fehler beim Backup erstellen: {e}")
            return None

    def _cleanup_old_backups(self):
        """Entfernt alte Backups, behält nur die neuesten."""
        if not self.backup_dir.exists():
            return

        backups = sorted(
            self.backup_dir.glob('CLAUDE.md.*.bak'),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        # Lösche alle außer den neuesten MAX_BACKUPS
        for old_backup in backups[self.MAX_BACKUPS:]:
            try:
                old_backup.unlink()
                logger.debug(f"Altes Backup gelöscht: {old_backup}")
            except Exception as e:
                logger.warning(f"Konnte Backup nicht löschen: {e}")

    def get_latest_backup(self) -> Optional[Path]:
        """Gibt das neueste Backup zurück."""
        if not self.backup_dir.exists():
            return None

        backups = sorted(
            self.backup_dir.glob('CLAUDE.md.*.bak'),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        return backups[0] if backups else None

    def restore_from_backup(self, backup_path: Optional[Path] = None) -> bool:
        """
        Stellt CLAUDE.md aus einem Backup wieder her.

        Args:
            backup_path: Spezifisches Backup (oder None für neuestes)

        Returns:
            True bei Erfolg
        """
        if backup_path is None:
            backup_path = self.get_latest_backup()

        if backup_path is None or not backup_path.exists():
            logger.error("Kein Backup zum Wiederherstellen gefunden")
            return False

        try:
            shutil.copy2(backup_path, self.claude_md_path)
            logger.info(f"CLAUDE.md wiederhergestellt aus: {backup_path}")
            return True
        except Exception as e:
            logger.error(f"Fehler bei Wiederherstellung: {e}")
            return False

    def get_section(self, tool_name: str) -> Optional[str]:
        """
        Liest den Inhalt eines Tool-Abschnitts.

        Args:
            tool_name: Name des Tools (z.B. "KI-WISSEN")

        Returns:
            Inhalt zwischen den Markern oder None
        """
        if not self.claude_md_path.exists():
            return None

        start_marker, end_marker = self._get_markers(tool_name)
        content = self.claude_md_path.read_text(encoding='utf-8')

        pattern = f"{re.escape(start_marker)}(.*?){re.escape(end_marker)}"
        match = re.search(pattern, content, re.DOTALL)

        return match.group(1).strip() if match else None

    def list_sections(self) -> List[str]:
        """
        Listet alle Tool-Abschnitte in der CLAUDE.md auf.

        Returns:
            Liste der Tool-Namen
        """
        if not self.claude_md_path.exists():
            return []

        content = self.claude_md_path.read_text(encoding='utf-8')

        # Finde alle START-Marker
        pattern = r'<!-- ([A-Z0-9_-]+)-START -->'
        matches = re.findall(pattern, content)

        return matches

    def validate_content(self, original: str, new_content: str, tool_name: str) -> Tuple[bool, str]:
        """
        Validiert den neuen Inhalt vor dem Speichern.

        Args:
            original: Ursprünglicher Inhalt
            new_content: Neuer Inhalt nach Änderung
            tool_name: Name des ändernden Tools

        Returns:
            (is_valid, error_message)
        """
        start_marker, end_marker = self._get_markers(tool_name)

        # 1. Prüfe dass Inhalt außerhalb der Marker nicht geändert wurde
        def strip_section(text: str) -> str:
            pattern = f"{re.escape(start_marker)}.*?{re.escape(end_marker)}"
            return re.sub(pattern, "", text, flags=re.DOTALL)

        original_stripped = strip_section(original)
        new_stripped = strip_section(new_content)

        # Normalisiere Whitespace für Vergleich
        if original_stripped.strip() != new_stripped.strip():
            # Prüfe ob es nur Whitespace-Unterschiede am Ende sind
            if original_stripped.rstrip() != new_stripped.rstrip():
                return False, "Inhalt außerhalb der Marker wurde verändert"

        # 2. Prüfe dass Datei nicht drastisch schrumpft (>50%)
        if len(original) > 100 and len(new_content) < len(original) * 0.5:
            return False, f"Datei würde um >50% schrumpfen ({len(original)} → {len(new_content)} Zeichen)"

        # 3. Prüfe auf korrupte Marker
        start_count = new_content.count(start_marker)
        end_count = new_content.count(end_marker)
        if start_count != end_count:
            return False, f"Marker-Anzahl stimmt nicht: {start_count} START vs {end_count} END"

        return True, ""

    def update_section(
        self,
        tool_name: str,
        new_content: str,
        section_title: Optional[str] = None,
        create_if_missing: bool = True
    ) -> bool:
        """
        Aktualisiert einen Abschnitt sicher.

        Args:
            tool_name: Name des Tools (z.B. "KI-WISSEN")
            new_content: Neuer Inhalt für den Abschnitt
            section_title: Optionale Überschrift (z.B. "## KI-Wissen")
            create_if_missing: Abschnitt erstellen wenn nicht vorhanden

        Returns:
            True bei Erfolg
        """
        start_marker, end_marker = self._get_markers(tool_name)

        # Kompletten Abschnitt mit Markern bauen
        if section_title:
            full_section = f"{start_marker}\n{section_title}\n\n{new_content}\n{end_marker}"
        else:
            full_section = f"{start_marker}\n{new_content}\n{end_marker}"

        try:
            # Backup erstellen
            backup_path = self._create_backup()

            # Aktuellen Inhalt lesen oder neu erstellen
            if self.claude_md_path.exists():
                original_content = self.claude_md_path.read_text(encoding='utf-8')
            else:
                original_content = "# Projektanweisungen\n\n"
                logger.info(f"Erstelle neue CLAUDE.md: {self.claude_md_path}")

            # Abschnitt ersetzen oder hinzufügen
            if start_marker in original_content:
                # Ersetze existierenden Abschnitt
                pattern = f"{re.escape(start_marker)}.*?{re.escape(end_marker)}"
                new_file_content = re.sub(pattern, full_section, original_content, flags=re.DOTALL)
                logger.info(f"Abschnitt '{tool_name}' aktualisiert")
            elif create_if_missing:
                # Am Ende hinzufügen
                new_file_content = original_content.rstrip() + "\n\n" + full_section + "\n"
                logger.info(f"Abschnitt '{tool_name}' hinzugefügt")
            else:
                logger.warning(f"Abschnitt '{tool_name}' nicht gefunden und create_if_missing=False")
                return False

            # Validierung
            is_valid, error = self.validate_content(original_content, new_file_content, tool_name)
            if not is_valid:
                logger.error(f"Validierung fehlgeschlagen: {error}")
                return False

            # Speichern
            self.claude_md_path.write_text(new_file_content, encoding='utf-8')
            logger.info(f"CLAUDE.md gespeichert ({len(new_file_content)} Zeichen)")
            return True

        except Exception as e:
            logger.error(f"Fehler beim Aktualisieren: {e}")

            # Bei Fehler: Backup wiederherstellen
            if backup_path and backup_path.exists():
                logger.info("Versuche Backup wiederherzustellen...")
                self.restore_from_backup(backup_path)

            return False

    def remove_section(self, tool_name: str) -> bool:
        """
        Entfernt einen Abschnitt aus der CLAUDE.md.

        Args:
            tool_name: Name des Tools

        Returns:
            True bei Erfolg
        """
        if not self.claude_md_path.exists():
            return False

        start_marker, end_marker = self._get_markers(tool_name)

        try:
            backup_path = self._create_backup()
            content = self.claude_md_path.read_text(encoding='utf-8')

            if start_marker not in content:
                logger.info(f"Abschnitt '{tool_name}' nicht vorhanden")
                return True

            # Abschnitt entfernen
            pattern = f"\n*{re.escape(start_marker)}.*?{re.escape(end_marker)}\n*"
            new_content = re.sub(pattern, "\n\n", content, flags=re.DOTALL)

            # Mehrfache Leerzeilen bereinigen
            new_content = re.sub(r'\n{3,}', '\n\n', new_content)

            self.claude_md_path.write_text(new_content, encoding='utf-8')
            logger.info(f"Abschnitt '{tool_name}' entfernt")
            return True

        except Exception as e:
            logger.error(f"Fehler beim Entfernen: {e}")
            if backup_path and backup_path.exists():
                self.restore_from_backup(backup_path)
            return False


def update_claude_md_section(
    claude_md_path: Path,
    tool_name: str,
    new_content: str,
    section_title: Optional[str] = None
) -> bool:
    """
    Convenience-Funktion zum Aktualisieren eines CLAUDE.md Abschnitts.

    Args:
        claude_md_path: Pfad zur CLAUDE.md
        tool_name: Tool-Name für Marker (z.B. "KI-WISSEN")
        new_content: Neuer Inhalt
        section_title: Optionale Überschrift

    Returns:
        True bei Erfolg

    Beispiel:
        update_claude_md_section(
            Path("CLAUDE.md"),
            "KI-WISSEN",
            "> Aktualisiert: 2025-12-09\\n> IMMER einlesen: docs/KI_Wissen.md",
            "## KI-Wissen (Auto-generiert)"
        )
    """
    protector = ClaudeMdProtector(claude_md_path)
    return protector.update_section(tool_name, new_content, section_title)


# ============================================================================
# Sync-Funktionen fuer automatische Konsistenz
# ============================================================================

def sync_ideen_count_to_claude_md(
    claude_md_path: Path,
    ideen_md_path: Path
) -> bool:
    """
    Synchronisiert die IDEEN-Anzahl von IDEEN.md nach CLAUDE.md.

    Liest die Anzahl aus IDEEN.md Header ("**Anzahl:** 37 Ideen") und
    aktualisiert CLAUDE.md entsprechend ("35 Tool-Ideen" -> "37 Tool-Ideen").

    Args:
        claude_md_path: Pfad zur CLAUDE.md
        ideen_md_path: Pfad zur IDEEN.md

    Returns:
        True bei Erfolg oder wenn keine Aenderung noetig
    """
    import re

    try:
        # 1. IDEEN.md lesen und Anzahl extrahieren
        if not ideen_md_path.exists():
            logger.warning(f"IDEEN.md nicht gefunden: {ideen_md_path}")
            return False

        ideen_content = ideen_md_path.read_text(encoding='utf-8')

        # Pattern: "**Anzahl:** 37 Ideen" oder "Anzahl: 37"
        match = re.search(r'\*?\*?Anzahl:?\*?\*?\s*(\d+)', ideen_content)
        if not match:
            logger.warning("Konnte Anzahl in IDEEN.md nicht finden")
            return False

        ideen_count = int(match.group(1))
        logger.info(f"IDEEN.md Anzahl: {ideen_count}")

        # 2. CLAUDE.md lesen
        if not claude_md_path.exists():
            logger.warning(f"CLAUDE.md nicht gefunden: {claude_md_path}")
            return False

        claude_content = claude_md_path.read_text(encoding='utf-8')

        # 3. Pattern in CLAUDE.md finden: "XX Tool-Ideen"
        pattern = r'(\d+)\s+Tool-Ideen'
        match_claude = re.search(pattern, claude_content)

        if not match_claude:
            logger.info("Kein 'X Tool-Ideen' Pattern in CLAUDE.md gefunden - ueberspringe")
            return True

        current_count = int(match_claude.group(1))

        # 4. Vergleichen und ggf. updaten
        if current_count == ideen_count:
            logger.info(f"CLAUDE.md bereits aktuell ({ideen_count} Tool-Ideen)")
            return True

        # 5. Ersetzen
        new_content = re.sub(
            pattern,
            f'{ideen_count} Tool-Ideen',
            claude_content
        )

        # 6. Speichern (mit Backup ueber Protector)
        protector = ClaudeMdProtector(claude_md_path)
        protector._create_backup()

        claude_md_path.write_text(new_content, encoding='utf-8')
        logger.info(f"CLAUDE.md aktualisiert: {current_count} -> {ideen_count} Tool-Ideen")
        return True

    except Exception as e:
        logger.error(f"Fehler bei sync_ideen_count: {e}")
        return False


# ============================================================================
# CLI fuer direkten Aufruf
# ============================================================================

if __name__ == '__main__':
    import argparse

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    parser = argparse.ArgumentParser(description='CLAUDE.md Helper')
    parser.add_argument('claude_md', type=Path, help='Pfad zur CLAUDE.md')
    parser.add_argument('--list', action='store_true', help='Liste alle Abschnitte')
    parser.add_argument('--get', metavar='TOOL', help='Zeige Abschnitt eines Tools')
    parser.add_argument('--remove', metavar='TOOL', help='Entferne Abschnitt eines Tools')
    parser.add_argument('--backups', action='store_true', help='Liste Backups')
    parser.add_argument('--restore', action='store_true', help='Stelle letztes Backup her')

    args = parser.parse_args()

    protector = ClaudeMdProtector(args.claude_md)

    if args.list:
        sections = protector.list_sections()
        if sections:
            print("Gefundene Abschnitte:")
            for s in sections:
                print(f"  - {s}")
        else:
            print("Keine Tool-Abschnitte gefunden")

    elif args.get:
        content = protector.get_section(args.get)
        if content:
            print(f"=== {args.get} ===")
            print(content)
        else:
            print(f"Abschnitt '{args.get}' nicht gefunden")

    elif args.remove:
        if protector.remove_section(args.remove):
            print(f"Abschnitt '{args.remove}' entfernt")
        else:
            print("Fehler beim Entfernen")

    elif args.backups:
        if protector.backup_dir.exists():
            backups = sorted(protector.backup_dir.glob('*.bak'))
            if backups:
                print("Verfügbare Backups:")
                for b in backups:
                    print(f"  - {b.name}")
            else:
                print("Keine Backups vorhanden")
        else:
            print("Backup-Verzeichnis existiert nicht")

    elif args.restore:
        if protector.restore_from_backup():
            print("CLAUDE.md aus Backup wiederhergestellt")
        else:
            print("Wiederherstellung fehlgeschlagen")

    else:
        parser.print_help()
