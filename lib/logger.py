#!/usr/bin/env python3
"""
Logger - Einheitliches Logging für alle Tools
==============================================

Bietet ein zentrales Logging-System mit:
- Rotation (max 10MB pro Datei)
- Konsolen- und Datei-Output
- Farbige Ausgabe (wenn Terminal)
- Tool-spezifische Logger

Verwendung:
    from lib.logger import get_logger, setup_logging

    # Logging initialisieren (einmal am Start)
    setup_logging()

    # Logger für ein Tool holen
    logger = get_logger('preislisten')
    logger.info("Tool gestartet")
    logger.error("Fehler aufgetreten", exc_info=True)
"""
from __future__ import annotations

import os
import sys
import logging
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Optional
from datetime import datetime

# Basis-Pfad ermitteln
LIB_DIR = Path(__file__).resolve().parent
BASE_DIR = LIB_DIR.parent
LOGS_DIR = LIB_DIR / 'logs'


# ANSI Farbcodes für Terminal
class Colors:
    RESET = '\033[0m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    GRAY = '\033[90m'


def supports_color() -> bool:
    """Prüft ob das Terminal Farben unterstützt."""
    if not hasattr(sys.stdout, 'isatty'):
        return False
    if not sys.stdout.isatty():
        return False
    if os.environ.get('NO_COLOR'):
        return False
    if os.environ.get('TERM') == 'dumb':
        return False
    return True


class ColoredFormatter(logging.Formatter):
    """Formatter mit farbiger Ausgabe für Konsole."""

    LEVEL_COLORS = {
        logging.DEBUG: Colors.GRAY,
        logging.INFO: Colors.GREEN,
        logging.WARNING: Colors.YELLOW,
        logging.ERROR: Colors.RED,
        logging.CRITICAL: Colors.MAGENTA,
    }

    def __init__(self, fmt: str = None, datefmt: str = None, use_colors: bool = True):
        super().__init__(fmt, datefmt)
        self.use_colors = use_colors and supports_color()

    def format(self, record: logging.LogRecord) -> str:
        if self.use_colors:
            color = self.LEVEL_COLORS.get(record.levelno, Colors.RESET)
            record.levelname = f"{color}{record.levelname}{Colors.RESET}"
            record.name = f"{Colors.CYAN}{record.name}{Colors.RESET}"

        return super().format(record)


class LoggingConfig:
    """Konfiguration für das Logging-System."""

    def __init__(
        self,
        level: str = 'INFO',
        max_bytes: int = 10 * 1024 * 1024,  # 10 MB
        backup_count: int = 5,
        log_to_console: bool = True,
        log_to_file: bool = True,
        log_dir: Optional[Path] = None
    ):
        self.level = getattr(logging, level.upper(), logging.INFO)
        self.max_bytes = max_bytes
        self.backup_count = backup_count
        self.log_to_console = log_to_console
        self.log_to_file = log_to_file
        self.log_dir = log_dir or LOGS_DIR


# Globale Konfiguration
_logging_config: Optional[LoggingConfig] = None
_is_initialized = False


def setup_logging(
    level: str = 'INFO',
    max_bytes: int = 10 * 1024 * 1024,
    backup_count: int = 5,
    log_to_console: bool = True,
    log_to_file: bool = True,
    log_dir: Optional[Path] = None
) -> None:
    """
    Initialisiert das zentrale Logging-System.

    Args:
        level: Log-Level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        max_bytes: Maximale Größe pro Log-Datei (Default: 10MB)
        backup_count: Anzahl der Backup-Dateien (Default: 5)
        log_to_console: Ausgabe auf Konsole
        log_to_file: Ausgabe in Datei
        log_dir: Verzeichnis für Log-Dateien

    Sollte einmal am Programmstart aufgerufen werden.
    """
    global _logging_config, _is_initialized

    _logging_config = LoggingConfig(
        level=level,
        max_bytes=max_bytes,
        backup_count=backup_count,
        log_to_console=log_to_console,
        log_to_file=log_to_file,
        log_dir=log_dir
    )

    # Log-Verzeichnis erstellen
    _logging_config.log_dir.mkdir(parents=True, exist_ok=True)

    # Root-Logger konfigurieren
    root_logger = logging.getLogger()
    root_logger.setLevel(_logging_config.level)

    # Bestehende Handler entfernen
    root_logger.handlers.clear()

    # Konsolen-Handler
    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(_logging_config.level)
        console_format = ColoredFormatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        )
        console_handler.setFormatter(console_format)
        root_logger.addHandler(console_handler)

    # Datei-Handler (alle Logs in einer Datei)
    if log_to_file:
        log_file = _logging_config.log_dir / 'ki_automation.log'
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=_logging_config.max_bytes,
            backupCount=_logging_config.backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(_logging_config.level)
        file_format = logging.Formatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_format)
        root_logger.addHandler(file_handler)

    _is_initialized = True
    logging.debug(f"Logging initialisiert (Level: {level}, Log-Dir: {_logging_config.log_dir})")


