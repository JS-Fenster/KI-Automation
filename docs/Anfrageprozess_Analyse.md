# Anfrageprozess - IST-Analyse

**Erstellt:** 2025-12-11 | **Quelle:** Gespraech mit Andreas

---

## Prozess-Uebersicht

```
EINGANG
│ Telefon ──────────┐
│ E-Mail ───────────┼──► Zettel ODER W4A-Aufgabe
│ Laufkundschaft ───┤
│ Website-Formular ─┘ (→ E-Mail)
│
▼
ERFASSUNG
├─ Kunde pruefen: vorhanden?
│   └─ Nein → Kunde anlegen
│
▼
INFOS KOMPLETT?
├─ JA → Angebot erstellen
├─ NEIN:
│   ├─ Laufkundschaft: In Ausstellung klaeren, sonst Aufmass
│   ├─ Telefon: Daten aufnehmen, wenn komplex → Aufmass
│   └─ E-Mail: Nachfragen (mehrere Mails), wenn komplex → Aufmass
├─ PRODUKT NICHT RECHENBAR:
│   └─ Preisanfrage an Lieferant (Projekt MUSS existieren!)
│
▼
AUFMASS (wenn noetig)
├─ Terminvereinbarung: Telefonat, Ausstellung, oder E-Mail
├─ Wartezeit: 2-3 Wochen
├─ Dauer vor Ort: 10 Min - 3 Stunden
│
▼
ANGEBOT
├─ Erstellung in W4A + Konfiguratoren
├─ Dauer: 10 Min - 4 Stunden
├─ Nachbereitung nach Aufmass: 10 Min - 2 Stunden
│
▼
NACHVERFOLGUNG
├─ Aktuell: Kaum bis gar nicht
│
▼
KUNDE SAGT ZU
├─ SOLL: Auftrag + Projekt erstellen
└─ IST: Manchmal nur Projekt, manchmal direkt Rechnung
```

---

## Details pro Schritt

### 1. Eingangskanaele

| Kanal | Erfassung | Anteil |
|-------|-----------|--------|
| Laufkundschaft (Ausstellung) | Zettel oder W4A-Aufgabe | 40% |
| E-Mail | Bleibt E-Mail oder W4A-Aufgabe | 35% |
| Telefon | Zettel oder W4A-Aufgabe | 20% |
| Website (js-fenster.de/kontakt) | Kommt als E-Mail | 5% |

**W4A-Aufgabe:** Wird von der Person erstellt, die ans Telefon geht.

**Website-Formular (js-fenster.de/kontakt):**
- Anrede (Pflicht)
- Adresse = Bauvorhaben? (Ja/Nein)
- Projekttyp: Neubau / Renovierung / Reparatur
- Produktinteresse: Fenster, Insektenschutz, Innentueren, Terrassenueberdachung, Haustueren, Sonnenschutz, Sonstiges
- Zeitplanung: Wann geplant?
- Datenschutz-Checkbox (Pflicht)

### 2. Erfassung

- **Kunde pruefen:** Existiert bereits in W4A?
- **Neu anlegen:** Falls nicht vorhanden
- **Schmerzpunkt:** Zettelwirtschaft - Infos auf Papier, nicht digital

### 3. Preisanfrage (Sonderfall)

Wenn Produkt nicht rechenbar (kein Standardpreis):
- Preisanfrage an Lieferant erstellen
- **WICHTIG:** Projekt MUSS vorher angelegt werden!
- Grund: W4A "3 Reiter" - ohne Projekt keine Zuordnung zum Kunden
- Sonst: "Sucht man sich einen Wolf"
- E-Mail-Korrespondenz mit Lieferant gehoert auch ins Projekt

### 4. Aufmass

| Aspekt | IST-Zustand |
|--------|-------------|
| **Wer faehrt raus** | Enrico, Jaroslaw, Andreas |
| **Dauer vor Ort** | 10 Min - 3 Stunden (je nach Umfang) |
| **Wartezeit** | 2-3 Wochen |
| **Kapazitaetsengpass** | Ja - zu viele Auftraege, grosse Auftraege, viele Anfragen, viel Verwaltung |

