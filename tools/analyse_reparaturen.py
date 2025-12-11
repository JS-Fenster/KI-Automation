#!/usr/bin/env python3
"""
Reparatur-Analyse - SQL Abfragen fuer Reparatur-Statistiken
============================================================

Analysiert Rechnungen mit REP/EA Notiz und Dienstleistungs-Artikel.
"""
import sys
from pathlib import Path

# Add lib to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.db_connector import get_db
from lib.logger import get_logger

logger = get_logger('reparatur_analyse')


def analyse_rep_rechnungen():
    """Analysiert Rechnungen mit REP oder EA in Notiz."""
    print("\n" + "="*60)
    print("REPARATUR-RECHNUNGEN ANALYSE")
    print("="*60)

    with get_db() as db:
        if not db.is_connected:
            print("FEHLER: Keine Datenbankverbindung!")
            return

        # 1. Rechnungen mit REP/EA in Notiz (letztes Jahr)
        print("\n--- Rechnungen mit 'REP' oder 'EA' in Notiz (letzte 12 Monate) ---")
        query = """
        SELECT COUNT(*) as Anzahl
        FROM dbo.Rechnung r
        WHERE (r.Notiz LIKE '%REP%' OR r.Notiz LIKE '%EA%')
          AND r.Datum >= DATEADD(month, -12, GETDATE())
        """
        results = db.query(query)
        if results:
            row = results[0]
            print(f"Anzahl Rechnungen:    {row[0] or 0}")

        # 2. Monatliche Verteilung - einfach zaehlen
        print("\n--- Monatliche Verteilung (letzte 12 Monate) ---")
        query = """
        SELECT
            FORMAT(r.Datum, 'yyyy-MM') as Monat,
            COUNT(*) as Anzahl
        FROM dbo.Rechnung r
        WHERE (r.Notiz LIKE '%REP%' OR r.Notiz LIKE '%EA%')
          AND r.Datum >= DATEADD(month, -12, GETDATE())
        GROUP BY FORMAT(r.Datum, 'yyyy-MM')
        ORDER BY Monat DESC
        """
        results = db.query(query)
        print(f"{'Monat':<10} {'Anzahl':>8}")
        print("-" * 20)
        for row in results:
            print(f"{row[0]:<10} {row[1]:>8}")

        # 3. Beispiel-Rechnungen anzeigen
        print("\n--- Beispiel REP/EA Rechnungen (letzte 10) ---")
        query = """
        SELECT TOP 10
            r.Nummer,
            r.Datum,
            r.Notiz,
            r.UnserZeichen
        FROM dbo.Rechnung r
        WHERE (r.Notiz LIKE '%REP%' OR r.Notiz LIKE '%EA%')
        ORDER BY r.Datum DESC
        """
        results = db.query(query)
        print(f"{'Nummer':<10} {'Datum':<12} {'Notiz':<30} {'Zeichen':<10}")
        print("-" * 65)
        for row in results:
            datum = str(row[1])[:10] if row[1] else ''
            notiz = (str(row[2] or ''))[:28]
            print(f"{row[0] or '':<10} {datum:<12} {notiz:<30} {row[3] or '':<10}")


def analyse_dienstleistungen():
    """Analysiert Artikel der Gruppe Dienstleistung."""
    print("\n" + "="*60)
    print("DIENSTLEISTUNGS-ARTIKEL")
    print("="*60)

    with get_db() as db:
        if not db.is_connected:
            return

        # Dienstleistungs-Artikel mit Preisen
        query = """
        SELECT
            a.Nummer,
            a.Kurzbezeichnung,
            a.VKPreis,
            a.Einheit,
            g.Bezeichnung as Gruppe
        FROM dbo.Artikel a
        LEFT JOIN dbo.ArtikelGruppen g ON a.GrCode = g.Code
        WHERE g.Bezeichnung LIKE '%Dienst%'
           OR a.Kurzbezeichnung LIKE '%Anfahrt%'
           OR a.Kurzbezeichnung LIKE '%Stunde%'
           OR a.Kurzbezeichnung LIKE '%Monteur%'
           OR a.Kurzbezeichnung LIKE '%Reparatur%'
        ORDER BY a.Kurzbezeichnung
        """
        results = db.query(query)
        print(f"\n{'Nummer':<15} {'Bezeichnung':<40} {'VK':>10} {'Einheit':<6}")
        print("-" * 75)
        for row in results:
            print(f"{row[0] or '':<15} {(row[1] or '')[:38]:<40} {row[2] or 0:>10.2f} {row[3] or '':<6}")


def analyse_mehrfach_anfahrten():
    """Sucht Projekte mit mehreren Anfahrten (mehrere Tage)."""
    print("\n" + "="*60)
    print("PROJEKTE MIT MEHRFACH-ANFAHRTEN (REP)")
    print("="*60)

    with get_db() as db:
        if not db.is_connected:
            return

        # Projekte mit mehreren Rechnungen (verschiedene Tage)
        query = """
        SELECT TOP 20
            p.Nummer as Projekt,
            p.Notiz,
            COUNT(DISTINCT CAST(r.Datum as DATE)) as AnzahlTage,
            COUNT(*) as AnzahlRechnungen
        FROM dbo.Projekt p
        JOIN dbo.Rechnung r ON r.ProjektCode = p.Code
        WHERE (p.Notiz LIKE '%REP%' OR r.Notiz LIKE '%REP%')
          AND r.Datum >= DATEADD(month, -24, GETDATE())
        GROUP BY p.Code, p.Nummer, p.Notiz
        HAVING COUNT(DISTINCT CAST(r.Datum as DATE)) > 1
        ORDER BY AnzahlTage DESC
        """
        results = db.query(query)
        print(f"\n{'Projekt':<15} {'Notiz':<25} {'Tage':>6} {'Rech.':>6}")
        print("-" * 55)
        for row in results:
            notiz = (str(row[1] or ''))[:23]
            print(f"{row[0] or '':<15} {notiz:<25} {row[2]:>6} {row[3]:>6}")


if __name__ == '__main__':
    print("\n" + "#"*60)
    print("# REPARATUR-ANALYSE - JS Fenster & Tueren")
    print("#"*60)

    analyse_rep_rechnungen()
    analyse_dienstleistungen()
    analyse_mehrfach_anfahrten()

    print("\n" + "="*60)
    print("Analyse abgeschlossen.")
