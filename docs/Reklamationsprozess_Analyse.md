# Reklamationsprozess - IST-Analyse

**Erstellt:** 2025-12-11 | **Quelle:** Gespraech mit Andreas

---

## Prozess-Uebersicht

```
PROBLEM ERKANNT
│
├─ Bei Wareneingang (kleine Teile, Stueckmengen)
├─ Bei Montage (grosse Produkte, gut verpackt)
│
▼
1. MELDUNG
├─ Wer: Monteur oder Lagerist
├─ An: Projektleiter oder Susann
│
▼
2. DOKUMENTATION
├─ W4A Ticketsystem (funktioniert gut!)
├─ 1 Ticket pro Sachfall
│
▼
3. LIEFERANTEN-KOMMUNIKATION
├─ Per E-Mail (bevorzugt - immer schriftlich!)
├─ Oder: Hersteller-Portal
│
▼
4. NACHVERFOLGUNG
├─ Wiedervorlage auf Lieferdatum
├─ Pruefen ob Ersatz angekommen
├─ Sonst: Beim Lieferanten nachfragen
│
▼
ERLEDIGT (Ticket schliessen)
```

---

## Details pro Schritt

### 1. Erkennung

| Situation | Wann erkannt | Erkennbar |
|-----------|--------------|-----------|
| Grosse Produkte | Meist erst bei Montage | Gut verpackt vom Hersteller |
| Kleine Bauteile | Bei Wareneingang | Stueckmengen, Beschaedigungen |
| Eindeutige Beschaedigungen | Sofort bei Eingang | Sichtbar |
| Fehlende Teile | Bei Wareneingang oder Montage | Beim Zaehlen/Montieren |

### 2. Meldung

| Aspekt | IST-Zustand |
|--------|-------------|
| **Wer meldet** | Monteur oder Lagerist |
| **An wen** | Projektleiter (Jaroslaw/Andreas) oder Susann |

### 3. Dokumentation

| Aspekt | IST-Zustand |
|--------|-------------|
| **Primaer** | W4A Ticketsystem |
| **Zusaetzlich** | Outlook |
| **Struktur** | 1 Ticket pro Sachfall |
| **Bewertung** | Funktioniert gut! |

**W4A Ticketsystem Features:**
- Kategorien (Reklamationen, Restarbeiten, Reparaturen, etc.)
- WV-Spalte (Wiedervorlage-Datum)
- Prioritaet + Status mit farbigen Punkten
- Detail-Bereich mit Problembeschreibung, Anhaenge, Loesung
- Vorgangs-Verlauf (Kommentare)

### 4. Lieferanten-Kommunikation

| Kanal | Verwendung |
|-------|------------|
| **E-Mail** | Bevorzugt - immer schriftlich! |
| **Portale** | Auch moeglich |
| **Telefon** | Vermeiden - will keiner |

### 5. Nachverfolgung

| Schritt | Ablauf |
|---------|--------|
| 1 | Wiedervorlage auf Lieferdatum setzen |
| 2 | Pruefen ob Ersatz angekommen |
| 3a | Ja → Weitere Schritte / Ticket schliessen |
| 3b | Nein → Beim Lieferanten nachfragen |

**Bewertung:** Geht kaum unter bis gar nicht - Wiedervorlage funktioniert!

### 6. Kulanz-Entscheidungen

| Aspekt | IST-Zustand |
|--------|-------------|
| **Wer entscheidet** | Je nach Fall |
| **Kriterium** | Mehr Umsatz → mehr Kulanz |
| **Eigenverschulden** | Kunde muss zahlen |
| **Aufmass** | Kunden messen in der Regel nicht selbst (nur wir) |

---

## Statistik

| Aspekt | Wert |
|--------|------|
| **Haeufigkeit** | ~1 pro Monat |
| **Trend** | Wenig |

### Reklamationsgruende (nach Haeufigkeit)

| Rang | Grund | Haeufigkeit |
|------|-------|-------------|
| 1 | Fehlende Teile | Meist |
| 2 | Produktionsfehler | Eher |
| 3 | Transportschaden | Wenig |
| 4 | Falsche Masse | Kaum |
| 5 | Falsches Produkt | Kaum |

---

## Erkannte Schmerzpunkte

| # | Schmerzpunkt | Auswirkung | Status |
|---|--------------|------------|--------|
| 1 | Grosse Produkte erst bei Montage erkannt | Verzoegerung, Zusatzfahrt | Schwer vermeidbar (gut verpackt) |
| 2 | - | - | **Prozess funktioniert gut!** |

**Positiv:** Das W4A Ticketsystem mit Wiedervorlage funktioniert sehr gut fuer Reklamationen. Dieses Muster koennte fuer andere Bereiche (Restarbeiten, Montage) als Vorbild dienen - mit grafischer Oberflaeche.

---

## Verknuepfung zu anderen Prozessen

| Prozess | Verknuepfung |
|---------|--------------|
| **Bestellprozess** | Reklamation fuehrt zu Nachbestellung |
| **Montageprozess** | Reklamation erkannt → Restarbeit oder Terminverschiebung |
| **Rechnungsprozess** | Reklamation kann Rechnungsstellung verzoegern |

---

## Verbesserungspotential

| Aspekt | Idee |
|--------|------|
| Grafische Uebersicht | #43 Kanban-Dashboard fuer alle Ticket-Kategorien |
| Fruehe Erkennung | Schwierig - Hersteller verpacken gut |

---

## Naechster Prozess

→ **Bestellprozess** (bei Nachbestellung)
→ **Montageprozess** (bei Ersatzlieferung)
