#!/usr/bin/env python3
"""
Config Loader - Zentrale Konfigurationsverwaltung
=================================================

Lädt alle YAML-Konfigurationen und stellt sie einheitlich bereit.
Unterstützt Variablenersetzung (${base_path}) und Umgebungsvariablen.

Verwendung:
    from lib.config_loader import ConfigLoader, get_config

    # Singleton-Zugriff
    config = get_config()
    db_config = config.database
    paths = config.paths

    # Oder direkt
    loader = ConfigLoader()
    sql_host = loader.database['sql_server']['host']
"""
from __future__ import annotations

import os
import re
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import yaml

logger = logging.getLogger(__name__)

# Basis-Pfad ermitteln (lib/ -> KI_Automation/)
LIB_DIR = Path(__file__).resolve().parent
BASE_DIR = LIB_DIR.parent
CONFIG_DIR = LIB_DIR / 'config'


class ConfigLoader:
    """
    Zentrale Klasse zum Laden aller Konfigurationen.

    Implementiert als Singleton für einfachen Zugriff.
    """

    _instance: Optional['ConfigLoader'] = None

    def __new__(cls) -> 'ConfigLoader':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._configs: Dict[str, Dict] = {}
        self._base_path = str(BASE_DIR)
        self._load_all_configs()
        self._initialized = True

    def _resolve_variables(self, value: Any) -> Any:
        """
        Ersetzt ${variable} Platzhalter in Strings.

        Unterstützt:
        - ${base_path} -> Basis-Verzeichnis
        - ${env.VARNAME} -> Umgebungsvariable
        """
        if isinstance(value, str):
            # ${base_path} ersetzen
            value = value.replace('${base_path}', self._base_path)

            # ${env.VARNAME} ersetzen
            env_pattern = r'\$\{env\.(\w+)\}'
            matches = re.findall(env_pattern, value)
            for var_name in matches:
                env_value = os.environ.get(var_name, '')
                value = value.replace(f'${{env.{var_name}}}', env_value)

            return value

        elif isinstance(value, dict):
            return {k: self._resolve_variables(v) for k, v in value.items()}

        elif isinstance(value, list):
            return [self._resolve_variables(item) for item in value]

        return value

    def _load_yaml(self, filename: str) -> Dict[str, Any]:
        """Lädt eine einzelne YAML-Datei."""
        filepath = CONFIG_DIR / filename

        if not filepath.exists():
            logger.warning(f"Config-Datei nicht gefunden: {filepath}")
            return {}

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f) or {}

            # Variablen auflösen
            data = self._resolve_variables(data)
            logger.debug(f"Config geladen: {filename}")
            return data

        except yaml.YAMLError as e:
            logger.error(f"YAML-Fehler in {filename}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Fehler beim Laden von {filename}: {e}")
            return {}

    def _load_all_configs(self) -> None:
        """Lädt alle Konfigurationsdateien."""
        self._configs['database'] = self._load_yaml('database.yaml')
        self._configs['paths'] = self._load_yaml('paths.yaml')
        self._configs['tools'] = self._load_yaml('tools.yaml')

        # Credentials separat laden (sensibel!)
        credentials_file = CONFIG_DIR / 'credentials.yaml'
        if credentials_file.exists():
            self._configs['credentials'] = self._load_yaml('credentials.yaml')
            logger.info("Credentials geladen")
        else:
            self._configs['credentials'] = {}
            logger.warning("credentials.yaml nicht gefunden - verwende leere Credentials")

        logger.info(f"Alle Configs geladen aus: {CONFIG_DIR}")

    def reload(self) -> None:
        """Lädt alle Konfigurationen neu."""
        self._configs.clear()
        self._load_all_configs()
        logger.info("Konfigurationen neu geladen")

    @property
    def database(self) -> Dict[str, Any]:
        """Gibt die Datenbank-Konfiguration zurück."""
        return self._configs.get('database', {})

    @property
    def paths(self) -> Dict[str, Any]:
        """Gibt die Pfad-Konfiguration zurück."""
        return self._configs.get('paths', {})

    @property
    def tools(self) -> Dict[str, Any]:
        """Gibt die Tool-Konfiguration zurück."""
        return self._configs.get('tools', {})

    @property
    def credentials(self) -> Dict[str, Any]:
        """Gibt die Credentials zurück (sensibel!)."""
        return self._configs.get('credentials', {})

    @property
    def base_path(self) -> Path:
        """Gibt den Basis-Pfad als Path-Objekt zurück."""
        return BASE_DIR

    def get(self, section: str, key: str = None, default: Any = None) -> Any:
        """
        Flexibler Zugriff auf Konfigurationswerte.

        Args:
            section: Config-Sektion (database, paths, tools, credentials)
            key: Optionaler Schlüssel innerhalb der Sektion
            default: Standardwert wenn nicht gefunden

        Returns:
            Konfigurationswert oder default

        Beispiele:
            config.get('database', 'sql_server.host')
            config.get('paths', 'external.artikellisten')
        """
        config = self._configs.get(section, {})

        if key is None:
            return config

        # Unterstütze verschachtelte Keys mit Punkt-Notation
        keys = key.split('.')
        value = config

        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default

        return value

    def get_path(self, *keys: str) -> Optional[Path]:
        """
        Gibt einen Pfad als Path-Objekt zurück.

        Args:
            keys: Schlüssel in der paths-Config

        Returns:
            Path-Objekt oder None

        Beispiel:
            config.get_path('external', 'artikellisten')
        """
        value = self.paths
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None

        if isinstance(value, str):
            return Path(value)
        return None


# Singleton-Zugriff
_config_instance: Optional[ConfigLoader] = None

def get_config() -> ConfigLoader:
    """
    Gibt die globale ConfigLoader-Instanz zurück.

    Verwendung:
        from lib.config_loader import get_config
        config = get_config()
    """
    global _config_instance
    if _config_instance is None:
        _config_instance = ConfigLoader()
    return _config_instance


# ============================================================================
# CLI für direkten Aufruf
# ============================================================================

if __name__ == '__main__':
    import argparse

    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )

    parser = argparse.ArgumentParser(description='Config Loader')
    parser.add_argument('--show', choices=['database', 'paths', 'tools', 'all'],
                        default='all', help='Zeige Konfiguration')
    parser.add_argument('--get', metavar='SECTION.KEY',
                        help='Hole spezifischen Wert (z.B. database.sql_server.host)')

    args = parser.parse_args()

    config = get_config()

    if args.get:
        parts = args.get.split('.', 1)
        if len(parts) == 2:
            value = config.get(parts[0], parts[1])
            print(f"{args.get} = {value}")
        else:
            print(f"Format: SECTION.KEY (z.B. database.sql_server.host)")

    elif args.show == 'all':
        print(f"Base Path: {config.base_path}")
        print(f"\n=== Database ===")
        print(yaml.dump(config.database, default_flow_style=False))
        print(f"\n=== Paths ===")
        print(yaml.dump(config.paths, default_flow_style=False))
        print(f"\n=== Tools ===")
        print(yaml.dump(config.tools, default_flow_style=False))
        print(f"\n=== Credentials ===")
        if config.credentials:
            print("(Credentials geladen, nicht angezeigt)")
        else:
            print("(Keine credentials.yaml gefunden)")

    else:
        section = getattr(config, args.show, {})
        print(yaml.dump(section, default_flow_style=False))
