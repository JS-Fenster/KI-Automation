# KI-Automation Shared Library
# ============================
# Zentrale Hilfsfunktionen für alle Tools

# CLAUDE.md Helper
from .claude_md_helper import update_claude_md_section, ClaudeMdProtector

# Config Loader
from .config_loader import ConfigLoader, get_config

# Logger
from .logger import get_logger, setup_logging, log_exception

# Database Connector
from .db_connector import (
    DatabaseConnection,
    get_db,
    db_connection,
    DatabaseError,
    ConnectionError,
    QueryError
)

__all__ = [
    # CLAUDE.md
    'update_claude_md_section',
    'ClaudeMdProtector',

    # Config
    'ConfigLoader',
    'get_config',

    # Logger
    'get_logger',
    'setup_logging',
    'log_exception',

    # Database
    'DatabaseConnection',
    'get_db',
    'db_connection',
    'DatabaseError',
    'ConnectionError',
    'QueryError',
]

__version__ = '0.1.0'
