# -*- coding: utf-8 -*-
"""
Reparatur- und Einstellungsauftraege aus SQL Server abfragen
============================================================
Identifiziert Auftraege ueber die Kuerzel "EA" oder "REP" im Notiz-Feld
"""

import pyodbc
import getpass
from datetime import datetime
import sys
import io

# Fix fuer Windows Console Encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Server-Konfiguration
SERVER = "192.168.16.202\\SQLEXPRESS"
DATABASE = "WorkM001"

def connect_to_database():
    """Stellt Verbindung zur Datenbank her"""
    print("\n=== SQL Server Verbindung ===")
    print(f"Server: {SERVER}")
    print(f"Datenbank: {DATABASE}")
    print("-" * 40)

    username = input("Benutzername: ")
    password = getpass.getpass("Passwort: ")

    connection_string = (
        f'DRIVER={{SQL Server}};'
        f'SERVER={SERVER};'
        f'DATABASE={DATABASE};'
        f'UID={username};'
        f'PWD={password}'
    )

    try:
        conn = pyodbc.connect(connection_string, timeout=10)
        print("[OK] Verbindung erfolgreich!")
        return conn
    except Exception as e:
        print(f"[FEHLER] Verbindungsfehler: {e}")
        return None

def abfrage_reparaturauftraege(conn):
    """Ruft alle Reparatur- und Einstellungsauftraege ab"""

    query = """
    SELECT
        p.Code,
        p.Nummer AS Projektnummer,
        p.Name AS Projektname,
        p.Notiz,
        p.Datum AS Erstelldatum,
        p.AnfangDatum,
        p.EndeDatum,
        p.Gesperrt,
        p.ProjektStatus,
        p.Art,
        p.KundenCode,
        p.LetzteAenderung
    FROM dbo.Projekte p
    WHERE
        p.Notiz LIKE '%EA%'
        OR p.Notiz LIKE '%REP%'
    ORDER BY p.Datum DESC
    """

    cursor = conn.cursor()
    cursor.execute(query)

    results = cursor.fetchall()
    columns = [column[0] for column in cursor.description]

    return results, columns

def zeige_statistik(results):
    """Zeigt Statistiken zu den Auftraegen"""

    print("\n" + "=" * 60)
    print("STATISTIK - REPARATUR- UND EINSTELLUNGSAUFTRAEGE")
    print("=" * 60)

    total = len(results)
    print(f"\nGesamtanzahl gefundene Auftraege: {total}")

    # Zaehle EA vs REP
    ea_count = 0
    rep_count = 0
    offen = 0
    abgeschlossen = 0

    for row in results:
        notiz = str(row[3] or "").upper()
        gesperrt = row[7]

        if "EA" in notiz:
            ea_count += 1
        if "REP" in notiz:
            rep_count += 1

        if gesperrt == 1:
            abgeschlossen += 1
        else:
            offen += 1

    print(f"\nNach Typ:")
    print(f"   * EA (Einstellung):  {ea_count}")
    print(f"   * REP (Reparatur):   {rep_count}")

    print(f"\nNach Status:")
    print(f"   * Offen:             {offen}")
    print(f"   * Abgeschlossen:     {abgeschlossen}")

def zeige_auftraege(results, columns, limit=20):
    """Zeigt die Auftraege tabellarisch an"""

    print("\n" + "=" * 60)
    print(f"LETZTE {min(limit, len(results))} AUFTRAEGE")
    print("=" * 60)

    for i, row in enumerate(results[:limit]):
        projektname = str(row[2] or "N/A")[:50]
        notiz = str(row[3] or "N/A")[:80]

        print(f"\n--- Auftrag {i+1} ---")
        print(f"  Projektnummer:   {row[1]}")
        print(f"  Projektname:     {projektname}...")
        print(f"  Notiz:           {notiz}")
        print(f"  Erstelldatum:    {row[4]}")
        print(f"  Anfang:          {row[5]}")
        print(f"  Ende:            {row[6]}")
        print(f"  Status:          {'Abgeschlossen' if row[7] == 1 else 'Offen'}")
        print(f"  KundenCode:      {row[10]}")

def export_als_dict(results, columns):
    """Konvertiert Ergebnisse in Dictionary-Format (fuer n8n/Webhook)"""

    auftraege = []
    for row in results:
        auftrag = {}
        for i, col in enumerate(columns):
            value = row[i]
            # Datetime zu String konvertieren
            if isinstance(value, datetime):
                value = value.isoformat()
            auftrag[col] = value
        auftraege.append(auftrag)

    return auftraege

def main():
    print("\n" + "=" * 60)
    print("REPARATUR- UND EINSTELLUNGSAUFTRAEGE ABFRAGE")
    print("=" * 60)

    # Verbindung herstellen
    conn = connect_to_database()
    if not conn:
        return

    try:
        # Auftraege abfragen
        print("\nFrage Reparaturauftraege ab...")
        results, columns = abfrage_reparaturauftraege(conn)

        # Statistik anzeigen
        zeige_statistik(results)

        # Auftraege anzeigen
        zeige_auftraege(results, columns)

        # Info fuer Automatisierung
        print("\n" + "=" * 60)
        print("INFORMATIONEN FUER AUTOMATISIERUNG")
        print("=" * 60)
        print("""
Die Daten koennen wie folgt fuer n8n/Webhooks genutzt werden:

1. SQL Query fuer n8n Microsoft SQL Node:

   SELECT Code, Nummer, Name, Notiz, Datum,
          AnfangDatum, EndeDatum, Gesperrt,
          KundenCode, ProjektStatus
   FROM dbo.Projekte
   WHERE Notiz LIKE '%EA%' OR Notiz LIKE '%REP%'
   ORDER BY Datum DESC

2. Spalten-Mapping:
   - Code          = Eindeutige Auftrags-ID
   - Nummer        = Lesbare Projektnummer (z.B. P220505)
   - Name          = Projektadresse/Beschreibung
   - Notiz         = Enthaelt EA/REP Kennzeichnung
   - Gesperrt      = 0=offen, 1=abgeschlossen
   - KundenCode    = Verknuepfung zu Kundentabelle

3. Fuer Webhook-Integration:
   - Trigger bei neuen Eintraegen via Polling
   - Oder: Datenbankaenderungen ueberwachen
        """)

    finally:
        conn.close()
        print("\n[OK] Verbindung geschlossen.")

if __name__ == "__main__":
    main()
