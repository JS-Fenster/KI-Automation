# Bestellprozess - IST-Analyse

**Erstellt:** 2025-12-11 | **Quelle:** Gespraech mit Andreas

---

## Prozess-Uebersicht

```
AUFTRAG (aus Anfrageprozess)
│
▼
1. BESTELLUNG ERSTELLEN
├─ Wer: Roland (hauptsaechlich), Jaroslaw, Andreas
├─ W4A: Aus Auftrag generieren
├─ Nacharbeit: Einheiten anpassen, Infos filtern
├─ Schmerzpunkt: Anzahlung wird oft vergessen
│
▼
2. BESTELLUNG VERSENDEN
├─ W4A → E-Mail an Lieferant (Standard)
├─ ODER: Direkt in Hersteller-Portal
│
▼
3. AB ERHALTEN
├─ Per E-Mail (meistens)
├─ Portal: Manuell downloaden → wird oft VERGESSEN!
├─ KRITISCH: Offene ABs werden NICHT getrackt!
│   └─ Keine AB = Wochen/Monate Stillstand
│
▼
4. AB PRUEFEN
├─ Wer: Jaroslaw + Andreas (manuell)
├─ Wie: Ausgedruckt oder PDF
├─ Schmerzpunkt: Zeitaufwaendig, fehleranfaellig
│
▼
5. WARTEN AUF LIEFERUNG
├─ Lieferzeiten: Sehr unterschiedlich
├─ KRITISCH: Abholungen werden nicht getrackt!
│   └─ Info in Outlook vergessen/geloescht/verschoben
│
▼
6. WARENEINGANG
├─ Wer: Mario (vormittags) / Andere (nachmittags)
├─ Eingangslieferschein in W4A (oft fehlerhaft!)
├─ Outlook-Kachel aktualisieren
├─ KEINE Lagerbuchung
│
▼
7. TEILLIEFERUNG?
├─ JA → Kachel bleibt offen (manchmal falsch als "da")
├─ Problem: Montage mit unvollstaendiger Ware
│
▼
MONTAGE (naechster Prozess)
```

---

## Details pro Schritt

### 1. Bestellung erstellen

| Aspekt | IST-Zustand |
|--------|-------------|
| **Wer bestellt** | Roland (hauptsaechlich), Jaroslaw, Andreas |
| **Wann** | Nach Auftrag |
| **Wie** | W4A generiert aus Auftrag |
| **Nacharbeit** | Positionen ueberarbeiten (Einheiten, Infos filtern) |
| **Anzahlung** | Wird oft vergessen anzugeben! |

**Warum Infos filtern:** Nicht alle Auftragsdaten an Lieferant weitergeben um Vergleichbarkeit zu vermeiden.

### 2. Bestellwege

| Weg | Haeufigkeit | Details |
|-----|-------------|---------|
| W4A → E-Mail | Meistens | Standard-Weg |
| Hersteller-Portale | Haeufig | Direkt im Portal bestellen |
| Material-Shops | Fuer Zubehoer | Zusatzkomponenten |

**Portale/Konfiguratoren:**
- Hauptartikel: WoT, my.warema, Kadeco, Komposoft, Trendtueren, Roka, Weru, Sunparadise
- **NEU:** Weru baut Weboberflaeche (ersetzt WoT) mit API-Schnittstelle!
- Zubehoer: Diverse Material-Shops fuer Montage-Zubehoer

### 3. AB erhalten (Auftragsbestaetigung)

| Aspekt | IST-Zustand |
|--------|-------------|
| **Eingang** | Per E-Mail (meistens) |
| **Portal-ABs** | Muessen manuell heruntergeladen werden |
| **Schmerzpunkt** | Wird oft VERGESSEN → Ware wird produziert ohne Kontrolle! |

**KRITISCH - Offene ABs nicht getrackt:**
- Wenn Lieferant keine AB schickt → passiert NICHTS
- Wochen oder Monate Stillstand
- Erst wenn Kunde anruft oder man drueber stolpert

### 4. AB pruefen

| Aspekt | IST-Zustand |
|--------|-------------|
| **Wer prueft** | Jaroslaw + Andreas |
| **Wie** | Manuell, meist ausgedruckt |
| **Neuerung** | Andreas startet mit PDF-Pruefung |
| **Schmerzpunkt** | Zeitaufwaendig, fehleranfaellig |

### 5. Warten auf Lieferung

| Aspekt | IST-Zustand |
|--------|-------------|
| **Lieferzeiten** | Sehr unterschiedlich je nach Produkt/Lieferant |