### 5. Angebotserstellung

| Aspekt | IST-Zustand |
|--------|-------------|
| **Tool** | Nur W4A |
| **Dauer** | 10 Min - 4 Stunden |
| **Nachbereitung nach Aufmass** | 10 Min - 2 Stunden |
| **Wissen** | Tiefes Fachwissen noetig fuer korrekte Angebote |

**Wer erstellt Angebote:**
| Person | Geschwindigkeit | Qualitaet |
|--------|-----------------|-----------|
| Roland | Schnell (hauptsaechlich) | Gut |
| Jaroslaw | Laenger | Sehr gut, wenig Korrekturen |
| Enrico | Lange | Unstrukturiert |
| Andreas | Kaum | Sehr gut |

**Konfiguratoren (extern):**
| Konfigurator | Schnittstelle |
|--------------|---------------|
| WoT (Weru Fenster) | XML Drag&Drop ✓ |
| my.warema | Text per Strg+C |
| Kadeco | Text per Strg+C |
| Komposoft | Text per Strg+C |
| Trendtueren | Text per Strg+C |
| Roka | Text per Strg+C |
| Weru Haustueren | Text per Strg+C |
| Sunparadise | Text per Strg+C |

### 6. Nachverfolgung

- **IST:** Sehr wenig bis kaum
- **Wenn:** Nur "Ist das Angebot noch aktuell?"
- **Kein systematisches Follow-up** (2/7/14 Tage Regel fehlt)

### 7. Nach Zusage

| SOLL | IST |
|------|-----|
| Auftrag erstellen | Manchmal nur Projekt |
| Projekt erstellen | Manchmal Angebot → unterschrieben → direkt Rechnung |
| | Auftrag fehlt → Soll-Ist-Vergleich falsch! |

**Anmerkung:** "Arbeiten dran, uns zu verbessern"

---

## Erkannte Schmerzpunkte

| # | Schmerzpunkt | Auswirkung | Relevante Ideen |
|---|--------------|------------|-----------------|
| 1 | **Zettelwirtschaft** | Infos gehen verloren, doppelte Erfassung | #24, #46→#24 |
| 2 | **2-3 Wochen Wartezeit Aufmass** | Kunden springen ab, Unzufriedenheit | #11, #44 |
| 3 | **Tiefes Wissen fuer Angebote** | Nur wenige koennen Angebote erstellen | #6 |
| 4 | **10min-4h Angebotsdauer** | Hoher Zeitaufwand, Kapazitaetsengpass | #6, #1 |
| 5 | **Kaum Nachverfolgung** | Verlorene Auftraege | #23 (inkl. #45) |
| 6 | **Projekt fuer Preisanfrage noetig** | Zusatzaufwand, Fehlerquelle | #32 |
| 7 | **Auftrag fehlt → Soll-Ist falsch** | Falsche Kennzahlen | #17, #32 |
| 8 | **Konfiguratoren nur Copy&Paste** | Fehleranfaellig, Zeitaufwand | #37 |
| 9 | **Kapazitaetsengpass Aufmass** | Lange Wartezeiten | #11, #44 |

---

## Verbesserungspotential (Ideen-Verknuepfung)

| Phase | Tool-Idee | Verbesserung |
|-------|-----------|--------------|
| Eingang | #24 Ticket + Schnell-Erfassung | Digitale Erfassung statt Zettel |
| Eingang | #47 Kunden-Historie | Bestandskunde sofort erkennen |
| Aufmass | #28 Digitales Aufmass + Mobil | Fotos + Masse digital, kein Zettel |
| Aufmass | #11 Terminfindung | Optimierte Terminplanung |
| Angebot | #6 Budget-Angebots-Generator | Schnellere Angebote |
| Angebot | #37 WoT-XML Transformer | Bessere Konfigurator-Integration |
| Nachverfolgung | #23 Verkaufschancen + Reminder | Systematisches Follow-up |
| Nach Zusage | #32 Projektverwaltung | Saubere Auftrag/Projekt-Erstellung |

---

## Naechster Prozess

→ **Bestellprozess** (wenn Kunde zusagt)
