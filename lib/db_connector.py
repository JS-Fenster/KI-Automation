#!/usr/bin/env python3
"""
DB Connector - SQL Server Verbindung mit Graceful Degradation
=============================================================

Zentrale Klasse für alle SQL Server Verbindungen.
Unterstützt Offline-Modus wenn Server nicht erreichbar.

Verwendung:
    from lib.db_connector import get_db, DatabaseConnection

    # Context Manager (empfohlen)
    with get_db() as db:
        results = db.query("SELECT * FROM dbo.Kunden WHERE Code = ?", [123])
        for row in results:
            print(row)

    # Oder als Singleton
    db = get_db()
    if db.is_connected:
        count = db.query_scalar("SELECT COUNT(*) FROM dbo.Artikel")
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple, Union
from contextlib import contextmanager

try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False

# Lokale Imports (mit Fallback für direkten Aufruf)
import sys
from pathlib import Path
_LIB_DIR = Path(__file__).resolve().parent
if str(_LIB_DIR.parent) not in sys.path:
    sys.path.insert(0, str(_LIB_DIR.parent))

try:
    from lib.config_loader import get_config
    from lib.logger import get_logger
except ImportError:
    from config_loader import get_config
    from logger import get_logger

logger = get_logger('db_connector')


class DatabaseError(Exception):
    """Basis-Exception für Datenbankfehler."""
    pass


class ConnectionError(DatabaseError):
    """Fehler beim Verbindungsaufbau."""
    pass


class QueryError(DatabaseError):
    """Fehler bei einer Query."""
    pass


class DatabaseConnection:
    """
    SQL Server Verbindungsklasse mit Graceful Degradation.

    Features:
    - Automatische Verbindungsverwaltung
    - Credentials aus Config oder interaktiv
    - Offline-Modus wenn Server nicht erreichbar
    - Context Manager für automatisches Schließen
    - Query-Caching (optional)
    """

    def __init__(
        self,
        host: Optional[str] = None,
        database: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        timeout: int = 30,
        auto_connect: bool = True
    ):
        """
        Initialisiert die Datenbankverbindung.

        Args:
            host: SQL Server Host (oder aus Config)
            database: Datenbank-Name (oder aus Config)
            username: Benutzername (oder aus Config/credentials.yaml)
            password: Passwort (oder aus Config/credentials.yaml)
            timeout: Verbindungs-Timeout in Sekunden
            auto_connect: Automatisch verbinden bei Initialisierung
        """
        config = get_config()

        # Parameter aus Config laden wenn nicht übergeben
        db_config = config.database.get('sql_server', {})
        self.host = host or db_config.get('host', '192.168.16.202\\SQLEXPRESS')
        self.database = database or db_config.get('database', 'WorkM001')
        self.driver = db_config.get('driver', 'SQL Server')
        self.timeout = timeout or db_config.get('timeout', 30)

        # Credentials
        creds = config.credentials.get('sql_server', {})
        self.username = username or creds.get('username')
        self.password = password or creds.get('password')

        # Verbindungsstatus
        self._connection: Optional['pyodbc.Connection'] = None
        self._is_offline = False
        self._last_error: Optional[str] = None

        # Auto-Connect
        if auto_connect and PYODBC_AVAILABLE:
            self.connect()

    @property
    def is_connected(self) -> bool:
        """Prüft ob eine aktive Verbindung besteht."""
        if self._connection is None:
            return False
        try:
            # Teste die Verbindung
            cursor = self._connection.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except:
            return False

    @property
    def is_offline(self) -> bool:
        """Gibt zurück ob im Offline-Modus."""
        return self._is_offline

    @property
    def last_error(self) -> Optional[str]:
        """Gibt den letzten Fehler zurück."""
        return self._last_error

    def _build_connection_string(self) -> str:
        """Erstellt den Connection String."""
        parts = [
            f'DRIVER={{{self.driver}}}',
            f'SERVER={self.host}',
            f'DATABASE={self.database}',
        ]

        if self.username and self.password:
            parts.extend([
                f'UID={self.username}',
                f'PWD={self.password}'
            ])
        else:
            # Windows Authentication
            parts.append('Trusted_Connection=yes')

        return ';'.join(parts)

    def connect(self) -> bool:
        """
        Stellt die Verbindung zum SQL Server her.

        Returns:
            True wenn erfolgreich, False bei Fehler (dann Offline-Modus)
        """
        if not PYODBC_AVAILABLE:
            logger.error("pyodbc nicht installiert!")
            self._is_offline = True
            self._last_error = "pyodbc nicht verfügbar"
            return False

        if not self.username or not self.password:
            logger.warning("Keine Credentials konfiguriert - prüfe lib/config/credentials.yaml")
            self._is_offline = True
            self._last_error = "Keine Credentials"
            return False

        try:
            connection_string = self._build_connection_string()
            logger.info(f"Verbinde zu {self.host}/{self.database}...")

            self._connection = pyodbc.connect(
                connection_string,
                timeout=self.timeout
            )
            self._is_offline = False
            self._last_error = None

            logger.info("Verbindung erfolgreich!")
            return True

        except pyodbc.Error as e:
            self._connection = None
            self._is_offline = True
            self._last_error = str(e)
            logger.warning(f"Verbindungsfehler: {e}")
            logger.info("Wechsle in Offline-Modus")
            return False

        except Exception as e:
            self._connection = None
            self._is_offline = True
            self._last_error = str(e)
            logger.error(f"Unerwarteter Fehler: {e}")
            return False

    def disconnect(self) -> None:
        """Schließt die Verbindung."""
        if self._connection:
            try:
                self._connection.close()
                logger.debug("Verbindung geschlossen")
            except:
                pass
            finally:
                self._connection = None

    def __enter__(self) -> 'DatabaseConnection':
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.disconnect()

    def query(
        self,
        sql: str,
        params: Optional[List[Any]] = None,
        fetch_all: bool = True
    ) -> List[Tuple]:
        """
        Führt eine SELECT-Query aus.

        Args:
            sql: SQL-Statement (mit ? Platzhaltern)
            params: Parameter für Platzhalter
            fetch_all: Alle Ergebnisse holen (True) oder Iterator

        Returns:
            Liste von Tuples oder leere Liste bei Offline

        Beispiel:
            results = db.query(
                "SELECT Name, Nummer FROM dbo.Kunden WHERE PLZ = ?",
                ['12345']
            )
        """
        if self._is_offline or not self._connection:
            logger.warning("Query im Offline-Modus - leere Ergebnisse")
            return []

        try:
            cursor = self._connection.cursor()
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)

            if fetch_all:
                results = cursor.fetchall()
            else:
                results = list(cursor)

            cursor.close()
            return results

        except pyodbc.Error as e:
            self._last_error = str(e)
            raise QueryError(f"Query fehlgeschlagen: {e}")

    def query_dict(
        self,
        sql: str,
        params: Optional[List[Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Führt eine Query aus und gibt Dictionaries zurück.

        Jede Zeile wird als Dict mit Spaltennamen als Keys zurückgegeben.

        Beispiel:
            results = db.query_dict("SELECT * FROM dbo.Artikel WHERE Code = ?", [123])
            # [{'Code': 123, 'Name': 'Test', ...}]
        """
        if self._is_offline or not self._connection:
            return []

        try:
            cursor = self._connection.cursor()
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)

            columns = [column[0] for column in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            cursor.close()
            return results

        except pyodbc.Error as e:
            self._last_error = str(e)
            raise QueryError(f"Query fehlgeschlagen: {e}")

    def query_scalar(
        self,
        sql: str,
        params: Optional[List[Any]] = None,
        default: Any = None
    ) -> Any:
        """
        Gibt einen einzelnen Wert zurück.

        Beispiel:
            count = db.query_scalar("SELECT COUNT(*) FROM dbo.Kunden")
        """
        if self._is_offline or not self._connection:
            return default

        try:
            cursor = self._connection.cursor()
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)

            row = cursor.fetchone()
            cursor.close()

            return row[0] if row else default

        except pyodbc.Error as e:
            self._last_error = str(e)
            return default

    def execute(
        self,
        sql: str,
        params: Optional[List[Any]] = None,
        commit: bool = True
    ) -> int:
        """
        Führt ein INSERT, UPDATE oder DELETE aus.

        Args:
            sql: SQL-Statement
            params: Parameter
            commit: Automatisch committen (Default: True)

        Returns:
            Anzahl betroffener Zeilen

        ACHTUNG: Vorsichtig mit UPDATE/DELETE auf Stammdaten!
        """
        if self._is_offline or not self._connection:
            logger.warning("Execute im Offline-Modus - keine Änderung")
            return 0

        try:
            cursor = self._connection.cursor()
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)

            rowcount = cursor.rowcount

            if commit:
                self._connection.commit()

            cursor.close()
            logger.debug(f"Execute: {rowcount} Zeilen betroffen")
            return rowcount

        except pyodbc.Error as e:
            self._last_error = str(e)
            if commit:
                self._connection.rollback()
            raise QueryError(f"Execute fehlgeschlagen: {e}")

    def test_connection(self) -> Dict[str, Any]:
        """
        Testet die Verbindung und gibt Informationen zurück.

        Returns:
            Dict mit Verbindungsstatus und Server-Info
        """
        result = {
            'connected': False,
            'host': self.host,
            'database': self.database,
            'offline_mode': self._is_offline,
            'error': self._last_error,
            'server_version': None,
            'table_count': None
        }

        if self._is_offline or not self._connection:
            return result

        try:
            # Server-Version
            version = self.query_scalar("SELECT @@VERSION")
            if version:
                result['server_version'] = version[:80] + '...'

            # Tabellen-Anzahl
            result['table_count'] = self.query_scalar("""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
            """)

            result['connected'] = True

        except Exception as e:
            result['error'] = str(e)

        return result


