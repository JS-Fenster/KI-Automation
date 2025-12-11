#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SQL Server Database Structure Documentation Script
Liest alle Tabellen, Schemas und Beispieldaten aus und erweitert die Wissensdatenbank
"""

import pyodbc
import getpass
from datetime import datetime

# Verbindungsparameter
SERVER = '192.168.16.202\\SQLEXPRESS'
DATABASE = 'WorkM001'
KNOWLEDGE_BASE_FILE = r'Z:\IT-Sammlung\KI_Automation\docs\ERP_Datenbank.md'

def sanitize_value(value):
    """Konvertiert Werte in sichere String-Darstellung"""
    if value is None:
        return 'NULL'
    elif isinstance(value, (bytes, bytearray)):
        return f'<binary data, {len(value)} bytes>'
    elif isinstance(value, str):
        # Limitiere String-Länge für Lesbarkeit
        if len(value) > 100:
            return f'{value[:100]}... (total: {len(value)} chars)'
        return value
    else:
        return str(value)

def get_all_tables(cursor):
    """Holt alle Tabellen aus der Datenbank"""
    query = """
        SELECT
            TABLE_SCHEMA,
            TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_SCHEMA = 'dbo'
        ORDER BY TABLE_NAME
    """
    cursor.execute(query)
    return cursor.fetchall()

def get_table_schema(cursor, schema, table_name):
    """Holt das Schema einer Tabelle (Spalten, Typen, etc.)"""
    query = """
        SELECT
            COLUMN_NAME,
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH,
            IS_NULLABLE,
            COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    """
    cursor.execute(query, schema, table_name)
    return cursor.fetchall()

def get_sample_row(cursor, schema, table_name):
    """Holt eine Beispielzeile aus der Tabelle"""
    try:
        query = f"SELECT TOP 1 * FROM [{schema}].[{table_name}]"
        cursor.execute(query)

        # Hole Spaltennamen
        columns = [column[0] for column in cursor.description]

        # Hole die erste Zeile
        row = cursor.fetchone()

        if row:
            return columns, row
        else:
            return columns, None
    except Exception as e:
        return None, f"Error: {e}"

def get_row_count(cursor, schema, table_name):
    """Zählt die Anzahl der Zeilen in einer Tabelle"""
    try:
        query = f"SELECT COUNT(*) FROM [{schema}].[{table_name}]"
        cursor.execute(query)
        count = cursor.fetchone()[0]
        return count
    except:
        return "N/A"

def document_database():
    print("=== SQL Server Datenbank-Dokumentation ===")
    print(f"Server: {SERVER}")
    print(f"Datenbank: {DATABASE}")
    print()

    # Credentials abfragen
    username = input("SQL Server Username: ")
    password = getpass.getpass("SQL Server Passwort: ")

    try:
        # Verbindung herstellen
        connection_string = (
            f'DRIVER={{SQL Server}};'
            f'SERVER={SERVER};'
            f'DATABASE={DATABASE};'
            f'UID={username};'
            f'PWD={password}'
        )

        print("\nVerbindung wird hergestellt...")
        conn = pyodbc.connect(connection_string, timeout=30)
        cursor = conn.cursor()
        print("✅ Verbindung erfolgreich!\n")

        # Alle Tabellen holen
        print("Lese Tabellenliste...")
        tables = get_all_tables(cursor)
        print(f"✅ {len(tables)} Tabellen gefunden\n")

        # Markdown-Inhalt generieren
        md_content = []
        md_content.append("\n\n---\n")
        md_content.append("# 📊 DATENBANK-STRUKTUR DOKUMENTATION\n\n")
        md_content.append(f"**Automatisch generiert am:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        md_content.append(f"**Datenbank:** {DATABASE}\n")
        md_content.append(f"**Server:** {SERVER}\n")
        md_content.append(f"**Anzahl Tabellen:** {len(tables)}\n\n")

        md_content.append("---\n\n")
        md_content.append("## 📑 Tabellen-Übersicht\n\n")

        # Inhaltsverzeichnis
        md_content.append("### Inhaltsverzeichnis\n\n")
        for schema, table_name in tables:
            md_content.append(f"- [{schema}.{table_name}](#{schema}{table_name})\n")
        md_content.append("\n---\n\n")

        # Detaillierte Tabellen-Dokumentation
        for idx, (schema, table_name) in enumerate(tables, 1):
            print(f"[{idx}/{len(tables)}] Dokumentiere {schema}.{table_name}...")

            full_table_name = f"{schema}.{table_name}"
            md_content.append(f"## {full_table_name}\n\n")
            md_content.append(f"<a name=\"{schema}{table_name}\"></a>\n\n")

            # Anzahl Zeilen
            row_count = get_row_count(cursor, schema, table_name)
            md_content.append(f"**Anzahl Datensätze:** {row_count:,}\n\n" if isinstance(row_count, int) else f"**Anzahl Datensätze:** {row_count}\n\n")

            # Schema (Spalten)
            schema_info = get_table_schema(cursor, schema, table_name)

            md_content.append("### Spalten-Schema\n\n")
            md_content.append("| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |\n")
            md_content.append("|-------------|----------|------------|--------------|----------|\n")

            for col in schema_info:
                col_name, data_type, max_length, is_nullable, default_val = col
                max_len_str = str(max_length) if max_length else "-"
                nullable_str = "✅" if is_nullable == "YES" else "❌"
                default_str = str(default_val) if default_val else "-"

                md_content.append(f"| `{col_name}` | {data_type} | {max_len_str} | {nullable_str} | {default_str} |\n")

            md_content.append("\n")

            # Beispielzeile
            columns, sample_row = get_sample_row(cursor, schema, table_name)

            md_content.append("### Beispiel-Datensatz\n\n")

            if isinstance(sample_row, str):
                # Fehler beim Abrufen
                md_content.append(f"⚠️ {sample_row}\n\n")
            elif sample_row is None:
                # Tabelle ist leer
                md_content.append("ℹ️ *Keine Daten in dieser Tabelle vorhanden*\n\n")
            else:
                # Beispielzeile als Tabelle darstellen
                md_content.append("| Spalte | Wert |\n")
                md_content.append("|--------|------|\n")

                for col_name, value in zip(columns, sample_row):
                    safe_value = sanitize_value(value)
                    md_content.append(f"| `{col_name}` | {safe_value} |\n")

                md_content.append("\n")

            md_content.append("---\n\n")

        # Verbindung schließen
        cursor.close()
        conn.close()

        # In Datei schreiben
        print(f"\n📝 Schreibe Dokumentation in {KNOWLEDGE_BASE_FILE}...")

        # Bestehende Datei lesen
        try:
            with open(KNOWLEDGE_BASE_FILE, 'r', encoding='utf-8') as f:
                existing_content = f.read()
        except:
            existing_content = ""

        # Prüfe ob bereits eine Datenbank-Dokumentation existiert
        if "# 📊 DATENBANK-STRUKTUR DOKUMENTATION" in existing_content:
            # Entferne alte Dokumentation
            parts = existing_content.split("# 📊 DATENBANK-STRUKTUR DOKUMENTATION")
            existing_content = parts[0].rstrip()

        # Neue Dokumentation anhängen
        full_content = existing_content + ''.join(md_content)

        with open(KNOWLEDGE_BASE_FILE, 'w', encoding='utf-8') as f:
            f.write(full_content)

        print("✅ Dokumentation erfolgreich erstellt!")
        print(f"\n📊 Statistik:")
        print(f"   - {len(tables)} Tabellen dokumentiert")
        print(f"   - Datei: {KNOWLEDGE_BASE_FILE}")
        print(f"\n🎉 Wissensdatenbank wurde erfolgreich erweitert!")

    except pyodbc.Error as e:
        print(f"\n❌ Fehler bei der Verbindung:")
        print(f"   {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unerwarteter Fehler:")
        print(f"   {e}")
        import traceback
        traceback.print_exc()
        return False

    return True

if __name__ == "__main__":
    document_database()
    input("\nDrücke Enter zum Beenden...")
