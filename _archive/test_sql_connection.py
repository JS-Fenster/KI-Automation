#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SQL Server Connection Test Script
Testet die Verbindung zum ERP SQL Server
"""

import pyodbc
import getpass

# Verbindungsparameter
SERVER = '192.168.16.202\\SQLEXPRESS'
DATABASE = 'WorkM001'

def test_connection():
    print("=== SQL Server Verbindungstest ===")
    print(f"Server: {SERVER}")
    print(f"Datenbank: {DATABASE}")
    print()

    # Credentials abfragen
    username = input("SQL Server Username: ")
    password = getpass.getpass("SQL Server Passwort: ")

    try:
        # Verbindungsstring erstellen
        connection_string = (
            f'DRIVER={{SQL Server}};'
            f'SERVER={SERVER};'
            f'DATABASE={DATABASE};'
            f'UID={username};'
            f'PWD={password}'
        )

        print("\nVerbindung wird hergestellt...")
        conn = pyodbc.connect(connection_string, timeout=10)
        cursor = conn.cursor()

        print("✅ Verbindung erfolgreich!\n")

        # Test 1: Server-Version abfragen
        print("--- Server-Informationen ---")
        cursor.execute("SELECT @@VERSION as Version")
        version = cursor.fetchone()
        print(f"Version: {version[0][:80]}...")
        print()

        # Test 2: Datenbank-Name bestätigen
        cursor.execute("SELECT DB_NAME() as CurrentDatabase")
        db = cursor.fetchone()
        print(f"Aktuelle Datenbank: {db[0]}")
        print()

        # Test 3: Anzahl der Tabellen anzeigen
        cursor.execute("""
            SELECT COUNT(*) as TableCount
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
        """)
        table_count = cursor.fetchone()
        print(f"Anzahl Tabellen: {table_count[0]}")
        print()

        # Test 4: Erste 10 Tabellen auflisten
        print("--- Erste 10 Tabellen ---")
        cursor.execute("""
            SELECT TOP 10 TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
            ORDER BY TABLE_NAME
        """)

        tables = cursor.fetchall()
        for table in tables:
            print(f"  • {table[0]}")

        print()

        # Test 5: Beispiel-Query auf eine Tabelle (wenn dbo.Artikel existiert)
        try:
            cursor.execute("SELECT COUNT(*) as Count FROM dbo.Artikel")
            count = cursor.fetchone()
            print(f"--- Beispiel-Query ---")
            print(f"Anzahl Datensätze in dbo.Artikel: {count[0]}")
        except:
            print("--- Beispiel-Query ---")
            print("Tabelle dbo.Artikel nicht gefunden oder kein Zugriff")

        # Verbindung schließen
        cursor.close()
        conn.close()

        print("\n✅ Alle Tests erfolgreich!")
        print("\n🎉 Programmatischer Zugriff ist möglich!")
        print("Du kannst jetzt n8n, Python-Skripte oder andere Tools verwenden.")

    except pyodbc.Error as e:
        print(f"\n❌ Fehler bei der Verbindung:")
        print(f"   {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unerwarteter Fehler:")
        print(f"   {e}")
        return False

    return True

if __name__ == "__main__":
    test_connection()
    input("\nDrücke Enter zum Beenden...")