def get_logger(name: str, log_file: Optional[str] = None) -> logging.Logger:
    """
    Gibt einen Logger für ein spezifisches Tool/Modul zurück.

    Args:
        name: Name des Tools/Moduls (z.B. 'preislisten', 'ki_wissen')
        log_file: Optionale separate Log-Datei für dieses Tool

    Returns:
        Konfigurierter Logger

    Beispiel:
        logger = get_logger('preislisten')
        logger.info("Preislisten-Tool gestartet")
    """
    global _is_initialized

    # Auto-Initialisierung wenn noch nicht geschehen
    if not _is_initialized:
        setup_logging()

    logger = logging.getLogger(name)

    # Optional: Separater File-Handler für dieses Tool
    if log_file and _logging_config and _logging_config.log_to_file:
        tool_log_file = _logging_config.log_dir / log_file
        file_handler = RotatingFileHandler(
            tool_log_file,
            maxBytes=_logging_config.max_bytes,
            backupCount=_logging_config.backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(_logging_config.level)
        file_format = logging.Formatter(
            fmt='%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)

    return logger


def log_exception(logger: logging.Logger, message: str = "Exception aufgetreten") -> None:
    """
    Loggt die aktuelle Exception mit Traceback.

    Verwendung:
        try:
            ...
        except Exception:
            log_exception(logger, "Fehler bei der Verarbeitung")
    """
    logger.exception(message)


def log_function_call(logger: logging.Logger):
    """
    Decorator zum Loggen von Funktionsaufrufen.

    Verwendung:
        @log_function_call(logger)
        def meine_funktion(arg1, arg2):
            ...
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger.debug(f"Aufruf: {func.__name__}(args={args}, kwargs={kwargs})")
            try:
                result = func(*args, **kwargs)
                logger.debug(f"Ergebnis: {func.__name__} -> {type(result).__name__}")
                return result
            except Exception as e:
                logger.error(f"Exception in {func.__name__}: {e}")
                raise
        return wrapper
    return decorator


# ============================================================================
# CLI für direkten Aufruf
# ============================================================================

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Logger Test')
    parser.add_argument('--level', default='DEBUG', help='Log-Level')
    parser.add_argument('--test', action='store_true', help='Test-Nachrichten ausgeben')
    parser.add_argument('--show-logs', action='store_true', help='Log-Dateien anzeigen')

    args = parser.parse_args()

    if args.show_logs:
        print(f"Log-Verzeichnis: {LOGS_DIR}")
        if LOGS_DIR.exists():
            for f in sorted(LOGS_DIR.glob('*.log')):
                size = f.stat().st_size
                print(f"  {f.name}: {size:,} bytes")
        else:
            print("  (Verzeichnis existiert nicht)")

    elif args.test:
        setup_logging(level=args.level)

        logger = get_logger('test')
        print(f"\n=== Test-Logs (Level: {args.level}) ===\n")

        logger.debug("Das ist eine DEBUG-Nachricht")
        logger.info("Das ist eine INFO-Nachricht")
        logger.warning("Das ist eine WARNING-Nachricht")
        logger.error("Das ist eine ERROR-Nachricht")
        logger.critical("Das ist eine CRITICAL-Nachricht")

        print(f"\nLogs geschrieben nach: {LOGS_DIR / 'ki_automation.log'}")