**KRITISCH - Abholungen nicht getrackt:**
- Info dass abgeholt werden muss wird nicht zuverlaessig notiert
- Outlook-Eintraege versehentlich verschoben/geloescht
- Outlook-Ansicht springt auf naechste Woche → aus dem Blick
- Folge: Ware liegt beim Lieferanten, wird vergessen

### 6. Wareneingang

| Aspekt | IST-Zustand |
|--------|-------------|
| **Wer (vormittags)** | Mario |
| **Wer (nachmittags)** | Jaroslaw, Andreas, oder Monteure (zufaellig im Lager) |
| **Lagerbuchungen** | KEINE |
| **Outlook-Kacheln** | Werden gepflegt (Auftragsstatus) |
| **Warenpruefung** | Sehr schwierig (gut verpackt vom Hersteller) |
| **Transport** | Beschaedigungen moeglich, Ladungssicherung problematisch |

**Mario (5,5h/Tag):**
- 3 Tage Lager (ab 7 Uhr), 2 Tage Buero (ab 8 Uhr)
- Auch Einkaeufer fuer Montagematerial
- Pflegt Excel-Listen fuer Artikel-Import
- Aktuelles Projekt: Inventar ins W4A bringen
- **Abholung:** Mario oder Monteure

**Lieferadresse-Entscheidung:**
- Kleine Menge → Lager
- Grosse Menge → Baustelle

**Material-Shops fuer Zubehoer:**
- Wuerth, Ammon, Foerch

**Eingangslieferschein in W4A:**
| Problem | Auswirkung |
|---------|------------|
| Roland traegt alles ein | Auch wenn nur Teilmenge geliefert |
| Daten fehlerhaft | Datenstruktur unbrauchbar |
| Folge | Kann nicht mit Daten gearbeitet werden |

### 7. Teillieferung

| Problem | Auswirkung |
|---------|------------|
| Kachel bleibt offen | Manchmal falsch als "da" eingetragen |
| Montage mit Teilmenge | Unnoetige Mehranfahrt |

### 8. Reklamationen

| Aspekt | IST-Zustand |
|--------|-------------|
| **Haeufigkeit** | Wenige |
| **Erkennung** | Erst bei MONTAGE festgestellt |
| **Grund** | Warenpruefung bei Eingang schwierig (gut verpackt) |

---

## Erkannte Schmerzpunkte

| # | Schmerzpunkt | Auswirkung | Relevante Ideen |
|---|--------------|------------|-----------------|
| 1 | **Offene ABs nicht getrackt** | Wochen/Monate Stillstand | #36 Beschaffungs-Dashboard |
| 2 | **AB aus Portalen vergessen** | Ware produziert ohne Kontrolle | #56 AB-Abgleich |
| 3 | **Abholungen nicht getrackt** | Ware liegt beim Lieferanten | #36 Beschaffungs-Dashboard |
| 4 | **Outlook-Ansicht unzuverlaessig** | Eintraege verschwinden aus Blick | #36 Beschaffungs-Dashboard |
| 5 | **Eingangslieferschein fehlerhaft** | Daten unbrauchbar | #33 Bestellwesen |
| 6 | **Keine Lagerbuchungen** | Kein Bestandsueberblick | #38 Lagerverwaltung |
| 7 | **Teilmengen falsch eingetragen** | Montage mit unvollstaendiger Ware | #36 Beschaffungs-Dashboard |
| 8 | **Anzahlung wird vergessen** | Cashflow-Problem | #65 Anzahlungsrechnung-Auto |
| 9 | **Keine Lieferwoche angegeben** | Ware zu frueh da | #55 Bestellvorlage |
| 10 | **Lieferadresse nicht geprueft** | Falschlieferungen | #57 Lieferadressen-Logik |
| 11 | **AB manuell geprueft** | Zeitaufwand, fehleranfaellig | #56 AB-Abgleich |

---

## Verbesserungspotential (Ideen-Verknuepfung)

| Phase | Tool-Idee | Verbesserung |
|-------|-----------|--------------|
| Bestellung | #55 Bestellvorlage Pflichtfelder | Lieferwoche + Lieferadresse erzwingen |
| Bestellung | #57 Lieferadressen-Logik | Automatisch richtige Adresse je Artikeltyp |
| Bestellung | #65 Anzahlungsrechnung-Auto | Erinnerung/Automatismus fuer Anzahlung |
| AB-Tracking | #36 Beschaffungs-Dashboard | Ampel-System fuer offene ABs |
| AB-Pruefung | #56 AB-Abgleich automatisch | PDF-Parsing + Vergleich mit Bestellung |
| Wareneingang | #33 Bestellwesen | Korrekte Teilmengen-Buchung |
| Wareneingang | #38 Lagerverwaltung | Echte Lagerbuchungen |

---

## Naechster Prozess

→ **Montageprozess** (wenn Ware vollstaendig da)