# Singleton-Instanz
_db_instance: Optional[DatabaseConnection] = None


def get_db(auto_connect: bool = True) -> DatabaseConnection:
    """
    Gibt die globale Datenbankverbindung zurück.

    Verwendung:
        db = get_db()
        if db.is_connected:
            results = db.query("SELECT * FROM dbo.Kunden")
    """
    global _db_instance
    if _db_instance is None:
        _db_instance = DatabaseConnection(auto_connect=auto_connect)
    return _db_instance


@contextmanager
def db_connection():
    """
    Context Manager für eine neue Datenbankverbindung.

    Verwendung:
        with db_connection() as db:
            results = db.query("SELECT * FROM dbo.Kunden")
    """
    db = DatabaseConnection()
    try:
        yield db
    finally:
        db.disconnect()


# ============================================================================
# CLI für direkten Aufruf
# ============================================================================

if __name__ == '__main__':
    import argparse
    from lib.logger import setup_logging

    setup_logging(level='INFO')

    parser = argparse.ArgumentParser(description='SQL Server Connection Test')
    parser.add_argument('--test', action='store_true', help='Verbindung testen')
    parser.add_argument('--query', metavar='SQL', help='SQL-Query ausführen')
    parser.add_argument('--tables', action='store_true', help='Tabellen auflisten')
    parser.add_argument('--interactive', action='store_true',
                        help='Credentials interaktiv eingeben')

    args = parser.parse_args()

    if args.interactive:
        import getpass
        print("=== Interaktive Anmeldung ===")
        username = input("Username: ")
        password = getpass.getpass("Passwort: ")
        db = DatabaseConnection(username=username, password=password)
    else:
        db = get_db()

    if args.test:
        print("\n=== Verbindungstest ===")
        info = db.test_connection()
        for key, value in info.items():
            print(f"  {key}: {value}")

    elif args.query:
        print(f"\n=== Query: {args.query} ===")
        try:
            results = db.query_dict(args.query)
            for row in results[:20]:  # Max 20 Zeilen
                print(row)
            if len(results) > 20:
                print(f"... und {len(results) - 20} weitere")
        except QueryError as e:
            print(f"Fehler: {e}")

    elif args.tables:
        print("\n=== Tabellen (dbo) ===")
        tables = db.query("""
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
            ORDER BY TABLE_NAME
        """)
        for (name,) in tables[:30]:
            print(f"  - {name}")
        if len(tables) > 30:
            print(f"  ... und {len(tables) - 30} weitere")

    else:
        print("\n=== DB Connector Status ===")
        print(f"pyodbc verfügbar: {PYODBC_AVAILABLE}")
        print(f"Host: {db.host}")
        print(f"Database: {db.database}")
        print(f"Verbunden: {db.is_connected}")
        print(f"Offline-Modus: {db.is_offline}")
        if db.last_error:
            print(f"Letzter Fehler: {db.last_error}")

    db.disconnect()
