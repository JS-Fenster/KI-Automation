# ERP Datenbank (WorkM001)

**CLAUDE:** Vor SQL-Queries "Spalten-Korrekturen" pruefen! Bei DB-Fehlern: Tabelle erweitern + Changelog updaten.

**Server:** `192.168.16.202\SQLEXPRESS` | **DB:** `WorkM001` | **Port:** 1433
**Credentials:** `lib/config/credentials.yaml` (SA-User)
**Python-Lib:** `lib/db_connector.py` (get_db Context Manager)

---

## Spalten-Korrekturen (WICHTIG!)

| Tabelle | FALSCH | RICHTIG | Hinweis |
|---------|--------|---------|---------|
| `dbo.Artikel` | `Kurzbezeichnung` | `Name` | Artikelbezeichnung |
| `dbo.Artikel` | `VKPreis` | `Nettopreis` | Basis-Verkaufspreis |
| `dbo.Artikel` | `Einheit` | `EinheitCode` | FK zu Einheiten |
| - | `ArtikelGruppen` | `ArtikelGr` | Tabellenname |
| `dbo.Rechnung` | `Storno` | - | EXISTIERT NICHT |
| `dbo.Rechnung` | `Summe` | - | EXISTIERT NICHT (ueber RA berechnen) |

---

## Preisgruppen (dbo.Preisgruppen)

| Code | Name | Hinweis |
|------|------|---------|
| 0 | Neukunde | Nutzt vermutlich Artikel.Nettopreis |
| 1 | Bestandskunde | Nutzt vermutlich Artikel.Nettopreis |
| 2 | Grosskunde | Nutzt vermutlich Artikel.Nettopreis |
| 4 | Wiederverkaeufer | **NUR DIESE hat Eintraege in dbo.Preise!** |

---

## Service-Artikel (99-*)

| Artikel-Nr | Bezeichnung | Preis (WVK) |
|------------|-------------|-------------|
| 99-000001 bis 99-000020 | Anfahrt Zone 01-20 | 13,44 - 268,90 EUR (~13,44 EUR/10km) |
| 99-000023 | Reparatur (Stunde) | 50,42 EUR/h |
| 99-000033 | Autokran (Stunde) | 350 EUR/h |
| 99-000040 | Minikran (Stunde) | 480 EUR/h |

---

## Wichtige Queries

```sql
-- REP/EA Rechnungen (letzte 12 Monate)
SELECT r.Nummer, r.Datum, r.Notiz FROM dbo.Rechnung r
WHERE (r.Notiz LIKE '%REP%' OR r.Notiz LIKE '%EA%')
  AND r.Datum >= DATEADD(month, -12, GETDATE())
ORDER BY r.Datum DESC

-- Artikel mit Preisen (Wiederverkaeufer)
SELECT a.Nummer, a.Name, a.Nettopreis, pg.Name, p.Preis
FROM dbo.Artikel a
LEFT JOIN dbo.Preise p ON p.ArtikelCode = a.Code
LEFT JOIN dbo.Preisgruppen pg ON p.Preisgruppe = pg.Code
WHERE a.Name LIKE '%Anfahrt%'
ORDER BY a.Name

-- Alle Tabellen auflisten
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME

-- Spalten einer Tabelle
SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Artikel'
```

---

## Python-Verbindung

```python
from lib.db_connector import get_db

with get_db() as db:
    results = db.query("SELECT TOP 10 * FROM dbo.Artikel")
    for row in results:
        print(row)
```

---

## Changelog

| Datum | Aenderung |
|-------|-----------|
| 2025-12-10 | Verdichtet zu ERP_Datenbank.md, Spalten-Korrekturen |
| 2025-12-08 | Cloudflare Tunnel eingerichtet, Remote-Test erfolgreich |
| 2025-12-05 | Initial |

---

## Remote-Zugriff: Cloudflare Tunnel

**Status:** AKTIV | **Domain:** `js-fenster-intern.org` | **Getestet:** 2025-12-08

### Zugaenge

| Dienst | Hostname | Lokaler Port |
|--------|----------|--------------|
| RDP | `rdp.js-fenster-intern.org` | 3389 |
| SQL | `sql.js-fenster-intern.org` | 1433 |

### Client-Verbindung

```bash
# 1. cloudflared installieren (einmalig)
winget install Cloudflare.cloudflared  # Windows
brew install cloudflared                # macOS

# 2. Tunnel starten
cloudflared access tcp --hostname sql.js-fenster-intern.org --url localhost:1433

# 3. SSMS/Python mit localhost:1433 verbinden (NICHT 192.168.16.202!)
```

### Tunnel-Konfiguration

| Info | Wert |
|------|------|
| Tunnel-Name | `js-fenster-server` |
| Connector-ID | `6a2282b1-c557-493c-85e9-d863563d018f` |
| cloudflared Version | 2025.11.1 |
| Installiert auf | SQL Server (192.168.16.202) als Windows Service |
| Cloudflare Account | info@js-fenster.de |

### Architektur

```
Lokales Netz (192.168.16.0/24)
  └─ SQL Server (192.168.16.202)
       ├─ SQL Express Port 1433 (unveraendert)
       ├─ IIS Port 80 (Programmierer - NICHT ANFASSEN!)
       ├─ RDP Port 3389 (unveraendert)
       └─ cloudflared.exe (Windows Service, ausgehende Verbindung)
            │
            ▼ (ausgehend, keine Ports geoeffnet!)
       Cloudflare
         ├─ rdp.js-fenster-intern.org → localhost:3389
         └─ sql.js-fenster-intern.org → localhost:1433
            │
            ▼
       Remote-Clients (Andreas, Marco)
```

### Troubleshooting

| Problem | Loesung |
|---------|---------|
| Verbindung schlaegt fehl | Cloudflare Dashboard pruefen: Tunnel Status = "Connected"? |
| SQL-Auth fehlschlaegt | Bei Tunnel `localhost` verwenden, nicht `192.168.16.202` |
| cloudflared nicht erkannt | Terminal neu oeffnen nach Installation |

### Links

- Cloudflare Dashboard: https://one.dash.cloudflare.com/
- Tunnel-Verwaltung: Networks > Tunnels > js-fenster-server

---

# DATENBANK-STRUKTUR DOKUMENTATION

**Automatisch generiert am:** 2025-12-05 10:19:00
**Datenbank:** WorkM001
**Server:** 192.168.16.202\SQLEXPRESS
**Anzahl Tabellen:** 433

---

## Tabellen-Uebersicht

### Inhaltsverzeichnis

# DATENBANK-STRUKTUR DOKUMENTATION

**Automatisch generiert am:** 2025-12-05 10:19:00
**Datenbank:** WorkM001
**Server:** 192.168.16.202\SQLEXPRESS
**Anzahl Tabellen:** 433

---

## 📑 Tabellen-Übersicht

### Inhaltsverzeichnis

- [dbo.Abschluss](#dboAbschluss)
- [dbo.AbschlussDetails](#dboAbschlussDetails)
- [dbo.AbschlussDetailsNachLagerort](#dboAbschlussDetailsNachLagerort)
- [dbo.Abteilung](#dboAbteilung)
- [dbo.Agent](#dboAgent)
- [dbo.Alias2](#dboAlias2)
- [dbo.Angebot](#dboAngebot)
- [dbo.AngeboteGr](#dboAngeboteGr)
- [dbo.Anrede](#dboAnrede)
- [dbo.AnredeAlternativ](#dboAnredeAlternativ)
- [dbo.AppointmentInvite](#dboAppointmentInvite)
- [dbo.ApprovalEvents](#dboApprovalEvents)
- [dbo.ArchivPDF](#dboArchivPDF)
- [dbo.Artikel](#dboArtikel)
- [dbo.Artikel_GeoIngenieure](#dboArtikel_GeoIngenieure)
- [dbo.Artikel_Messebau](#dboArtikel_Messebau)
- [dbo.ArtikelBenutzer](#dboArtikelBenutzer)
- [dbo.ArtikelBilder](#dboArtikelBilder)
- [dbo.ArtikelBuchungen](#dboArtikelBuchungen)
- [dbo.ArtikelGr](#dboArtikelGr)
- [dbo.ArtikelGrMark](#dboArtikelGrMark)
- [dbo.ArtikelGroessen](#dboArtikelGroessen)
- [dbo.ArtikelGroessenDefinitionen](#dboArtikelGroessenDefinitionen)
- [dbo.ArtikelGroessenName](#dboArtikelGroessenName)
- [dbo.ArtikelKategorien](#dboArtikelKategorien)
- [dbo.ArtikelKategorienMark](#dboArtikelKategorienMark)
- [dbo.ArtikelKategorienMarkReversed](#dboArtikelKategorienMarkReversed)
- [dbo.ArtikelKontenZuordnung](#dboArtikelKontenZuordnung)
- [dbo.ArtikelListeFilter](#dboArtikelListeFilter)
- [dbo.ArtikelMark](#dboArtikelMark)
- [dbo.ArtikelMonatsabschlüsse](#dboArtikelMonatsabschlüsse)
- [dbo.ArtikelQMDokumentZuordnungen](#dboArtikelQMDokumentZuordnungen)
- [dbo.ArtikelRelation](#dboArtikelRelation)
- [dbo.Aufmasse](#dboAufmasse)
- [dbo.Auftrag](#dboAuftrag)
- [dbo.Auftragshistorie](#dboAuftragshistorie)
- [dbo.Auftragsstatus](#dboAuftragsstatus)
- [dbo.BankAccounts](#dboBankAccounts)
- [dbo.Bankverbindung](#dboBankverbindung)
- [dbo.Barkasse](#dboBarkasse)
- [dbo.BarkassenBeleg](#dboBarkassenBeleg)
- [dbo.BarkassenSaldo](#dboBarkassenSaldo)
- [dbo.Bedarf](#dboBedarf)
- [dbo.Benachrichtigungen](#dboBenachrichtigungen)
- [dbo.BenachrichtigungenBenutzerMark](#dboBenachrichtigungenBenutzerMark)
- [dbo.Beschart](#dboBeschart)
- [dbo.Bestandspflege](#dboBestandspflege)
- [dbo.Bestellung](#dboBestellung)
- [dbo.Beziehungen](#dboBeziehungen)
- [dbo.Bilder](#dboBilder)
- [dbo.BilderLookUp](#dboBilderLookUp)
- [dbo.Briefe](#dboBriefe)
- [dbo.BriefeGr](#dboBriefeGr)
- [dbo.BriefFormulare](#dboBriefFormulare)
- [dbo.BriefFormulareEigene](#dboBriefFormulareEigene)
- [dbo.BriefFormulareFelder](#dboBriefFormulareFelder)
- [dbo.BuchenMark](#dboBuchenMark)
- [dbo.Chargen](#dboChargen)
- [dbo.ChargenEingänge](#dboChargenEingänge)
- [dbo.Chargenreservierung](#dboChargenreservierung)
- [dbo.Checkliste](#dboCheckliste)
- [dbo.ChecklistePositionen](#dboChecklistePositionen)
- [dbo.CompanyListFilter](#dboCompanyListFilter)
- [dbo.ControllingDefinition](#dboControllingDefinition)
- [dbo.ControllingDefinitionDetails](#dboControllingDefinitionDetails)
- [dbo.ControllingWerte](#dboControllingWerte)
- [dbo.ConvertedFiles](#dboConvertedFiles)
- [dbo.CustomEmojis](#dboCustomEmojis)
- [dbo.Dateien](#dboDateien)
- [dbo.DatevExportProtokoll](#dboDatevExportProtokoll)
- [dbo.DhlSendung](#dboDhlSendung)
- [dbo.DmsVolltext](#dboDmsVolltext)
- [dbo.DocumentClasses](#dboDocumentClasses)
- [dbo.Dokumente](#dboDokumente)
- [dbo.DokumenteGr](#dboDokumenteGr)
- [dbo.DpdSendungen](#dboDpdSendungen)
- [dbo.Druckdefinitionen](#dboDruckdefinitionen)
- [dbo.DTA](#dboDTA)
- [dbo.DTAMark](#dboDTAMark)
- [dbo.EditorBild](#dboEditorBild)
- [dbo.Eingangslieferschein](#dboEingangslieferschein)
- [dbo.Einheit](#dboEinheit)
- [dbo.EKPreise](#dboEKPreise)
- [dbo.EMailSignaturen](#dboEMailSignaturen)
- [dbo.EmailVorlagen](#dboEmailVorlagen)
- [dbo.EmailVorlagen2](#dboEmailVorlagen2)
- [dbo.EmailVorlagen2Anhang](#dboEmailVorlagen2Anhang)
- [dbo.EMailVorlagen3](#dboEMailVorlagen3)
- [dbo.EMailVorlagen3Anhang](#dboEMailVorlagen3Anhang)
- [dbo.EMailVorlagenGruppen](#dboEMailVorlagenGruppen)
- [dbo.EntitySchema](#dboEntitySchema)
- [dbo.EntitySchema2](#dboEntitySchema2)
- [dbo.ERPAnhänge](#dboERPAnhänge)
- [dbo.Etikettendruck](#dboEtikettendruck)
- [dbo.Events](#dboEvents)
- [dbo.Favoriten](#dboFavoriten)
- [dbo.Feiertage](#dboFeiertage)
- [dbo.FileContentCatalogue](#dboFileContentCatalogue)
- [dbo.FileLink](#dboFileLink)
- [dbo.Folders](#dboFolders)
- [dbo.Forecast](#dboForecast)
- [dbo.ForecastFilter](#dboForecastFilter)
- [dbo.ForecastSoll](#dboForecastSoll)
- [dbo.ForecastSollMonate](#dboForecastSollMonate)
- [dbo.FreigabeBZObject](#dboFreigabeBZObject)
- [dbo.Gerätethemen](#dboGerätethemen)
- [dbo.GerätethemenMark](#dboGerätethemenMark)
- [dbo.Gesprächspunkte](#dboGesprächspunkte)
- [dbo.GestarteteArbeit](#dboGestarteteArbeit)
- [dbo.Hallen](#dboHallen)
- [dbo.HallenBelegung](#dboHallenBelegung)
- [dbo.Historie](#dboHistorie)
- [dbo.Historie2](#dboHistorie2)
- [dbo.Historie2Item](#dboHistorie2Item)
- [dbo.IncomingMailBlockedSender](#dboIncomingMailBlockedSender)
- [dbo.IndividualFields](#dboIndividualFields)
- [dbo.IndividualFieldsAnzeige](#dboIndividualFieldsAnzeige)
- [dbo.IndividualFieldValues](#dboIndividualFieldValues)
- [dbo.IndividualPageRights](#dboIndividualPageRights)
- [dbo.IndividualPages](#dboIndividualPages)
- [dbo.Infoblätter](#dboInfoblätter)
- [dbo.InfoblätterZuordnung](#dboInfoblätterZuordnung)
- [dbo.InlineReport](#dboInlineReport)
- [dbo.Insights](#dboInsights)
- [dbo.Inventar](#dboInventar)
- [dbo.InventarGr](#dboInventarGr)
- [dbo.InventurData](#dboInventurData)
- [dbo.Inventuren](#dboInventuren)
- [dbo.InventurGr](#dboInventurGr)
- [dbo.Kalkulation](#dboKalkulation)
- [dbo.KAnsprechp](#dboKAnsprechp)
- [dbo.Kasse](#dboKasse)
- [dbo.KasseEinAuszahlung](#dboKasseEinAuszahlung)
- [dbo.Kassenabschluss](#dboKassenabschluss)
- [dbo.KassenabschlussDetails](#dboKassenabschlussDetails)
- [dbo.KassenBelege](#dboKassenBelege)
- [dbo.KassenBerechtigung](#dboKassenBerechtigung)
- [dbo.KassenBuchungen](#dboKassenBuchungen)
- [dbo.KassenFreigabe](#dboKassenFreigabe)
- [dbo.KassenSaldo](#dboKassenSaldo)
- [dbo.KKartei](#dboKKartei)
- [dbo.Kontaktbericht](#dboKontaktbericht)
- [dbo.KontaktberichtAnhang](#dboKontaktberichtAnhang)
- [dbo.KontaktberichtKundenMark](#dboKontaktberichtKundenMark)
- [dbo.Kontenbereiche](#dboKontenbereiche)
- [dbo.Kontokorrent](#dboKontokorrent)
- [dbo.Kostenerfassung](#dboKostenerfassung)
- [dbo.KostenerfassungTemp](#dboKostenerfassungTemp)
- [dbo.Kostenst](#dboKostenst)
- [dbo.Krankheit](#dboKrankheit)
- [dbo.Kunden](#dboKunden)
- [dbo.KundenGr](#dboKundenGr)
- [dbo.KundenGrMark](#dboKundenGrMark)
- [dbo.KundenMark](#dboKundenMark)
- [dbo.Kurse](#dboKurse)
- [dbo.KursImportLogs](#dboKursImportLogs)
- [dbo.Lagerinventur](#dboLagerinventur)
- [dbo.LagerinventurMark](#dboLagerinventurMark)
- [dbo.Lagerort](#dboLagerort)
- [dbo.Länder](#dboLänder)
- [dbo.Langtexte](#dboLangtexte)
- [dbo.LAnsprechp](#dboLAnsprechp)
- [dbo.Laufkalender](#dboLaufkalender)
- [dbo.Layout](#dboLayout)
- [dbo.LayoutMapping](#dboLayoutMapping)
- [dbo.Lieferanten](#dboLieferanten)
- [dbo.LieferantenBedarfZuordnung](#dboLieferantenBedarfZuordnung)
- [dbo.Lieferantenbewertung](#dboLieferantenbewertung)
- [dbo.LieferantenGr](#dboLieferantenGr)
- [dbo.LieferantenGrMark](#dboLieferantenGrMark)
- [dbo.LieferantenMark](#dboLieferantenMark)
- [dbo.Lieferschein](#dboLieferschein)
- [dbo.Lieferungsart](#dboLieferungsart)
- [dbo.LockedSdObjects](#dboLockedSdObjects)
- [dbo.Lohnarten](#dboLohnarten)
- [dbo.LookUp](#dboLookUp)
- [dbo.Löschvorgänge](#dboLöschvorgänge)
- [dbo.Mahnlauf](#dboMahnlauf)
- [dbo.MahnlaufMark](#dboMahnlaufMark)
- [dbo.Mahnungen](#dboMahnungen)
- [dbo.Mahnwesen](#dboMahnwesen)
- [dbo.MailAnhang](#dboMailAnhang)
- [dbo.MailCC](#dboMailCC)
- [dbo.Material](#dboMaterial)
- [dbo.Mehrwertsteuersätze](#dboMehrwertsteuersätze)
- [dbo.Mentions](#dboMentions)
- [dbo.Mitarbeiter](#dboMitarbeiter)
- [dbo.MitarbeiterGr](#dboMitarbeiterGr)
- [dbo.MitarbeiterMark](#dboMitarbeiterMark)
- [dbo.Monatssoll](#dboMonatssoll)
- [dbo.MussFelder](#dboMussFelder)
- [dbo.Muster](#dboMuster)
- [dbo.Neukunden](#dboNeukunden)
- [dbo.NotificationHandled](#dboNotificationHandled)
- [dbo.NotificationsRead](#dboNotificationsRead)
- [dbo.Notizen](#dboNotizen)
- [dbo.NotizenAnhang](#dboNotizenAnhang)
- [dbo.NotizHistorie](#dboNotizHistorie)
- [dbo.NummernHistorie](#dboNummernHistorie)
- [dbo.NummernKreise](#dboNummernKreise)
- [dbo.ObjectLock](#dboObjectLock)
- [dbo.ObjektBegriffe](#dboObjektBegriffe)
- [dbo.ObjektDateiZugriff](#dboObjektDateiZugriff)
- [dbo.Objekte](#dboObjekte)
- [dbo.ObjekteDetails](#dboObjekteDetails)
- [dbo.ObjekteGr](#dboObjekteGr)
- [dbo.ObjekteHistorie](#dboObjekteHistorie)
- [dbo.ObjekteParent](#dboObjekteParent)
- [dbo.ObjGrBZObject](#dboObjGrBZObject)
- [dbo.ObjGrItems](#dboObjGrItems)
- [dbo.OciWebShop](#dboOciWebShop)
- [dbo.OciWebShopRequest](#dboOciWebShopRequest)
- [dbo.OnlineBankingBooked](#dboOnlineBankingBooked)
- [dbo.OperationLog](#dboOperationLog)
- [dbo.OutlookAdressen](#dboOutlookAdressen)
- [dbo.PAN](#dboPAN)
- [dbo.PlugInRechte](#dboPlugInRechte)
- [dbo.PositionConversionHistory](#dboPositionConversionHistory)
- [dbo.Positionen](#dboPositionen)
- [dbo.PositionenBilder](#dboPositionenBilder)
- [dbo.PositionenExport](#dboPositionenExport)
- [dbo.PositionenFertigmeldung](#dboPositionenFertigmeldung)
- [dbo.PostIt](#dboPostIt)
- [dbo.Preise](#dboPreise)
- [dbo.PreiseHistorie](#dboPreiseHistorie)
- [dbo.PreiseHistorieAktion](#dboPreiseHistorieAktion)
- [dbo.Preisgruppen](#dboPreisgruppen)
- [dbo.PreisgruppenKalkulation](#dboPreisgruppenKalkulation)
- [dbo.PreisgruppenKalkulationZuordnung](#dboPreisgruppenKalkulationZuordnung)
- [dbo.Preisstaffel](#dboPreisstaffel)
- [dbo.Preisstaffeldefinition](#dboPreisstaffeldefinition)
- [dbo.PreisstaffelEinstände](#dboPreisstaffelEinstände)
- [dbo.Produktionsauftrag](#dboProduktionsauftrag)
- [dbo.ProduktionsauftragGr](#dboProduktionsauftragGr)
- [dbo.ProduktionsauftragMark](#dboProduktionsauftragMark)
- [dbo.ProduktionsauftragsPositionen](#dboProduktionsauftragsPositionen)
- [dbo.Produktionsprotokoll](#dboProduktionsprotokoll)
- [dbo.ProjectAccessGroup](#dboProjectAccessGroup)
- [dbo.ProjectAccessGroupProject](#dboProjectAccessGroupProject)
- [dbo.ProjectAccessGroupUser](#dboProjectAccessGroupUser)
- [dbo.ProjectAccessRights](#dboProjectAccessRights)
- [dbo.ProjectDirectories](#dboProjectDirectories)
- [dbo.Projektbewertung](#dboProjektbewertung)
- [dbo.Projekte](#dboProjekte)
- [dbo.ProjekteErgebnisMark](#dboProjekteErgebnisMark)
- [dbo.ProjekteGr](#dboProjekteGr)
- [dbo.ProjekteGrMark](#dboProjekteGrMark)
- [dbo.ProjekteKostenplan](#dboProjekteKostenplan)
- [dbo.ProjekteKSchema](#dboProjekteKSchema)
- [dbo.ProjekteKSchemaNamen](#dboProjekteKSchemaNamen)
- [dbo.ProjekteMark](#dboProjekteMark)
- [dbo.ProjektePlanung](#dboProjektePlanung)
- [dbo.ProjektePlanungLinks](#dboProjektePlanungLinks)
- [dbo.ProjektePlanungMitarbeiter](#dboProjektePlanungMitarbeiter)
- [dbo.ProjektePlanungMitarbeiterDetail](#dboProjektePlanungMitarbeiterDetail)
- [dbo.ProjektePlanungRückmeldung](#dboProjektePlanungRückmeldung)
- [dbo.ProjektePlanungVorlagen](#dboProjektePlanungVorlagen)
- [dbo.ProjektePlanungVorlagenVorgänge](#dboProjektePlanungVorlagenVorgänge)
- [dbo.ProjekteVerknüpfung](#dboProjekteVerknüpfung)
- [dbo.ProjekteVerteiler](#dboProjekteVerteiler)
- [dbo.ProjekteVerteilernamen](#dboProjekteVerteilernamen)
- [dbo.ProjekteZahlung](#dboProjekteZahlung)
- [dbo.Projektkostensätze](#dboProjektkostensätze)
- [dbo.ProjektMaterial](#dboProjektMaterial)
- [dbo.ProvisionsBerechnung](#dboProvisionsBerechnung)
- [dbo.Provisionssätze](#dboProvisionssätze)
- [dbo.Prüfauftrag](#dboPrüfauftrag)
- [dbo.PrüfauftragGr](#dboPrüfauftragGr)
- [dbo.Prüfschritt](#dboPrüfschritt)
- [dbo.Prüfvorgang](#dboPrüfvorgang)
- [dbo.QMDokumente](#dboQMDokumente)
- [dbo.QMDokumenteGr](#dboQMDokumenteGr)
- [dbo.QMProtokolle](#dboQMProtokolle)
- [dbo.QMProtokolleGr](#dboQMProtokolleGr)
- [dbo.RA](#dboRA)
- [dbo.Rabattdefinitionen](#dboRabattdefinitionen)
- [dbo.Rabattgr](#dboRabattgr)
- [dbo.Rabattwerte](#dboRabattwerte)
- [dbo.RabattZuordnung](#dboRabattZuordnung)
- [dbo.RABezSumme](#dboRABezSumme)
- [dbo.RAErlöskontenSplit](#dboRAErlöskontenSplit)
- [dbo.RAMwst](#dboRAMwst)
- [dbo.RAStornSumme](#dboRAStornSumme)
- [dbo.RE](#dboRE)
- [dbo.Reactions](#dboReactions)
- [dbo.REBestellung](#dboREBestellung)
- [dbo.REBezSumme](#dboREBezSumme)
- [dbo.Rechnung](#dboRechnung)
- [dbo.RecycleBin](#dboRecycleBin)
- [dbo.RefreshLockedSdObjectsLogs](#dboRefreshLockedSdObjectsLogs)
- [dbo.REImport](#dboREImport)
- [dbo.Reisekostenabrechnung](#dboReisekostenabrechnung)
- [dbo.ReisekostenabrechnungBeleg](#dboReisekostenabrechnungBeleg)
- [dbo.ReisekostenabrechnungVerpflegungsmehraufwand](#dboReisekostenabrechnungVerpflegungsmehraufwand)
- [dbo.ReisekostenBelegarten](#dboReisekostenBelegarten)
- [dbo.ReisekostenBelegartenFahrtkosten](#dboReisekostenBelegartenFahrtkosten)
- [dbo.ReisekostenZahlungsarten](#dboReisekostenZahlungsarten)
- [dbo.REMuster](#dboREMuster)
- [dbo.ReportAnzahlKopien](#dboReportAnzahlKopien)
- [dbo.Reports2](#dboReports2)
- [dbo.REProjektkostenSplit](#dboREProjektkostenSplit)
- [dbo.RESachkontenSplit](#dboRESachkontenSplit)
- [dbo.RESachkontenSplitMuster](#dboRESachkontenSplitMuster)
- [dbo.Reservierungen](#dboReservierungen)
- [dbo.REStornSumme](#dboREStornSumme)
- [dbo.Rücknahme](#dboRücknahme)
- [dbo.Sachkonten](#dboSachkonten)
- [dbo.SachkontoBanking](#dboSachkontoBanking)
- [dbo.SalesOpportunityAttachements](#dboSalesOpportunityAttachements)
- [dbo.SalesOpportunityRatingTemplate](#dboSalesOpportunityRatingTemplate)
- [dbo.Sammelmappe](#dboSammelmappe)
- [dbo.SavedListFilter](#dboSavedListFilter)
- [dbo.SaveSendMailJob](#dboSaveSendMailJob)
- [dbo.Schriftarten](#dboSchriftarten)
- [dbo.Selektionen](#dboSelektionen)
- [dbo.Serienbriefdaten](#dboSerienbriefdaten)
- [dbo.Serienbriefe](#dboSerienbriefe)
- [dbo.SeriennummerAnhänge](#dboSeriennummerAnhänge)
- [dbo.Seriennummerverwaltung](#dboSeriennummerverwaltung)
- [dbo.SeriennummerverwaltungHistorie](#dboSeriennummerverwaltungHistorie)
- [dbo.ServerManager](#dboServerManager)
- [dbo.ServerManagerActions](#dboServerManagerActions)
- [dbo.ShadowCopyBzObject](#dboShadowCopyBzObject)
- [dbo.ShadowRE](#dboShadowRE)
- [dbo.ShadowServiceContract](#dboShadowServiceContract)
- [dbo.ShopAnsichtGruppen](#dboShopAnsichtGruppen)
- [dbo.ShopAnsichtRechte](#dboShopAnsichtRechte)
- [dbo.SLModes](#dboSLModes)
- [dbo.SpaltenDefinition](#dboSpaltenDefinition)
- [dbo.SperrungArtikelbuchungen](#dboSperrungArtikelbuchungen)
- [dbo.Sperrzeiten](#dboSperrzeiten)
- [dbo.Staffelpreise](#dboStaffelpreise)
- [dbo.Staffelpreise_EK](#dboStaffelpreise_EK)
- [dbo.StaffelpreisZuschläge](#dboStaffelpreisZuschläge)
- [dbo.Stammdatenmuster](#dboStammdatenmuster)
- [dbo.StammdatenSprachen](#dboStammdatenSprachen)
- [dbo.Standardartikel](#dboStandardartikel)
- [dbo.Standardtexte](#dboStandardtexte)
- [dbo.Standorte](#dboStandorte)
- [dbo.StandorteEntfernung](#dboStandorteEntfernung)
- [dbo.Steuergruppen](#dboSteuergruppen)
- [dbo.Steuerschlüssel](#dboSteuerschlüssel)
- [dbo.Stopwatch](#dboStopwatch)
- [dbo.Stückliste](#dboStückliste)
- [dbo.Stücklistenauflösung](#dboStücklistenauflösung)
- [dbo.Support](#dboSupport)
- [dbo.SupportAnhang](#dboSupportAnhang)
- [dbo.SupportArtikel](#dboSupportArtikel)
- [dbo.SupportChecklistenpunktMark](#dboSupportChecklistenpunktMark)
- [dbo.SupportClasses](#dboSupportClasses)
- [dbo.SupportKategorien](#dboSupportKategorien)
- [dbo.SupportMark](#dboSupportMark)
- [dbo.SupportPositionen](#dboSupportPositionen)
- [dbo.SupportSupporter](#dboSupportSupporter)
- [dbo.TapiCalls](#dboTapiCalls)
- [dbo.Teilnehmer](#dboTeilnehmer)
- [dbo.Teilrechnungslogik](#dboTeilrechnungslogik)
- [dbo.TeilrechnungslogikDetails](#dboTeilrechnungslogikDetails)
- [dbo.Telefonate](#dboTelefonate)
- [dbo.TelefonateAnhang](#dboTelefonateAnhang)
- [dbo.TelefonatHistorie](#dboTelefonatHistorie)
- [dbo.TempDatei](#dboTempDatei)
- [dbo.Termine](#dboTermine)
- [dbo.Termine_BAK20221012](#dboTermine_BAK20221012)
- [dbo.TermineAnhang](#dboTermineAnhang)
- [dbo.TermineFarben](#dboTermineFarben)
- [dbo.TermineTeilnehmer](#dboTermineTeilnehmer)
- [dbo.TerminHistorie](#dboTerminHistorie)
- [dbo.Textbausteine](#dboTextbausteine)
- [dbo.TextbausteineGr](#dboTextbausteineGr)
- [dbo.TextbausteineMark](#dboTextbausteineMark)
- [dbo.TextbausteineÜbersetzung](#dboTextbausteineÜbersetzung)
- [dbo.Textvorgaben](#dboTextvorgaben)
- [dbo.ThemenGr](#dboThemenGr)
- [dbo.ThemenGrMark](#dboThemenGrMark)
- [dbo.ThemenMark](#dboThemenMark)
- [dbo.Thumbnails](#dboThumbnails)
- [dbo.TicketFilter](#dboTicketFilter)
- [dbo.TicketListeFilter](#dboTicketListeFilter)
- [dbo.Tour](#dboTour)
- [dbo.UeberstundenAuszahlung](#dboUeberstundenAuszahlung)
- [dbo.UeberstundenUebertrag](#dboUeberstundenUebertrag)
- [dbo.Umbuchungen](#dboUmbuchungen)
- [dbo.UmsatzKostenplanHeader](#dboUmsatzKostenplanHeader)
- [dbo.Umsatzplan](#dboUmsatzplan)
- [dbo.UnreadNotifications](#dboUnreadNotifications)
- [dbo.Urlaub](#dboUrlaub)
- [dbo.UrlaubsAnsprüche](#dboUrlaubsAnsprüche)
- [dbo.UserCollection](#dboUserCollection)
- [dbo.UserCollectionMember](#dboUserCollectionMember)
- [dbo.UserExit](#dboUserExit)
- [dbo.VacationRequest](#dboVacationRequest)
- [dbo.Verkaufschancen](#dboVerkaufschancen)
- [dbo.VerkaufschancenAngebot](#dboVerkaufschancenAngebot)
- [dbo.VerkaufschancenBewertung](#dboVerkaufschancenBewertung)
- [dbo.VerkaufschancenGr](#dboVerkaufschancenGr)
- [dbo.VerkaufschancenMark](#dboVerkaufschancenMark)
- [dbo.VerkaufschancenStandardthemen](#dboVerkaufschancenStandardthemen)
- [dbo.VerkaufschancenUmsatzplan](#dboVerkaufschancenUmsatzplan)
- [dbo.Versandart](#dboVersandart)
- [dbo.Verteiler](#dboVerteiler)
- [dbo.VerteilerGr](#dboVerteilerGr)
- [dbo.VerteilerKlassen](#dboVerteilerKlassen)
- [dbo.VerteilerKlassenProjekte](#dboVerteilerKlassenProjekte)
- [dbo.VerteilerMark](#dboVerteilerMark)
- [dbo.VerteilerMarkProjekte](#dboVerteilerMarkProjekte)
- [dbo.VerteilerProjekte](#dboVerteilerProjekte)
- [dbo.Verzeichnisse](#dboVerzeichnisse)
- [dbo.VerzeichnisTemplate](#dboVerzeichnisTemplate)
- [dbo.VKPreise](#dboVKPreise)
- [dbo.VorgangsNachverfolgung](#dboVorgangsNachverfolgung)
- [dbo.Vorlagen](#dboVorlagen)
- [dbo.Vornamen](#dboVornamen)
- [dbo.w4aa_InfofensterDef](#dbow4aa_InfofensterDef)
- [dbo.w4aa_InfofensterGroup](#dbow4aa_InfofensterGroup)
- [dbo.W4ASprint](#dboW4ASprint)
- [dbo.Waehrung](#dboWaehrung)
- [dbo.Wareneingang](#dboWareneingang)
- [dbo.WartungsIntervalle](#dboWartungsIntervalle)
- [dbo.Wartungsleistungen](#dboWartungsleistungen)
- [dbo.Werte](#dboWerte)
- [dbo.WhattodoHistorie](#dboWhattodoHistorie)
- [dbo.Whattodos](#dboWhattodos)
- [dbo.WhattodosAnhang](#dboWhattodosAnhang)
- [dbo.WhattodosStandardthemen](#dboWhattodosStandardthemen)
- [dbo.Widget](#dboWidget)
- [dbo.WidgetField](#dboWidgetField)
- [dbo.Z_Test_Schemaaktualisierung](#dboZ_Test_Schemaaktualisierung)
- [dbo.Zahlungsart](#dboZahlungsart)
- [dbo.ZeiterfassungTimer](#dboZeiterfassungTimer)
- [dbo.Zugriffsfilter](#dboZugriffsfilter)
- [dbo.ZuordnungFremdleistungen](#dboZuordnungFremdleistungen)
- [dbo.ZuordnungProvisionär](#dboZuordnungProvisionär)

---

## dbo.Abschluss

<a name="dboAbschluss"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Art` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 500 | ✅ | ('') |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.AbschlussDetails

<a name="dboAbschlussDetails"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AbschlussCode` | int | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Bestand` | float | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `MittlererEK` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.AbschlussDetailsNachLagerort

<a name="dboAbschlussDetailsNachLagerort"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | uniqueidentifier | - | ❌ | - |
| `AbschlussCode` | int | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `LagerortCode` | int | - | ✅ | ((0)) |
| `Bestand` | decimal | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Abteilung

<a name="dboAbteilung"></a>

**Anzahl Datensätze:** 178

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AbteilungName` | nvarchar | 50 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `HauptAnsprechpCode` | int | - | ✅ | - |
| `KundenCode` | int | - | ✅ | - |
| `LieferantenCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `AbteilungName` | Geschäftsführung |
| `Code` | 1 |
| `HauptAnsprechpCode` | NULL |
| `KundenCode` | NULL |
| `LieferantenCode` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.Agent

<a name="dboAgent"></a>

**Anzahl Datensätze:** 274

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Animation` | nvarchar | 50 | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `FormCounter` | int | - | ✅ | ((0)) |
| `FormName` | nvarchar | 50 | ✅ | - |
| `Hinweis` | ntext | 1073741823 | ✅ | - |
| `Immer` | int | - | ✅ | ((0)) |
| `NurProbeversion` | int | - | ✅ | ((0)) |
| `ObjCode` | int | - | ✅ | ((0)) |
| `Object` | nvarchar | 50 | ✅ | - |
| `ObjType` | int | - | ✅ | ((0)) |
| `OnlyForMe` | int | - | ✅ | - |
| `RecordCounter` | int | - | ✅ | ((0)) |
| `TipOfTheDay` | int | - | ✅ | ((0)) |
| `UpdateID` | int | - | ✅ | ((0)) |
| `Updatehinweis` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Animation` | NULL |
| `BCode` | 833019402 |
| `Code` | 951752 |
| `Datum` | 2024-08-21 00:00:00 |
| `FormCounter` | 0 |
| `FormName` |  |
| `Hinweis` | 2% sKonto wären noch möglich  |
| `Immer` | 0 |
| `NurProbeversion` | 0 |
| `ObjCode` | 18101233 |
| `Object` | NULL |
| `ObjType` | 1 |
| `OnlyForMe` | 0 |
| `RecordCounter` | 0 |
| `TipOfTheDay` | 0 |
| `UpdateID` | 0 |
| `Updatehinweis` | 0 |

---

## dbo.Alias2

<a name="dboAlias2"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Key` | nvarchar | 500 | ✅ | - |
| `LanguageKey` | nvarchar | 3 | ✅ | - |
| `TranslationPlural` | nvarchar | 2000 | ✅ | - |
| `TranslationSingular` | nvarchar | 2000 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Angebot

<a name="dboAngebot"></a>

**Anzahl Datensätze:** 4,712

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Abgelehnt` | int | - | ✅ | ((0)) |
| `Abgeschlossen` | int | - | ✅ | - |
| `AbteilungCode` | int | - | ✅ | ((0)) |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `Auftragsbeginn` | datetime | - | ✅ | - |
| `Auftragsbestätigung` | int | - | ✅ | ((0)) |
| `AuftragsDatum` | datetime | - | ✅ | - |
| `AuftragsNummer` | int | - | ✅ | - |
| `AutNummer` | int | - | ✅ | ((0)) |
| `BankverbindungCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `BenutzerCode2` | int | - | ✅ | ((0)) |
| `Berechnen` | int | - | ✅ | ((0)) |
| `BestellDatum` | datetime | - | ✅ | - |
| `BewertungBCode` | int | - | ✅ | ((0)) |
| `BewertungKommentar` | nvarchar | 50 | ✅ | - |
| `BewertungProzent` | int | - | ✅ | ((0)) |
| `Bezugsgrösse` | float | - | ✅ | - |
| `BisDatum` | datetime | - | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |
| `BriefFormulareCode` | int | - | ✅ | ((0)) |
| `Brutto` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datei` | nvarchar | 500 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `DB` | float | - | ✅ | ((0)) |
| `Dispositionsbeginn` | datetime | - | ✅ | - |
| `Dispositionsende` | datetime | - | ✅ | - |
| `EditDate` | datetime | - | ✅ | - |
| `Eingefroren` | int | - | ✅ | ((0)) |
| `ErsatzErlöskonto` | int | - | ✅ | ((0)) |
| `Feld1` | nvarchar | 500 | ✅ | - |
| `Feld2` | nvarchar | 500 | ✅ | - |
| `Feld3` | nvarchar | 500 | ✅ | - |
| `Feld4` | nvarchar | 500 | ✅ | - |
| `Feld5` | nvarchar | 500 | ✅ | - |
| `Feld6` | nvarchar | 500 | ✅ | - |
| `Feld7` | nvarchar | 500 | ✅ | - |
| `Freigabe` | int | - | ✅ | - |
| `GarantieBis` | datetime | - | ✅ | - |
| `HauptAdresse` | ntext | 1073741823 | ✅ | - |
| `IhrZeichen` | nvarchar | 50 | ✅ | - |
| `Kalkulation` | int | - | ✅ | ((0)) |
| `KarteiCode` | int | - | ✅ | - |
| `Konlager` | int | - | ✅ | - |
| `Konsignation` | int | - | ✅ | - |
| `KonsignationLagerortCode` | int | - | ✅ | ((0)) |
| `Kopftext` | ntext | 1073741823 | ✅ | - |
| `Kostenst` | int | - | ✅ | - |
| `Kurs` | float | - | ✅ | ((1)) |
| `KursDatum` | datetime | - | ✅ | - |
| `KW` | int | - | ✅ | - |
| `LCode` | int | - | ✅ | - |
| `Leistungsort` | nvarchar | 100 | ✅ | - |
| `LFCode` | int | - | ✅ | - |
| `Lieferadressegeändert` | int | - | ✅ | - |
| `LieferterminAbgehend` | datetime | - | ✅ | - |
| `LieferungsArtCode` | int | - | ✅ | - |
| `LieferungsArtZiel` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | ((0)) |
| `MobileBearbeitung` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode3` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode3` | int | - | ✅ | ((0)) |
| `NebenAdrCode1` | int | - | ✅ | ((0)) |
| `NebenAdrCode2` | int | - | ✅ | ((0)) |
| `NebenAdrCode3` | int | - | ✅ | ((0)) |
| `NebenAdrPostfach1` | int | - | ✅ | - |
| `NebenAdrPostfach2` | int | - | ✅ | - |
| `NebenAdrPostfach3` | int | - | ✅ | - |
| `NebenAdrText1` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText2` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText3` | ntext | 1073741823 | ✅ | - |
| `NebenAdrType1` | int | - | ✅ | ((0)) |
| `NebenAdrType2` | int | - | ✅ | ((0)) |
| `NebenAdrType3` | int | - | ✅ | ((0)) |
| `NotForeCast` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `Postfach` | int | - | ✅ | - |
| `Preisgruppe` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | - |
| `Projektfortschritt` | float | - | ✅ | ((0)) |
| `ProjektVorgangsCode` | int | - | ✅ | - |
| `RCode` | int | - | ✅ | - |
| `Reservierung` | int | - | ✅ | ((0)) |
| `ReservierungBis` | datetime | - | ✅ | - |
| `ReservierungVon` | datetime | - | ✅ | - |
| `RTFKopftext` | ntext | 1073741823 | ✅ | - |
| `RTFSchlußtext` | ntext | 1073741823 | ✅ | - |
| `RücknahmeCode` | int | - | ✅ | ((0)) |
| `SachProfEinfrieren` | int | - | ✅ | ((0)) |
| `Schlußtext` | ntext | 1073741823 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Skonto` | real | - | ✅ | - |
| `Skonto2` | float | - | ✅ | - |
| `Skontofrist` | real | - | ✅ | - |
| `Skontofrist2` | float | - | ✅ | - |
| `SN` | nvarchar | 50 | ✅ | - |
| `SprachCode` | int | - | ✅ | ((0)) |
| `Status1` | int | - | ✅ | ((0)) |
| `Status2` | int | - | ✅ | ((0)) |
| `Status3` | int | - | ✅ | ((0)) |
| `Status4` | int | - | ✅ | ((0)) |
| `Status5` | int | - | ✅ | ((0)) |
| `StatusAuftragskontrolle` | int | - | ✅ | - |
| `Streckengeschäft` | int | - | ✅ | - |
| `SupportID` | uniqueidentifier | - | ✅ | - |
| `TeilrechnungslogikCode` | int | - | ✅ | - |
| `tmpUmwandeln` | int | - | ✅ | ((0)) |
| `UnserZeichen` | nvarchar | 50 | ✅ | - |
| `VerkaufschancenCode` | int | - | ✅ | - |
| `VerteilerCode` | int | - | ✅ | ((0)) |
| `WaehrungCode` | int | - | ✅ | - |
| `WartungsobjektCode` | int | - | ✅ | - |
| `Wert` | float | - | ✅ | ((0)) |
| `WordParentCode` | int | - | ✅ | ((0)) |
| `Zahlungsfrist` | int | - | ✅ | ((0)) |
| `ZahlungsCode` | int | - | ✅ | ((0)) |
| `APP_UnterschriebenVon` | nvarchar | 4000 | ✅ | ('') |
| `APP_EmailKopieAn` | nvarchar | 4000 | ✅ | ('') |
| `TourCode` | int | - | ✅ | ((0)) |
| `Mietdauer` | float | - | ✅ | - |
| `Mietfaktor` | float | - | ✅ | - |
| `NiederlassungsCode` | int | - | ✅ | ((0)) |
| `Leistungsbeginn` | datetime | - | ✅ | - |
| `Leistungsende` | datetime | - | ✅ | - |
| `CreatedByLoginId` | uniqueidentifier | - | ✅ | - |
| `WebShopOrderDefinitionData` | nvarchar | -1 | ✅ | ('') |
| `Nebenadresse3Geändert` | int | - | ✅ | - |
| `Bruttowert` | decimal | - | ✅ | - |
| `ShopGenehmigt` | int | - | ✅ | - |
| `ShopGenehmigtDatum` | datetime | - | ✅ | - |
| `ShopGenehmigtDurchLoginId` | uniqueidentifier | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `HallenCode` | int | - | ✅ | - |
| `ERechnung_Auftragsnummer_BT14` | nvarchar | 500 | ✅ | - |
| `ERechnung_Bestellnummer_BT13` | nvarchar | 500 | ✅ | - |
| `ERechnung_Empfangsbestätigung_BT15` | nvarchar | 500 | ✅ | - |
| `ERechnung_Objekt_BT18` | nvarchar | 500 | ✅ | - |
| `ERechnung_Projektreferenz_BT11` | nvarchar | 500 | ✅ | - |
| `ERechnung_ReverseCharge` | int | - | ✅ | - |
| `ERechnung_Tender_BT17` | nvarchar | 500 | ✅ | - |
| `ERechnung_Versandanzeige_BT16` | nvarchar | 500 | ✅ | - |
| `ERechnung_Vertragsnummer_BT12` | nvarchar | 500 | ✅ | - |
| `ERechnungsart_BT3` | int | - | ✅ | - |
| `BankAccountCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Abgelehnt` | 0 |
| `Abgeschlossen` | -1 |
| `AbteilungCode` | 0 |
| `AnsprpCode` | 0 |
| `Auftragsbeginn` | NULL |
| `Auftragsbestätigung` | 0 |
| `AuftragsDatum` | NULL |
| `AuftragsNummer` | 0 |
| `AutNummer` | 0 |
| `BankverbindungCode` | 0 |
| `BCode` | NULL |
| `BenutzerCode` | 581413548 |
| `BenutzerCode2` | 581413548 |
| `Berechnen` | 0 |
| `BestellDatum` | NULL |
| `BewertungBCode` | 0 |
| `BewertungKommentar` | NULL |
| `BewertungProzent` | 0 |
| `Bezugsgrösse` | 0.0 |
| `BisDatum` | NULL |
| `Briefdatei` | NULL |
| `BriefFormulareCode` | 0 |
| `Brutto` | 0 |
| `Code` | 144157 |
| `Datei` | \\APPSERVER\Work4all\B001\a220449.pdf |
| `Datum` | 2022-05-02 09:01:35 |
| `DB` | 0.0 |
| `Dispositionsbeginn` | NULL |
| `Dispositionsende` | NULL |
| `EditDate` | 2025-08-07 10:44:44.150000 |
| `Eingefroren` | -1 |
| `ErsatzErlöskonto` | 0 |
| `Feld1` | NULL |
| `Feld2` | NULL |
| `Feld3` | NULL |
| `Feld4` | NULL |
| `Feld5` | NULL |
| `Feld6` | NULL |
| `Feld7` | NULL |
| `Freigabe` | 0 |
| `GarantieBis` | NULL |
| `HauptAdresse` | NULL |
| `IhrZeichen` | NULL |
| `Kalkulation` | 0 |
| `KarteiCode` | 0 |
| `Konlager` | NULL |
| `Konsignation` | NULL |
| `KonsignationLagerortCode` | 0 |
| `Kopftext` | NULL |
| `Kostenst` | 0 |
| `Kurs` | 1.0 |
| `KursDatum` | NULL |
| `KW` | 0 |
| `LCode` | 0 |
| `Leistungsort` | NULL |
| `LFCode` | NULL |
| `Lieferadressegeändert` | 0 |
| `LieferterminAbgehend` | NULL |
| `LieferungsArtCode` | 0 |
| `LieferungsArtZiel` | 0 |
| `LookupCode` | 0 |
| `MobileBearbeitung` | 0 |
| `NebenAdrAbteilungCode1` | 0 |
| `NebenAdrAbteilungCode2` | 0 |
| `NebenAdrAbteilungCode3` | 0 |
| `NebenAdrAPCode1` | 0 |
| `NebenAdrAPCode2` | 0 |
| `NebenAdrAPCode3` | 0 |
| `NebenAdrCode1` | 0 |
| `NebenAdrCode2` | 0 |
| `NebenAdrCode3` | 0 |
| `NebenAdrPostfach1` | 0 |
| `NebenAdrPostfach2` | 0 |
| `NebenAdrPostfach3` | 0 |
| `NebenAdrText1` | Frau

Lisa Hirsch



 |
| `NebenAdrText2` | Frau

Lisa Hirsch



 |
| `NebenAdrText3` | Frau

Lisa Hirsch



 |
| `NebenAdrType1` | 0 |
| `NebenAdrType2` | 0 |
| `NebenAdrType3` | 0 |
| `NotForeCast` | 0 |
| `Notiz` | HT | Kompotherm | 22_21_PR23 |
| `Nummer` | 220449 |
| `ObjGrCode` | 0 |
| `Postfach` | 0 |
| `Preisgruppe` | 0 |
| `ProjektCode` | 0 |
| `Projektfortschritt` | 0.0 |
| `ProjektVorgangsCode` | 0 |
| `RCode` | 0 |
| `Reservierung` | 0 |
| `ReservierungBis` | NULL |
| `ReservierungVon` | NULL |
| `RTFKopftext` | NULL |
| `RTFSchlußtext` | NULL |
| `RücknahmeCode` | 0 |
| `SachProfEinfrieren` | 0 |
| `Schlußtext` | NULL |
| `SDObjMemberCode` | 1662307 |
| `SDObjType` | 1 |
| `Skonto` | 0.0 |
| `Skonto2` | 0.0 |
| `Skontofrist` | 0.0 |
| `Skontofrist2` | 0.0 |
| `SN` | NULL |
| `SprachCode` | 0 |
| `Status1` | 0 |
| `Status2` | 0 |
| `Status3` | 0 |
| `Status4` | 0 |
| `Status5` | 0 |
| `StatusAuftragskontrolle` | NULL |
| `Streckengeschäft` | NULL |
| `SupportID` | 00000000-0000-0000-0000-000000000000 |
| `TeilrechnungslogikCode` | 0 |
| `tmpUmwandeln` | 0 |
| `UnserZeichen` | NULL |
| `VerkaufschancenCode` | NULL |
| `VerteilerCode` | 0 |
| `WaehrungCode` | 0 |
| `WartungsobjektCode` | 0 |
| `Wert` | 0.0 |
| `WordParentCode` | 0 |
| `Zahlungsfrist` | 0 |
| `ZahlungsCode` | 0 |
| `APP_UnterschriebenVon` |  |
| `APP_EmailKopieAn` |  |
| `TourCode` | 0 |
| `Mietdauer` | 0.0 |
| `Mietfaktor` | 1.0 |
| `NiederlassungsCode` | 0 |
| `Leistungsbeginn` | NULL |
| `Leistungsende` | NULL |
| `CreatedByLoginId` | 00000000-0000-0000-0000-000000000000 |
| `WebShopOrderDefinitionData` |  |
| `Nebenadresse3Geändert` | 0 |
| `Bruttowert` | 0.00 |
| `ShopGenehmigt` | 0 |
| `ShopGenehmigtDatum` | NULL |
| `ShopGenehmigtDurchLoginId` | 00000000-0000-0000-0000-000000000000 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |
| `HallenCode` | 0 |
| `ERechnung_Auftragsnummer_BT14` | NULL |
| `ERechnung_Bestellnummer_BT13` | NULL |
| `ERechnung_Empfangsbestätigung_BT15` | NULL |
| `ERechnung_Objekt_BT18` | NULL |
| `ERechnung_Projektreferenz_BT11` | NULL |
| `ERechnung_ReverseCharge` | 0 |
| `ERechnung_Tender_BT17` | NULL |
| `ERechnung_Versandanzeige_BT16` | NULL |
| `ERechnung_Vertragsnummer_BT12` | NULL |
| `ERechnungsart_BT3` | 0 |
| `BankAccountCode` | 0 |

---

## dbo.AngeboteGr

<a name="dboAngeboteGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Anrede

<a name="dboAnrede"></a>

**Anzahl Datensätze:** 14

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AnredeCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `AnredeCodeAlternativ` | int | - | ✅ | - |
| `AnredeName` | nvarchar | 50 | ✅ | - |
| `Männlich` | int | - | ✅ | ((0)) |
| `NameorVorname` | int | - | ✅ | ((0)) |
| `Nummer` | int | - | ✅ | ((0)) |
| `StdBriefAnrede` | nvarchar | 50 | ✅ | - |
| `Titel` | nvarchar | 50 | ✅ | - |
| `Weiblich` | int | - | ✅ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `AnredeCode` | 0 |
| `AnredeCodeAlternativ` | 0 |
| `AnredeName` | -Ohne- |
| `Männlich` | 0 |
| `NameorVorname` | 0 |
| `Nummer` | 999 |
| `StdBriefAnrede` | NULL |
| `Titel` | NULL |
| `Weiblich` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.AnredeAlternativ

<a name="dboAnredeAlternativ"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ParentAnredeCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Name` | nvarchar | 4000 | ✅ | ('') |
| `OhneNamen` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.AppointmentInvite

<a name="dboAppointmentInvite"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `AppointmentCode` | int | - | ✅ | - |
| `EventId` | nvarchar | 1000 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `SenderAddress` | nvarchar | 500 | ✅ | - |
| `Updates` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ApprovalEvents

<a name="dboApprovalEvents"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `ApprovalEventType` | int | - | ✅ | - |
| `Comment` | nvarchar | 2000 | ✅ | - |
| `FromUser` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `ObjectCode` | int | - | ✅ | - |
| `ObjectId` | uniqueidentifier | - | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `ToUser` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArchivPDF

<a name="dboArchivPDF"></a>

**Anzahl Datensätze:** 9,420

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BCode` | int | - | ✅ | ((0)) |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `BZObjType` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `Nachweis` | nvarchar | 50 | ✅ | - |
| `PDF` | image | 2147483647 | ✅ | - |
| `Temporaer` | int | - | ✅ | - |
| `DmsId` | uniqueidentifier | - | ✅ | - |
| `IsERechnung` | int | - | ✅ | - |
| `XML` | nvarchar | -1 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `FileID` | uniqueidentifier | - | ✅ | - |
| `ERechnungFormat` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `BCode` | 59088549 |
| `BZObjMemberCode` | 111221 |
| `BZObjType` | 9 |
| `Code` | 2048595756 |
| `Datum` | 2024-11-12 10:03:43.267000 |
| `Nachweis` | work4all Dokument; SZ 12.11.2024 10:03:43 |
| `PDF` | <binary data, 100092 bytes> |
| `Temporaer` | -1 |
| `DmsId` | 00000000-0000-0000-0000-000000000000 |
| `IsERechnung` | 0 |
| `XML` |  |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `FileID` | 39C587B4-9ED8-42D0-93E2-CDEB5887BBC0 |
| `ERechnungFormat` | NULL |

---

## dbo.Artikel

<a name="dboArtikel"></a>

**Anzahl Datensätze:** 6,477

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AMinutenpreis` | float | - | ✅ | ((0)) |
| `AMinutenpreis2` | float | - | ✅ | - |
| `AMinutenpreis3` | float | - | ✅ | - |
| `Angelegt` | datetime | - | ✅ | - |
| `AngelegtVon` | nvarchar | 50 | ✅ | - |
| `Artikelart` | int | - | ✅ | ((0)) |
| `ArtikelSerNum` | int | - | ✅ | ((0)) |
| `Aufwand` | real | - | ✅ | - |
| `BasisGleichEK` | int | - | ✅ | - |
| `Bemerkung` | ntext | 1073741823 | ✅ | - |
| `Bestand` | real | - | ✅ | - |
| `Bestellvorschlag` | float | - | ✅ | ((0)) |
| `Bewertung` | real | - | ✅ | - |
| `Bezugskosten` | float | - | ✅ | ((0)) |
| `BildDatei` | nvarchar | 50 | ✅ | - |
| `Bilddateiname` | image | 2147483647 | ✅ | - |
| `Breite` | float | - | ✅ | - |
| `Bruttopreis` | float | - | ✅ | ((0)) |
| `Chargenverwaltung` | int | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `CreationDate` | datetime | - | ✅ | - |
| `Dienstleistung` | int | - | ✅ | - |
| `Disposition` | int | - | ✅ | - |
| `EAN` | nvarchar | 20 | ✅ | - |
| `EditBenutzerCode` | int | - | ✅ | - |
| `EditDate` | datetime | - | ✅ | - |
| `EinheitCode` | int | - | ✅ | ((1)) |
| `EKMinutenPreis` | float | - | ✅ | - |
| `EKPreisSpezial` | float | - | ✅ | - |
| `EuroBruttopreis` | float | - | ✅ | ((0)) |
| `EuroNettopreis` | float | - | ✅ | ((0)) |
| `EuroNettopreis2` | float | - | ✅ | ((0)) |
| `EuroNettopreis3` | float | - | ✅ | ((0)) |
| `ExcelDatei` | nvarchar | 500 | ✅ | ('') |
| `Faktor` | float | - | ✅ | ((0)) |
| `Festpreis` | int | - | ✅ | - |
| `Festpreis2` | int | - | ✅ | - |
| `Festpreis3` | int | - | ✅ | - |
| `Festpreis4` | int | - | ✅ | - |
| `Fremdleistung` | int | - | ✅ | - |
| `GarantieBeiKauf` | int | - | ✅ | ((0)) |
| `GarantieNachReparatur` | int | - | ✅ | ((0)) |
| `Geschützt` | int | - | ✅ | - |
| `Gewicht` | float | - | ✅ | ((0)) |
| `GrCode` | int | - | ✅ | - |
| `GroessenZuordnung` | int | - | ✅ | - |
| `HerstellerCode` | int | - | ✅ | - |
| `Herstellernummer` | nvarchar | 20 | ✅ | - |
| `Herstellerpreis` | float | - | ✅ | ((0)) |
| `Höhe` | float | - | ✅ | - |
| `Image` | image | 2147483647 | ✅ | - |
| `Internet` | nvarchar | 100 | ✅ | - |
| `Kalkulationslogik` | int | - | ✅ | - |
| `KalkulationslogikFaktor` | float | - | ✅ | - |
| `KartonFaktor` | float | - | ✅ | ((0)) |
| `KeineLangtextÄnderungenImAuftrag` | int | - | ✅ | ((0)) |
| `KeineProvision` | int | - | ✅ | ((0)) |
| `KeinRabatt` | int | - | ✅ | - |
| `Kostenkonto` | int | - | ✅ | ((0)) |
| `Kostenkonto2` | int | - | ✅ | ((0)) |
| `KostenStCode` | int | - | ✅ | - |
| `Kostenstelle` | int | - | ✅ | - |
| `LagerortCode` | int | - | ✅ | - |
| `Länge` | float | - | ✅ | - |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `ListFlag` | int | - | ✅ | - |
| `Mark` | nvarchar | 1 | ✅ | - |
| `Meldebestand` | float | - | ✅ | ((0)) |
| `Mindestbestand` | float | - | ✅ | ((0)) |
| `MittlererEK` | float | - | ✅ | ((0)) |
| `MiteID` | nvarchar | 200 | ✅ | - |
| `MwstCode` | int | - | ✅ | - |
| `Name` | nvarchar | 150 | ✅ | - |
| `Nettopreis` | real | - | ✅ | - |
| `Nettopreis2` | real | - | ✅ | ((0)) |
| `Nettopreis3` | real | - | ✅ | ((0)) |
| `NichtAutomatischBestellen` | int | - | ✅ | - |
| `NichtLagerArtikel` | int | - | ✅ | - |
| `NichtSkontofähig` | int | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nummer` | nvarchar | 20 | ✅ | - |
| `NurEinkauf` | int | - | ✅ | - |
| `Palettenfaktor` | float | - | ✅ | ((0)) |
| `Preisper` | int | - | ✅ | - |
| `Preisstaffel` | int | - | ✅ | ((0)) |
| `Produktionsartikel` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `RabattGrCode` | int | - | ✅ | ((0)) |
| `Reserviert` | float | - | ✅ | ((0)) |
| `RTFNotiz` | ntext | 1073741823 | ✅ | - |
| `SachkNummer` | int | - | ✅ | - |
| `SachkNummerEU` | int | - | ✅ | - |
| `SachkNummerNonEU` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `Seriennummernlogik` | nvarchar | 100 | ✅ | ('') |
| `SLArt` | int | - | ✅ | ((0)) |
| `SLCode` | int | - | ✅ | ((0)) |
| `SollBestand` | float | - | ✅ | - |
| `Staffelpreis` | int | - | ✅ | - |
| `StaffelpreisZuschlag` | float | - | ✅ | - |
| `StaffelRabatte` | int | - | ✅ | ((0)) |
| `StandardBild` | int | - | ✅ | ((0)) |
| `StandardLagerOrtCode` | int | - | ✅ | ((0)) |
| `StdLieferantCode` | int | - | ✅ | ((0)) |
| `StdWartungsKomponentenProzentSatz` | float | - | ✅ | - |
| `Stillgelegt` | int | - | ✅ | - |
| `Tabellenname` | varchar | 100 | ✅ | - |
| `Tätigkeit` | int | - | ✅ | - |
| `VEFaktor` | float | - | ✅ | - |
| `Verkaufsrabatt` | int | - | ✅ | - |
| `VerteilerCode` | int | - | ✅ | ((0)) |
| `WarengruppenCode` | int | - | ✅ | - |
| `Wartungsartikel` | int | - | ✅ | - |
| `WartungsartikelFür` | nvarchar | 50 | ✅ | - |
| `WASerNum` | int | - | ✅ | ((0)) |
| `WESerNum` | int | - | ✅ | ((0)) |
| `Zolltarifnummer` | nvarchar | 50 | ✅ | - |
| `Zuschlag` | real | - | ✅ | - |
| `Zuschlag0` | float | - | ✅ | ((0)) |
| `Zuschlag1` | float | - | ✅ | ((0)) |
| `Zuschlag2` | float | - | ✅ | ((0)) |
| `Zuschlag3` | float | - | ✅ | ((0)) |
| `LagerwertFIFO` | decimal | - | ✅ | - |
| `KostenStCode2` | int | - | ✅ | ((0)) |
| `KostenStNummer2` | int | - | ✅ | ((0)) |
| `KostenkontoEU` | int | - | ✅ | ((0)) |
| `KostenkontoNonEU` | int | - | ✅ | ((0)) |
| `Mietartikel` | int | - | ✅ | ((0)) |
| `BeiPacklisteNichtZusammenfassen` | int | - | ✅ | ((0)) |
| `WebshopAusblenden` | int | - | ✅ | ((0)) |
| `RessourcenVorrat` | int | - | ✅ | - |
| `BesitzerSdObjMemberCode` | int | - | ✅ | - |
| `BesitzerSdObjType` | int | - | ✅ | - |
| `RessourcenklasseCode` | int | - | ✅ | - |
| `BoxArtikel` | int | - | ✅ | - |
| `BoxFuellgrad` | decimal | - | ✅ | - |
| `MwstCodeEU` | int | - | ✅ | - |
| `MwstCodeNonEU` | int | - | ✅ | - |
| `MwstCodeKosten` | int | - | ✅ | - |
| `MwstCodeEUKosten` | int | - | ✅ | - |
| `MwstCodeNonEUKosten` | int | - | ✅ | - |
| `ShopBestellungohneBestand` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `Herkunftsland` | nvarchar | 10 | ✅ | - |
| `AufRing` | int | - | ✅ | - |
| `Feld1` | bit | - | ✅ | - |
| `NichtAbrechenbar` | int | - | ✅ | - |
| `ErstellerBenutzerCode` | int | - | ✅ | - |
| `InternalArticle` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `AMinutenpreis` | 0.0 |
| `AMinutenpreis2` | 0.0 |
| `AMinutenpreis3` | 0.0 |
| `Angelegt` | NULL |
| `AngelegtVon` | NULL |
| `Artikelart` | 0 |
| `ArtikelSerNum` | 0 |
| `Aufwand` | 0.0 |
| `BasisGleichEK` | -1 |
| `Bemerkung` |  |
| `Bestand` | NULL |
| `Bestellvorschlag` | 0.0 |
| `Bewertung` | 0.0 |
| `Bezugskosten` | 0.0 |
| `BildDatei` | NULL |
| `Bilddateiname` | NULL |
| `Breite` | 0.0 |
| `Bruttopreis` | 0.0 |
| `Chargenverwaltung` | 0 |
| `Code` | 169227 |
| `CreationDate` | NULL |
| `Dienstleistung` | NULL |
| `Disposition` | NULL |
| `EAN` |  |
| `EditBenutzerCode` | 888797748 |
| `EditDate` | NULL |
| `EinheitCode` | 2 |
| `EKMinutenPreis` | 0.0 |
| `EKPreisSpezial` | 2542.14990234375 |
| `EuroBruttopreis` | 0.0 |
| `EuroNettopreis` | 3910.99609375 |
| `EuroNettopreis2` | 3910.99609375 |
| `EuroNettopreis3` | 3910.99609375 |
| `ExcelDatei` |  |
| `Faktor` | 1.0 |
| `Festpreis` | 0 |
| `Festpreis2` | 0 |
| `Festpreis3` | 0 |
| `Festpreis4` | NULL |
| `Fremdleistung` | 0 |
| `GarantieBeiKauf` | 0 |
| `GarantieNachReparatur` | 0 |
| `Geschützt` | NULL |
| `Gewicht` | 0.0 |
| `GrCode` | 1511745652 |
| `GroessenZuordnung` | 0 |
| `HerstellerCode` | 0 |
| `Herstellernummer` |  |
| `Herstellerpreis` | 0.0 |
| `Höhe` | 0.0 |
| `Image` | NULL |
| `Internet` |  |
| `Kalkulationslogik` | 0 |
| `KalkulationslogikFaktor` | 1.0 |
| `KartonFaktor` | 0.0 |
| `KeineLangtextÄnderungenImAuftrag` | 0 |
| `KeineProvision` | 0 |
| `KeinRabatt` | -1 |
| `Kostenkonto` | 3400 |
| `Kostenkonto2` | 0 |
| `KostenStCode` | 0 |
| `Kostenstelle` | 0 |
| `LagerortCode` | 1 |
| `Länge` | 0.0 |
| `LetzteÄnderung` | NULL |
| `ListFlag` | NULL |
| `Mark` | NULL |
| `Meldebestand` | 0.0 |
| `Mindestbestand` | 0.0 |
| `MittlererEK` | 0.0 |
| `MiteID` | NULL |
| `MwstCode` | 1 |
| `Name` | Arnex PS2500 600 x 350 |
| `Nettopreis` | NULL |
| `Nettopreis2` | 0.0 |
| `Nettopreis3` | 0.0 |
| `NichtAutomatischBestellen` | 0 |
| `NichtLagerArtikel` | 0 |
| `NichtSkontofähig` | 0 |
| `Notiz` | Arnex bis 6000 x 3500 |
| `Nummer` | 07-000369 |
| `NurEinkauf` | NULL |
| `Palettenfaktor` | 0.0 |
| `Preisper` | NULL |
| `Preisstaffel` | 0 |
| `Produktionsartikel` | 0 |
| `ProjektCode` | 0 |
| `RabattGrCode` | 0 |
| `Reserviert` | 0.0 |
| `RTFNotiz` | NULL |
| `SachkNummer` | 8400 |
| `SachkNummerEU` | 0 |
| `SachkNummerNonEU` | 0 |
| `SDObjMemberCode` | 0 |
| `Seriennummernlogik` |  |
| `SLArt` | 0 |
| `SLCode` | 0 |
| `SollBestand` | 0.0 |
| `Staffelpreis` | 0 |
| `StaffelpreisZuschlag` | 0.0 |
| `StaffelRabatte` | 0 |
| `StandardBild` | 0 |
| `StandardLagerOrtCode` | 0 |
| `StdLieferantCode` | 2822194 |
| `StdWartungsKomponentenProzentSatz` | 0.0 |
| `Stillgelegt` | 0 |
| `Tabellenname` | NULL |
| `Tätigkeit` | 0 |
| `VEFaktor` | 0.0 |
| `Verkaufsrabatt` | NULL |
| `VerteilerCode` | 0 |
| `WarengruppenCode` | NULL |
| `Wartungsartikel` | NULL |
| `WartungsartikelFür` |  |
| `WASerNum` | 0 |
| `WESerNum` | 0 |
| `Zolltarifnummer` |  |
| `Zuschlag` | NULL |
| `Zuschlag0` | 53.846 |
| `Zuschlag1` | 53.846 |
| `Zuschlag2` | 53.846 |
| `Zuschlag3` | 0.0 |
| `LagerwertFIFO` | 0E-8 |
| `KostenStCode2` | 0 |
| `KostenStNummer2` | 0 |
| `KostenkontoEU` | 0 |
| `KostenkontoNonEU` | 0 |
| `Mietartikel` | 0 |
| `BeiPacklisteNichtZusammenfassen` | 0 |
| `WebshopAusblenden` | 0 |
| `RessourcenVorrat` | 0 |
| `BesitzerSdObjMemberCode` | NULL |
| `BesitzerSdObjType` | NULL |
| `RessourcenklasseCode` | 0 |
| `BoxArtikel` | 0 |
| `BoxFuellgrad` | NULL |
| `MwstCodeEU` | 1 |
| `MwstCodeNonEU` | 1 |
| `MwstCodeKosten` | 1 |
| `MwstCodeEUKosten` | 1 |
| `MwstCodeNonEUKosten` | 1 |
| `ShopBestellungohneBestand` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `Herkunftsland` | DE |
| `AufRing` | 0 |
| `Feld1` | False |
| `NichtAbrechenbar` | -1 |
| `ErstellerBenutzerCode` | NULL |
| `InternalArticle` | NULL |

---

## dbo.Artikel_GeoIngenieure

<a name="dboArtikel_GeoIngenieure"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AMinutenpreis` | float | - | ✅ | - |
| `AMinutenpreis2` | float | - | ✅ | - |
| `AMinutenpreis3` | float | - | ✅ | - |
| `Angelegt` | datetime | - | ✅ | - |
| `AngelegtVon` | nvarchar | 50 | ✅ | - |
| `Artikelart` | int | - | ✅ | - |
| `ArtikelSerNum` | int | - | ✅ | - |
| `Aufwand` | real | - | ✅ | - |
| `BasisGleichEK` | int | - | ✅ | - |
| `BeiPacklisteNichtZusammenfassen` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | -1 | ✅ | - |
| `BesitzerSdObjMemberCode` | int | - | ✅ | - |
| `BesitzerSdObjType` | int | - | ✅ | - |
| `Bestand` | real | - | ✅ | - |
| `Bestellvorschlag` | float | - | ✅ | - |
| `Bewertung` | real | - | ✅ | - |
| `Bezugskosten` | float | - | ✅ | - |
| `BildDatei` | nvarchar | 50 | ✅ | - |
| `Bilddateiname` | image | 2147483647 | ✅ | - |
| `BoxArtikel` | int | - | ✅ | - |
| `BoxFuellgrad` | decimal | - | ✅ | - |
| `Breite` | nvarchar | 20 | ✅ | - |
| `Bruttopreis` | float | - | ✅ | - |
| `Chargenverwaltung` | int | - | ✅ | - |
| `Code` | int | - | ✅ | - |
| `CreationDate` | datetime | - | ✅ | - |
| `Dienstleistung` | int | - | ✅ | - |
| `Disposition` | int | - | ✅ | - |
| `EAN` | nvarchar | 20 | ✅ | - |
| `EditBenutzerCode` | int | - | ✅ | - |
| `EditDate` | datetime | - | ✅ | - |
| `EinheitCode` | int | - | ✅ | - |
| `EKMinutenPreis` | float | - | ✅ | - |
| `EKPreisSpezial` | float | - | ✅ | - |
| `EuroBruttopreis` | float | - | ✅ | - |
| `EuroNettopreis` | float | - | ✅ | - |
| `EuroNettopreis2` | float | - | ✅ | - |
| `EuroNettopreis3` | float | - | ✅ | - |
| `ExcelDatei` | nvarchar | 500 | ✅ | - |
| `Faktor` | float | - | ✅ | - |
| `Festpreis` | int | - | ✅ | - |
| `Festpreis2` | int | - | ✅ | - |
| `Festpreis3` | int | - | ✅ | - |
| `Festpreis4` | int | - | ✅ | - |
| `Fremdleistung` | int | - | ✅ | - |
| `GarantieBeiKauf` | int | - | ✅ | - |
| `GarantieNachReparatur` | int | - | ✅ | - |
| `Geschützt` | int | - | ✅ | - |
| `Gewicht` | float | - | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `GroessenZuordnung` | int | - | ✅ | - |
| `HerstellerCode` | int | - | ✅ | - |
| `Herstellernummer` | nvarchar | 20 | ✅ | - |
| `Herstellerpreis` | float | - | ✅ | - |
| `Höhe` | nvarchar | 20 | ✅ | - |
| `Image` | image | 2147483647 | ✅ | - |
| `Internet` | nvarchar | 100 | ✅ | - |
| `Kalkulationslogik` | int | - | ✅ | - |
| `KalkulationslogikFaktor` | float | - | ✅ | - |
| `KartonFaktor` | float | - | ✅ | - |
| `KeineLangtextÄnderungenImAuftrag` | int | - | ✅ | - |
| `KeineProvision` | int | - | ✅ | - |
| `KeinRabatt` | int | - | ✅ | - |
| `Kostenkonto` | int | - | ✅ | - |
| `Kostenkonto2` | int | - | ✅ | - |
| `KostenkontoEU` | int | - | ✅ | - |
| `KostenkontoNonEU` | int | - | ✅ | - |
| `KostenStCode` | int | - | ✅ | - |
| `KostenStCode2` | int | - | ✅ | - |
| `Kostenstelle` | int | - | ✅ | - |
| `KostenStNummer2` | int | - | ✅ | - |
| `LagerortCode` | int | - | ✅ | - |
| `LagerwertFIFO` | decimal | - | ✅ | - |
| `Länge` | nvarchar | 20 | ✅ | - |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `ListFlag` | int | - | ✅ | - |
| `Mark` | nvarchar | 1 | ✅ | - |
| `Meldebestand` | float | - | ✅ | - |
| `Mietartikel` | int | - | ✅ | - |
| `Mindestbestand` | float | - | ✅ | - |
| `MiteID` | nvarchar | 200 | ✅ | - |
| `MittlererEK` | float | - | ✅ | - |
| `MwstCode` | int | - | ✅ | - |
| `MwstCodeEU` | int | - | ✅ | - |
| `MwstCodeEUKosten` | int | - | ✅ | - |
| `MwstCodeKosten` | int | - | ✅ | - |
| `MwstCodeNonEU` | int | - | ✅ | - |
| `MwstCodeNonEUKosten` | int | - | ✅ | - |
| `Name` | nvarchar | 50 | ✅ | - |
| `Nettopreis` | real | - | ✅ | - |
| `Nettopreis2` | real | - | ✅ | - |
| `Nettopreis3` | real | - | ✅ | - |
| `NichtAutomatischBestellen` | int | - | ✅ | - |
| `NichtLagerArtikel` | int | - | ✅ | - |
| `NichtSkontofähig` | int | - | ✅ | - |
| `Notiz` | nvarchar | -1 | ✅ | - |
| `Nummer` | nvarchar | 20 | ✅ | - |
| `NurEinkauf` | int | - | ✅ | - |
| `Palettenfaktor` | float | - | ✅ | - |
| `Preisper` | int | - | ✅ | - |
| `Preisstaffel` | int | - | ✅ | - |
| `Produktionsartikel` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `RabattGrCode` | int | - | ✅ | - |
| `Reserviert` | float | - | ✅ | - |
| `RessourcenklasseCode` | int | - | ✅ | - |
| `RessourcenVorrat` | int | - | ✅ | - |
| `RTFNotiz` | nvarchar | -1 | ✅ | - |
| `SachkNummer` | int | - | ✅ | - |
| `SachkNummerEU` | int | - | ✅ | - |
| `SachkNummerNonEU` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `Seriennummernlogik` | nvarchar | 100 | ✅ | - |
| `ShopBestellungohneBestand` | int | - | ✅ | - |
| `SLArt` | int | - | ✅ | - |
| `SLCode` | int | - | ✅ | - |
| `SollBestand` | float | - | ✅ | - |
| `Staffelpreis` | int | - | ✅ | - |
| `StaffelpreisZuschlag` | float | - | ✅ | - |
| `StaffelRabatte` | int | - | ✅ | - |
| `StandardBild` | int | - | ✅ | - |
| `StandardLagerOrtCode` | int | - | ✅ | - |
| `StdLieferantCode` | int | - | ✅ | - |
| `StdWartungsKomponentenProzentSatz` | float | - | ✅ | - |
| `Stillgelegt` | int | - | ✅ | - |
| `Tabellenname` | nvarchar | 50 | ✅ | - |
| `Tätigkeit` | int | - | ✅ | - |
| `VEFaktor` | float | - | ✅ | - |
| `Verkaufsrabatt` | int | - | ✅ | - |
| `VerteilerCode` | int | - | ✅ | - |
| `WarengruppenCode` | int | - | ✅ | - |
| `Wartungsartikel` | int | - | ✅ | - |
| `WartungsartikelFür` | nvarchar | 20 | ✅ | - |
| `WASerNum` | int | - | ✅ | - |
| `WebshopAusblenden` | int | - | ✅ | - |
| `WESerNum` | int | - | ✅ | - |
| `Zolltarifnummer` | nvarchar | 20 | ✅ | - |
| `Zuschlag` | real | - | ✅ | - |
| `Zuschlag0` | float | - | ✅ | - |
| `Zuschlag1` | float | - | ✅ | - |
| `Zuschlag2` | float | - | ✅ | - |
| `Zuschlag3` | float | - | ✅ | - |
| `AufRing` | int | - | ✅ | - |
| `Herkunftsland` | nvarchar | 10 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Artikel_Messebau

<a name="dboArtikel_Messebau"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AMinutenpreis` | float | - | ✅ | - |
| `AMinutenpreis2` | float | - | ✅ | - |
| `AMinutenpreis3` | float | - | ✅ | - |
| `Angelegt` | datetime | - | ✅ | - |
| `AngelegtVon` | nvarchar | 50 | ✅ | - |
| `Artikelart` | int | - | ✅ | - |
| `ArtikelSerNum` | int | - | ✅ | - |
| `Aufwand` | real | - | ✅ | - |
| `BasisGleichEK` | int | - | ✅ | - |
| `BeiPacklisteNichtZusammenfassen` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | -1 | ✅ | - |
| `BesitzerSdObjMemberCode` | int | - | ✅ | - |
| `BesitzerSdObjType` | int | - | ✅ | - |
| `Bestand` | real | - | ✅ | - |
| `Bestellvorschlag` | float | - | ✅ | - |
| `Bewertung` | real | - | ✅ | - |
| `Bezugskosten` | float | - | ✅ | - |
| `BildDatei` | nvarchar | 50 | ✅ | - |
| `Bilddateiname` | image | 2147483647 | ✅ | - |
| `BoxArtikel` | int | - | ✅ | - |
| `BoxFuellgrad` | decimal | - | ✅ | - |
| `Breite` | float | - | ✅ | - |
| `Bruttopreis` | float | - | ✅ | - |
| `Chargenverwaltung` | int | - | ✅ | - |
| `Code` | int | - | ✅ | - |
| `CreationDate` | datetime | - | ✅ | - |
| `Dienstleistung` | int | - | ✅ | - |
| `Disposition` | int | - | ✅ | - |
| `EAN` | nvarchar | 20 | ✅ | - |
| `EditBenutzerCode` | int | - | ✅ | - |
| `EditDate` | datetime | - | ✅ | - |
| `EinheitCode` | int | - | ✅ | - |
| `EKMinutenPreis` | float | - | ✅ | - |
| `EKPreisSpezial` | float | - | ✅ | - |
| `EuroBruttopreis` | float | - | ✅ | - |
| `EuroNettopreis` | float | - | ✅ | - |
| `EuroNettopreis2` | float | - | ✅ | - |
| `EuroNettopreis3` | float | - | ✅ | - |
| `ExcelDatei` | nvarchar | 500 | ✅ | - |
| `Faktor` | float | - | ✅ | - |
| `Festpreis` | int | - | ✅ | - |
| `Festpreis2` | int | - | ✅ | - |
| `Festpreis3` | int | - | ✅ | - |
| `Festpreis4` | int | - | ✅ | - |
| `Fremdleistung` | int | - | ✅ | - |
| `GarantieBeiKauf` | int | - | ✅ | - |
| `GarantieNachReparatur` | int | - | ✅ | - |
| `Geschützt` | int | - | ✅ | - |
| `Gewicht` | float | - | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `GroessenZuordnung` | int | - | ✅ | - |
| `HerstellerCode` | int | - | ✅ | - |
| `Herstellernummer` | nvarchar | 20 | ✅ | - |
| `Herstellerpreis` | float | - | ✅ | - |
| `Höhe` | float | - | ✅ | - |
| `Image` | image | 2147483647 | ✅ | - |
| `Internet` | nvarchar | 100 | ✅ | - |
| `Kalkulationslogik` | int | - | ✅ | - |
| `KalkulationslogikFaktor` | float | - | ✅ | - |
| `KartonFaktor` | float | - | ✅ | - |
| `KeineLangtextÄnderungenImAuftrag` | int | - | ✅ | - |
| `KeineProvision` | int | - | ✅ | - |
| `KeinRabatt` | int | - | ✅ | - |
| `Kostenkonto` | int | - | ✅ | - |
| `Kostenkonto2` | int | - | ✅ | - |
| `KostenkontoEU` | int | - | ✅ | - |
| `KostenkontoNonEU` | int | - | ✅ | - |
| `KostenStCode` | int | - | ✅ | - |
| `KostenSTCode2` | int | - | ✅ | - |
| `Kostenstelle` | int | - | ✅ | - |
| `KostenStNummer2` | int | - | ✅ | - |
| `LagerortCode` | int | - | ✅ | - |
| `LagerwertFIFO` | decimal | - | ✅ | - |
| `Länge` | float | - | ✅ | - |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `ListFlag` | int | - | ✅ | - |
| `Mark` | nvarchar | 1 | ✅ | - |
| `Meldebestand` | float | - | ✅ | - |
| `Mietartikel` | int | - | ✅ | - |
| `Mindestbestand` | float | - | ✅ | - |
| `MiteID` | nvarchar | 200 | ✅ | - |
| `MittlererEK` | float | - | ✅ | - |
| `MwstCode` | int | - | ✅ | - |
| `MwstCodeEU` | int | - | ✅ | - |
| `MwstCodeEUKosten` | int | - | ✅ | - |
| `MwstCodeKosten` | int | - | ✅ | - |
| `MwstCodeNonEU` | int | - | ✅ | - |
| `MwstCodeNonEUKosten` | int | - | ✅ | - |
| `Name` | nvarchar | 150 | ✅ | - |
| `Nettopreis` | real | - | ✅ | - |
| `Nettopreis2` | real | - | ✅ | - |
| `Nettopreis3` | real | - | ✅ | - |
| `NichtAutomatischBestellen` | int | - | ✅ | - |
| `NichtLagerArtikel` | int | - | ✅ | - |
| `NichtSkontofähig` | int | - | ✅ | - |
| `Notiz` | nvarchar | -1 | ✅ | - |
| `Nummer` | nvarchar | 20 | ✅ | - |
| `NurEinkauf` | int | - | ✅ | - |
| `Palettenfaktor` | float | - | ✅ | - |
| `Preisper` | int | - | ✅ | - |
| `Preisstaffel` | int | - | ✅ | - |
| `Produktionsartikel` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `RabattGrCode` | int | - | ✅ | - |
| `Reserviert` | float | - | ✅ | - |
| `RessourcenklasseCode` | int | - | ✅ | - |
| `RessourcenVorrat` | int | - | ✅ | - |
| `RTFNotiz` | nvarchar | -1 | ✅ | - |
| `SachkNummer` | int | - | ✅ | - |
| `SachkNummerEU` | int | - | ✅ | - |
| `SachkNummerNonEU` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `Seriennummernlogik` | nvarchar | 100 | ✅ | - |
| `ShopBestellungohneBestand` | int | - | ✅ | - |
| `SLArt` | int | - | ✅ | - |
| `SLCode` | int | - | ✅ | - |
| `SollBestand` | float | - | ✅ | - |
| `Staffelpreis` | int | - | ✅ | - |
| `StaffelpreisZuschlag` | float | - | ✅ | - |
| `StaffelRabatte` | int | - | ✅ | - |
| `StandardBild` | int | - | ✅ | - |
| `StandardLagerOrtCode` | int | - | ✅ | - |
| `StdLieferantCode` | int | - | ✅ | - |
| `StdWartungsKomponentenProzentSatz` | float | - | ✅ | - |
| `Stillgelegt` | int | - | ✅ | - |
| `Tabellenname` | nvarchar | 100 | ✅ | - |
| `Tätigkeit` | int | - | ✅ | - |
| `VEFaktor` | float | - | ✅ | - |
| `Verkaufsrabatt` | int | - | ✅ | - |
| `VerteilerCode` | int | - | ✅ | - |
| `WarengruppenCode` | int | - | ✅ | - |
| `Wartungsartikel` | int | - | ✅ | - |
| `WartungsartikelFür` | nvarchar | 50 | ✅ | - |
| `WASerNum` | int | - | ✅ | - |
| `WebshopAusblenden` | int | - | ✅ | - |
| `WESerNum` | int | - | ✅ | - |
| `Zolltarifnummer` | nvarchar | 50 | ✅ | - |
| `Zuschlag` | real | - | ✅ | - |
| `Zuschlag0` | float | - | ✅ | - |
| `Zuschlag1` | float | - | ✅ | - |
| `Zuschlag2` | float | - | ✅ | - |
| `Zuschlag3` | float | - | ✅ | - |
| `AufRing` | int | - | ✅ | - |
| `Herkunftsland` | nvarchar | 10 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelBenutzer

<a name="dboArtikelBenutzer"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelBilder

<a name="dboArtikelBilder"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Data` | image | 2147483647 | ✅ | - |
| `DMSId` | nvarchar | 200 | ✅ | - |
| `Info1` | nvarchar | 50 | ✅ | - |
| `Info2` | nvarchar | 50 | ✅ | - |
| `LocalFilename` | nvarchar | 500 | ✅ | ('') |
| `Name` | nvarchar | 30 | ✅ | - |
| `ObjMemberCode` | int | - | ❌ | - |
| `ObjType` | int | - | ❌ | - |
| `Pfad` | nvarchar | 500 | ✅ | ('') |
| `Stillgelegt` | int | - | ✅ | - |
| `SprachCode` | int | - | ✅ | ((0)) |
| `AnhangAngebot` | int | - | ✅ | ((0)) |
| `AnhangAuftrag` | int | - | ✅ | ((0)) |
| `AnhangLieferschein` | int | - | ✅ | ((0)) |
| `AnhangRechnung` | int | - | ✅ | ((0)) |
| `AnhangKalkulation` | int | - | ✅ | ((0)) |
| `AnhangBedarf` | int | - | ✅ | ((0)) |
| `AnhangBestellung` | int | - | ✅ | ((0)) |
| `Reihenfolge` | int | - | ✅ | - |
| `ShowInShop` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `FileID` | uniqueidentifier | - | ✅ | - |
| `ERechnungFormat` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelBuchungen

<a name="dboArtikelBuchungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AltBestand` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Buchungsmenge` | float | - | ✅ | - |
| `BuchungsTyp` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `ChargenNummer` | nvarchar | 50 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `CreationDate` | datetime | - | ✅ | - |
| `Differenz` | int | - | ✅ | - |
| `LagerOrt` | int | - | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | - |
| `PositionenCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SerienNummerCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelGr

<a name="dboArtikelGr"></a>

**Anzahl Datensätze:** 134

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelNummerLogik` | nvarchar | 50 | ✅ | - |
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLangtext` | ntext | 1073741823 | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 100 | ✅ | - |
| `GrNummer` | nvarchar | 51 | ✅ | - |
| `TextbausteinCode` | int | - | ✅ | ((0)) |
| `Obergruppe` | nvarchar | 100 | ✅ | ('') |
| `Lang2` | nvarchar | 50 | ✅ | - |
| `Lang3` | nvarchar | 50 | ✅ | - |
| `Lang4` | nvarchar | 50 | ✅ | - |
| `Lang5` | nvarchar | 50 | ✅ | - |
| `Lang6` | nvarchar | 50 | ✅ | - |
| `Lang7` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `ArtikelNummerLogik` |  |
| `GrCode` | 1053163 |
| `GrIndex` | 76 |
| `GrLangtext` | NULL |
| `GrLevel` | 3 |
| `GrName` | Klaiber Kassettenmarkisen |
| `GrNummer` | NULL |
| `TextbausteinCode` | 0 |
| `Obergruppe` |  |
| `Lang2` |  |
| `Lang3` |  |
| `Lang4` |  |
| `Lang5` |  |
| `Lang6` |  |
| `Lang7` |  |

---

## dbo.ArtikelGrMark

<a name="dboArtikelGrMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrCode` | int | - | ✅ | - |
| `Value` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelGroessen

<a name="dboArtikelGroessen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelGroessenDefinitionenCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `Enable` | int | - | ✅ | - |
| `Menge` | int | - | ✅ | - |
| `PosCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelGroessenDefinitionen

<a name="dboArtikelGroessenDefinitionen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelGroessenNamenCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `Index` | int | - | ✅ | - |
| `Name` | nvarchar | 250 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelGroessenName

<a name="dboArtikelGroessenName"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Name` | nvarchar | 250 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelKategorien

<a name="dboArtikelKategorien"></a>

**Anzahl Datensätze:** 19

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 70 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `GrCode` | 1439120 |
| `GrIndex` | 18 |
| `GrLevel` | 2 |
| `GrName` | Zubehör |

---

## dbo.ArtikelKategorienMark

<a name="dboArtikelKategorienMark"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `KategorienCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `ArtikelCode` | 21122129 |
| `Code` | 1395505796 |
| `KategorienCode` | 1282349960 |

---

## dbo.ArtikelKategorienMarkReversed

<a name="dboArtikelKategorienMarkReversed"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KategorienCode` | int | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 893252025 |
| `KategorienCode` | 230165236 |
| `ArtikelCode` | 21122129 |

---

## dbo.ArtikelKontenZuordnung

<a name="dboArtikelKontenZuordnung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `SteuergruppeCode` | int | - | ✅ | ((0)) |
| `Kontonummer` | int | - | ✅ | ((0)) |
| `MwstCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelListeFilter

<a name="dboArtikelListeFilter"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Name` | nvarchar | 200 | ✅ | ('') |
| `Data` | nvarchar | -1 | ✅ | ('') |
| `LastModification` | datetime | - | ✅ | - |
| `GrCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelMark

<a name="dboArtikelMark"></a>

**Anzahl Datensätze:** 270

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BenutzerCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `ObjCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `BenutzerCode` | 59088549 |
| `Code` | 16344 |
| `ObjCode` | 221216173 |

---

## dbo.ArtikelMonatsabschlüsse

<a name="dboArtikelMonatsabschlüsse"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AnfangsbestandAnzahl` | float | - | ✅ | - |
| `AnfangsbestandEK` | float | - | ✅ | - |
| `AnfangsbestandGewichteterEK` | float | - | ✅ | - |
| `Artikelcode` | int | - | ✅ | - |
| `ArtikelgruppenName` | nvarchar | 4000 | ✅ | ('') |
| `BenutzerCode` | int | - | ✅ | - |
| `BestandAnzahl` | float | - | ✅ | - |
| `BestandGewichteterEK` | float | - | ✅ | - |
| `Code` | int | - | ❌ | ((0)) |
| `ErstellDatum` | datetime | - | ✅ | - |
| `PeriodenAnfang` | datetime | - | ✅ | - |
| `PeriodenEnde` | datetime | - | ✅ | - |
| `Tageskurs` | float | - | ✅ | - |
| `VerkaufAnzahl` | float | - | ✅ | - |
| `VerkaufGesamtVK` | float | - | ✅ | - |
| `VerkaufGewichteterVK` | float | - | ✅ | - |
| `Währungscode` | int | - | ✅ | - |
| `WarenausgangAnzahl` | float | - | ✅ | - |
| `WarenausgangGewichteterEK` | float | - | ✅ | - |
| `WareneingangAnzahl` | float | - | ✅ | - |
| `WareneingangEKGes` | float | - | ✅ | - |
| `WareneingangGewichteterEK` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelQMDokumentZuordnungen

<a name="dboArtikelQMDokumentZuordnungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `QMDokumentCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ArtikelRelation

<a name="dboArtikelRelation"></a>

**Anzahl Datensätze:** 269

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Art` | int | - | ✅ | - |
| `ArtikelCodeChild` | int | - | ✅ | - |
| `ArtikelCodeParent` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `CreationDate` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Art` | -1 |
| `ArtikelCodeChild` | 621504154 |
| `ArtikelCodeParent` | 433942823 |
| `BCode` | 888797748 |
| `Code` | 951752 |
| `CreationDate` | 2022-02-10 00:00:00 |

---

## dbo.Aufmasse

<a name="dboAufmasse"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Anzahl` | int | - | ✅ | - |
| `Aufmass` | ntext | 1073741823 | ✅ | - |
| `Bemerkung` | nvarchar | 4000 | ✅ | - |
| `Berechnet` | float | - | ✅ | - |
| `Breite` | float | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `Gewicht` | float | - | ✅ | - |
| `Höhe` | float | - | ✅ | - |
| `Länge` | float | - | ✅ | - |
| `Nummer` | nvarchar | 200 | ✅ | - |
| `PosCode` | int | - | ✅ | - |
| `PosIndex` | int | - | ✅ | - |
| `Text` | nvarchar | 2000 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Auftrag

<a name="dboAuftrag"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `LieferungsArtCode` | int | - | ✅ | ((0)) |
| `LieferungsArtZiel` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Auftragshistorie

<a name="dboAuftragshistorie"></a>

**Anzahl Datensätze:** 8,891

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `DestBZObjCode` | int | - | ✅ | ((0)) |
| `DestBZObjType` | int | - | ✅ | ((0)) |
| `DestTableName` | nvarchar | 50 | ✅ | - |
| `SourceBZObjCode` | int | - | ✅ | ((0)) |
| `SourceBZObjType` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 45120 |
| `DestBZObjCode` | 1064080754 |
| `DestBZObjType` | 7 |
| `DestTableName` | Rechnung |
| `SourceBZObjCode` | 119223206 |
| `SourceBZObjType` | 5 |

---

## dbo.Auftragsstatus

<a name="dboAuftragsstatus"></a>

**Anzahl Datensätze:** 5

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Angebot` | nvarchar | 50 | ✅ | - |
| `Auftrag` | nvarchar | 50 | ✅ | - |
| `Bedarf` | nvarchar | 70 | ✅ | - |
| `Bestellung` | nvarchar | 50 | ✅ | - |
| `Brief` | nvarchar | 50 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Eingangslieferschein` | nvarchar | 50 | ✅ | - |
| `Kalkulation` | nvarchar | 4000 | ✅ | - |
| `Lieferschein` | nvarchar | 50 | ✅ | - |
| `Nummer` | int | - | ✅ | ((0)) |
| `Rechnung` | nvarchar | 50 | ✅ | - |
| `Reisekostenabrechnung` | nvarchar | 70 | ✅ | - |
| `Standard` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Angebot` | NULL |
| `Auftrag` | NULL |
| `Bedarf` | NULL |
| `Bestellung` | NULL |
| `Brief` | NULL |
| `Code` | 1 |
| `Eingangslieferschein` | NULL |
| `Kalkulation` | NULL |
| `Lieferschein` | NULL |
| `Nummer` | 1 |
| `Rechnung` | NULL |
| `Reisekostenabrechnung` | NULL |
| `Standard` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.BankAccounts

<a name="dboBankAccounts"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `AccountOwner` | nvarchar | 500 | ✅ | - |
| `BIC` | nvarchar | 11 | ✅ | - |
| `IBAN` | nvarchar | 34 | ✅ | - |
| `LedgerAccount` | nvarchar | 50 | ✅ | - |
| `MainAccount` | int | - | ✅ | - |
| `Name` | nvarchar | 500 | ✅ | - |
| `SEPACreditorId` | nvarchar | 50 | ✅ | - |
| `LedgerAccountCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 52775659 |
| `AccountOwner` | J.S. Fenster & Türen GmbH |
| `BIC` | GENODEF1AMV |
| `IBAN` | DE36752900000000079561 |
| `LedgerAccount` | 1200 |
| `MainAccount` | -1 |
| `Name` | Volksbank-Raiffeisenbank Amberg eG |
| `SEPACreditorId` | 0 |
| `LedgerAccountCode` | 56101117 |

---

## dbo.Bankverbindung

<a name="dboBankverbindung"></a>

**Anzahl Datensätze:** 361

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BIC` | nvarchar | 11 | ✅ | - |
| `BLZ` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Hauptbank` | int | - | ✅ | - |
| `IBAN` | nvarchar | 34 | ✅ | - |
| `KontoNr` | int | - | ✅ | ((0)) |
| `Kostenstelle` | int | - | ✅ | ((0)) |
| `Kontoinhaber` | nvarchar | 100 | ✅ | - |
| `KontoNummer` | nvarchar | 20 | ✅ | - |
| `MandatsDatum` | datetime | - | ✅ | - |
| `MandatsReferenznummer` | nvarchar | 35 | ✅ | ('') |
| `Name` | nvarchar | 100 | ✅ | - |
| `Sachkonto` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `SEPAGläubigerID` | nvarchar | 50 | ✅ | ('') |
| `QrModulo10Kontonummer` | nvarchar | 50 | ✅ | - |
| `QrModulo10Teilnehmer` | nvarchar | 50 | ✅ | - |
| `QrName` | nvarchar | 50 | ✅ | - |
| `QrOrt` | nvarchar | 50 | ✅ | - |
| `QrPlz` | nvarchar | 50 | ✅ | - |
| `QrStaat` | nvarchar | 50 | ✅ | - |
| `QrUid` | nvarchar | 50 | ✅ | - |
| `QrZeile1` | nvarchar | 50 | ✅ | - |
| `QrZeile2` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `BIC` | BOFADEFXXXX |
| `BLZ` | 0 |
| `Code` | 1052491 |
| `Hauptbank` | 1 |
| `IBAN` | DE32500109000020226013 |
| `KontoNr` | 0 |
| `Kostenstelle` | 0 |
| `Kontoinhaber` | Wex Europa Services GmbH |
| `KontoNummer` |  |
| `MandatsDatum` | NULL |
| `MandatsReferenznummer` | NULL |
| `Name` | Bank of America |
| `Sachkonto` | 0 |
| `SDObjMemberCode` | 77028799 |
| `SDObjType` | 0 |
| `SEPAGläubigerID` | NULL |
| `QrModulo10Kontonummer` | NULL |
| `QrModulo10Teilnehmer` | NULL |
| `QrName` | NULL |
| `QrOrt` | NULL |
| `QrPlz` | NULL |
| `QrStaat` | NULL |
| `QrUid` | NULL |
| `QrZeile1` | NULL |
| `QrZeile2` | NULL |

---

## dbo.Barkasse

<a name="dboBarkasse"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Anfangsbestand` | float | - | ✅ | - |
| `BarkassenName` | nvarchar | 100 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `StartDatum` | datetime | - | ✅ | - |
| `WaehrungsCode` | int | - | ❌ | - |
| `Sachkonto` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.BarkassenBeleg

<a name="dboBarkassenBeleg"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Ausgabe` | float | - | ✅ | - |
| `BarkassenCode` | int | - | ❌ | - |
| `Belegart` | int | - | ✅ | - |
| `Belegnummer` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Betrag` | float | - | ✅ | - |
| `Bezeichnung` | nvarchar | 200 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `Einnahme` | float | - | ✅ | - |
| `Kategorie1` | nvarchar | 80 | ✅ | - |
| `Kategorie2` | nvarchar | 80 | ✅ | - |
| `Kostenst` | int | - | ✅ | - |
| `Mwst` | float | - | ✅ | - |
| `Notiz` | nvarchar | 200 | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `Sachkonto` | int | - | ✅ | - |
| `WaehrungsCode` | int | - | ✅ | - |
| `RECode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.BarkassenSaldo

<a name="dboBarkassenSaldo"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `Saldo` | decimal | - | ✅ | - |
| `BCode` | int | - | ✅ | ((0)) |
| `Nummer` | int | - | ✅ | ((0)) |
| `BarkassenCode` | int | - | ✅ | ((0)) |
| `FibuExport` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Bedarf

<a name="dboBedarf"></a>

**Anzahl Datensätze:** 624

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Abgeschlossen` | int | - | ✅ | - |
| `AbteilungCode` | int | - | ✅ | ((0)) |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `Auftragsbeginn` | datetime | - | ✅ | - |
| `AuftragsDatum` | datetime | - | ✅ | - |
| `AuftragsNummer` | int | - | ✅ | - |
| `AutNummer` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `BenutzerCode2` | int | - | ✅ | ((0)) |
| `BestellDatum` | datetime | - | ✅ | - |
| `Bezugsgroesse` | float | - | ✅ | - |
| `Brutto` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `DB` | float | - | ✅ | ((0)) |
| `EditDate` | datetime | - | ✅ | - |
| `Eingefroren` | int | - | ✅ | - |
| `Feld1` | nvarchar | 500 | ✅ | - |
| `Feld2` | nvarchar | 500 | ✅ | - |
| `Feld3` | nvarchar | 500 | ✅ | - |
| `Feld4` | nvarchar | 500 | ✅ | - |
| `Feld5` | nvarchar | 500 | ✅ | - |
| `Feld6` | nvarchar | 500 | ✅ | - |
| `Feld7` | nvarchar | 500 | ✅ | - |
| `Genehmigt` | int | - | ✅ | - |
| `HauptAdresse` | ntext | 1073741823 | ✅ | - |
| `IhrZeichen` | nvarchar | 50 | ✅ | - |
| `Intern` | int | - | ✅ | - |
| `KarteiCode` | int | - | ✅ | - |
| `Kopftext` | ntext | 1073741823 | ✅ | - |
| `Kostenst` | int | - | ✅ | ((0)) |
| `Kurs` | float | - | ✅ | ((1)) |
| `KursDatum` | datetime | - | ✅ | - |
| `KW` | int | - | ✅ | - |
| `Leistungsort` | nvarchar | 100 | ✅ | - |
| `Lieferadressegeändert` | int | - | ✅ | - |
| `ListFlag` | int | - | ✅ | ((0)) |
| `LookupCode` | int | - | ✅ | ((0)) |
| `MobileBearbeitung` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode3` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode3` | int | - | ✅ | ((0)) |
| `NebenAdrCode1` | int | - | ✅ | ((0)) |
| `NebenAdrCode2` | int | - | ✅ | ((0)) |
| `NebenAdrCode3` | int | - | ✅ | ((0)) |
| `NebenAdrPostfach1` | int | - | ✅ | - |
| `NebenAdrPostfach2` | int | - | ✅ | - |
| `NebenAdrPostfach3` | int | - | ✅ | - |
| `NebenAdrText1` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText2` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText3` | ntext | 1073741823 | ✅ | - |
| `NebenAdrType1` | int | - | ✅ | ((0)) |
| `NebenAdrType2` | int | - | ✅ | ((0)) |
| `NebenAdrType3` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `Planungswirksam` | int | - | ✅ | - |
| `Postfach` | int | - | ✅ | - |
| `Preisgruppe` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `ProjektVorgangsCode` | int | - | ✅ | - |
| `RTFKopftext` | ntext | 1073741823 | ✅ | - |
| `RTFSchlußtext` | ntext | 1073741823 | ✅ | - |
| `Schlußtext` | ntext | 1073741823 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Skonto` | real | - | ✅ | - |
| `Skontofrist` | real | - | ✅ | - |
| `SprachCode` | int | - | ✅ | ((0)) |
| `Status1` | int | - | ✅ | ((0)) |
| `Status2` | int | - | ✅ | ((0)) |
| `Status3` | int | - | ✅ | ((0)) |
| `Status4` | int | - | ✅ | ((0)) |
| `Status5` | int | - | ✅ | ((0)) |
| `UnserZeichen` | nvarchar | 50 | ✅ | - |
| `WaehrungCode` | int | - | ✅ | - |
| `WEDatum` | datetime | - | ✅ | - |
| `Wert` | float | - | ✅ | ((0)) |
| `ZahlungsCode` | int | - | ✅ | ((0)) |
| `Zahlungsfrist` | int | - | ✅ | ((0)) |
| `APP_UnterschriebenVon` | nvarchar | 4000 | ✅ | ('') |
| `APP_EmailKopieAn` | nvarchar | 4000 | ✅ | ('') |
| `LieferterminAbgehend` | datetime | - | ✅ | - |
| `Dispositionsbeginn` | datetime | - | ✅ | - |
| `Dispositionsende` | datetime | - | ✅ | - |
| `Mietdauer` | float | - | ✅ | - |
| `Mietfaktor` | float | - | ✅ | - |
| `NiederlassungsCode` | int | - | ✅ | ((0)) |
| `Leistungsbeginn` | datetime | - | ✅ | - |
| `Leistungsende` | datetime | - | ✅ | - |
| `CreatedByLoginId` | uniqueidentifier | - | ✅ | - |
| `WebShopOrderDefinitionData` | nvarchar | -1 | ✅ | ('') |
| `Bruttowert` | decimal | - | ✅ | - |
| `ShopGenehmigt` | int | - | ✅ | - |
| `ShopGenehmigtDatum` | datetime | - | ✅ | - |
| `ShopGenehmigtDurchLoginId` | uniqueidentifier | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `HallenCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Abgeschlossen` | 0 |
| `AbteilungCode` | 0 |
| `AnsprpCode` | 1866891379 |
| `Auftragsbeginn` | NULL |
| `AuftragsDatum` | NULL |
| `AuftragsNummer` | 0 |
| `AutNummer` | -1 |
| `BenutzerCode` | 833019402 |
| `BenutzerCode2` | 833019402 |
| `BestellDatum` | NULL |
| `Bezugsgroesse` | 0.0 |
| `Brutto` | 0 |
| `Code` | 951752 |
| `Datum` | 2025-09-09 00:00:00 |
| `DB` | 0.0 |
| `EditDate` | 2025-09-10 10:09:02.430000 |
| `Eingefroren` | 0 |
| `Feld1` | NULL |
| `Feld2` | NULL |
| `Feld3` | NULL |
| `Feld4` | NULL |
| `Feld5` | NULL |
| `Feld6` | NULL |
| `Feld7` | NULL |
| `Genehmigt` | 0 |
| `HauptAdresse` | Ammon Beschläge-Handels GmbH

Geisseestraße 21-29

90439 Nürnberg

 |
| `IhrZeichen` |  |
| `Intern` | 0 |
| `KarteiCode` | 0 |
| `Kopftext` | Sehr geehrte Damen und Herren,



bitte senden Sie uns Ihr Angebot für folgende Positionen: |
| `Kostenst` | 0 |
| `Kurs` | 1.0 |
| `KursDatum` | 2001-10-24 00:00:00 |
| `KW` | 0 |
| `Leistungsort` |  |
| `Lieferadressegeändert` | 0 |
| `ListFlag` | 0 |
| `LookupCode` | 0 |
| `MobileBearbeitung` | 0 |
| `NebenAdrAbteilungCode1` | 0 |
| `NebenAdrAbteilungCode2` | 0 |
| `NebenAdrAbteilungCode3` | 0 |
| `NebenAdrAPCode1` | 0 |
| `NebenAdrAPCode2` | 1866891379 |
| `NebenAdrAPCode3` | 1866891379 |
| `NebenAdrCode1` | 494127314 |
| `NebenAdrCode2` | 494127314 |
| `NebenAdrCode3` | 494127314 |
| `NebenAdrPostfach1` | 0 |
| `NebenAdrPostfach2` | 0 |
| `NebenAdrPostfach3` | 0 |
| `NebenAdrText1` | J. S. Fenster & Türen GmbH

Regensburger Straße 59

92224 Amberg

 |
| `NebenAdrText2` | Ammon Beschläge-Handels GmbH

Herr Reinhold Schamberger

Geisseestraße 21-29

90439 Nürnberg

 |
| `NebenAdrText3` | Ammon Beschläge-Handels GmbH

Herr Reinhold Schamberger

Geisseestraße 21-29

90439 Nürnberg

 |
| `NebenAdrType1` | 0 |
| `NebenAdrType2` | 0 |
| `NebenAdrType3` | 0 |
| `Notiz` | DFF | Ammon |  |
| `Nummer` | 250133 |
| `ObjGrCode` | NULL |
| `Planungswirksam` | NULL |
| `Postfach` | 0 |
| `Preisgruppe` | 0 |
| `ProjektCode` | 94443916 |
| `ProjektVorgangsCode` | 0 |
| `RTFKopftext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil\fcharset0 Arial;}}

{\*\gener... (total: 264 chars) |
| `RTFSchlußtext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil\fcharset0 Arial;}{\f1\fnil Ar... (total: 277 chars) |
| `Schlußtext` | Bitte die Kommissionszeile im Angebot angeben ! |
| `SDObjMemberCode` | 494127314 |
| `SDObjType` | 0 |
| `Skonto` | 0.0 |
| `Skontofrist` | 0.0 |
| `SprachCode` | 0 |
| `Status1` | 0 |
| `Status2` | 0 |
| `Status3` | 0 |
| `Status4` | 0 |
| `Status5` | 0 |
| `UnserZeichen` | ER |
| `WaehrungCode` | 1 |
| `WEDatum` | NULL |
| `Wert` | 0.0 |
| `ZahlungsCode` | 0 |
| `Zahlungsfrist` | 14 |
| `APP_UnterschriebenVon` |  |
| `APP_EmailKopieAn` |  |
| `LieferterminAbgehend` | NULL |
| `Dispositionsbeginn` | NULL |
| `Dispositionsende` | NULL |
| `Mietdauer` | 0.0 |
| `Mietfaktor` | 1.0 |
| `NiederlassungsCode` | 0 |
| `Leistungsbeginn` | NULL |
| `Leistungsende` | NULL |
| `CreatedByLoginId` | 00000000-0000-0000-0000-000000000000 |
| `WebShopOrderDefinitionData` |  |
| `Bruttowert` | 0.00 |
| `ShopGenehmigt` | 0 |
| `ShopGenehmigtDatum` | NULL |
| `ShopGenehmigtDurchLoginId` | 00000000-0000-0000-0000-000000000000 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |
| `HallenCode` | 0 |

---

## dbo.Benachrichtigungen

<a name="dboBenachrichtigungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `ObjCode` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `Type` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.BenachrichtigungenBenutzerMark

<a name="dboBenachrichtigungenBenutzerMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BenachrichtigungCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Type` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Beschart

<a name="dboBeschart"></a>

**Anzahl Datensätze:** 5

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BeschCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BeschName` | nvarchar | 30 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `BeschCode` | 1 |
| `BeschName` | Angestellter |

---

## dbo.Bestandspflege

<a name="dboBestandspflege"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelCode` | int | - | ❌ | ((0)) |
| `Bestand` | real | - | ✅ | ((0)) |
| `Code` | int | - | ✅ | - |
| `IstBestand` | float | - | ✅ | - |
| `LagerOrtCode` | int | - | ❌ | ((0)) |
| `Mindestbestand` | real | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Bestellung

<a name="dboBestellung"></a>

**Anzahl Datensätze:** 3,805

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Abgeschlossen` | int | - | ✅ | - |
| `Abrechenbar` | int | - | ✅ | - |
| `AbteilungCode` | int | - | ✅ | ((0)) |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `Auftragsbeginn` | datetime | - | ✅ | - |
| `AuftragsDatum` | datetime | - | ✅ | - |
| `AuftragsNummer` | int | - | ✅ | - |
| `AutNummer` | int | - | ✅ | ((0)) |
| `BankverbindungCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `BenutzerCode2` | int | - | ✅ | ((0)) |
| `Bestätigt` | int | - | ✅ | - |
| `BestellDatum` | datetime | - | ✅ | - |
| `Bezugsgroesse` | float | - | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |
| `BriefFormulareCode` | int | - | ✅ | ((0)) |
| `Brutto` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datei` | nvarchar | 500 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `DB` | float | - | ✅ | ((0)) |
| `EditDate` | datetime | - | ✅ | - |
| `Eingefroren` | int | - | ✅ | - |
| `Feld1` | nvarchar | 500 | ✅ | - |
| `Feld2` | nvarchar | 500 | ✅ | - |
| `Feld3` | nvarchar | 500 | ✅ | - |
| `Feld4` | nvarchar | 500 | ✅ | - |
| `Feld5` | nvarchar | 500 | ✅ | - |
| `Feld6` | nvarchar | 500 | ✅ | - |
| `Feld7` | nvarchar | 500 | ✅ | - |
| `Fixkosten` | int | - | ✅ | - |
| `HauptAdresse` | ntext | 1073741823 | ✅ | - |
| `IhrZeichen` | nvarchar | 50 | ✅ | - |
| `KarteiCode` | int | - | ✅ | - |
| `Kopftext` | ntext | 1073741823 | ✅ | - |
| `Kostenst` | int | - | ✅ | ((0)) |
| `Kurs` | float | - | ✅ | ((1)) |
| `KursDatum` | datetime | - | ✅ | - |
| `KW` | int | - | ✅ | - |
| `Leistungsort` | nvarchar | 100 | ✅ | - |
| `Lieferadressegeändert` | int | - | ✅ | - |
| `LieferterminTatsächlich` | datetime | - | ✅ | - |
| `LieferungsArtCode` | int | - | ✅ | - |
| `LieferungsArtZiel` | int | - | ✅ | - |
| `ListFlag` | int | - | ✅ | ((0)) |
| `LookupCode` | int | - | ✅ | ((0)) |
| `MobileBearbeitung` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode3` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode3` | int | - | ✅ | ((0)) |
| `NebenAdrCode1` | int | - | ✅ | ((0)) |
| `NebenAdrCode2` | int | - | ✅ | ((0)) |
| `NebenAdrCode3` | int | - | ✅ | ((0)) |
| `NebenAdrPostfach1` | int | - | ✅ | - |
| `NebenAdrPostfach2` | int | - | ✅ | - |
| `NebenAdrPostfach3` | int | - | ✅ | - |
| `NebenAdrText1` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText2` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText3` | ntext | 1073741823 | ✅ | - |
| `NebenAdrType1` | int | - | ✅ | ((0)) |
| `NebenAdrType2` | int | - | ✅ | ((0)) |
| `NebenAdrType3` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `Postfach` | int | - | ✅ | - |
| `Preisgruppe` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `ProjektVorgangsCode` | int | - | ✅ | - |
| `RTFKopftext` | ntext | 1073741823 | ✅ | - |
| `RTFSchlußtext` | ntext | 1073741823 | ✅ | - |
| `Schlußtext` | ntext | 1073741823 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Skonto` | real | - | ✅ | - |
| `Skontofrist` | real | - | ✅ | - |
| `Skonto2` | float | - | ✅ | - |
| `Skontofrist2` | float | - | ✅ | - |
| `SprachCode` | int | - | ✅ | ((0)) |
| `Status1` | int | - | ✅ | ((0)) |
| `Status2` | int | - | ✅ | ((0)) |
| `Status3` | int | - | ✅ | ((0)) |
| `Status4` | int | - | ✅ | ((0)) |
| `Status5` | int | - | ✅ | ((0)) |
| `UnserZeichen` | nvarchar | 50 | ✅ | - |
| `VerteilerCode` | int | - | ✅ | ((0)) |
| `WaehrungCode` | int | - | ✅ | - |
| `WartungsobjektCode` | int | - | ✅ | - |
| `WEDatum` | datetime | - | ✅ | - |
| `Wert` | float | - | ✅ | ((0)) |
| `WordParentCode` | int | - | ✅ | ((0)) |
| `ZahlungsCode` | int | - | ✅ | ((0)) |
| `Zahlungsfrist` | int | - | ✅ | ((0)) |
| `APP_UnterschriebenVon` | nvarchar | 4000 | ✅ | ('') |
| `APP_EmailKopieAn` | nvarchar | 4000 | ✅ | ('') |
| `LieferterminAbgehend` | datetime | - | ✅ | - |
| `Dispositionsbeginn` | datetime | - | ✅ | - |
| `Dispositionsende` | datetime | - | ✅ | - |
| `Mietdauer` | float | - | ✅ | - |
| `Mietfaktor` | float | - | ✅ | - |
| `NiederlassungsCode` | int | - | ✅ | ((0)) |
| `Leistungsbeginn` | datetime | - | ✅ | - |
| `Leistungsende` | datetime | - | ✅ | - |
| `CreatedByLoginId` | uniqueidentifier | - | ✅ | - |
| `WebShopOrderDefinitionData` | nvarchar | -1 | ✅ | ('') |
| `Nebenadresse3Geändert` | int | - | ✅ | - |
| `ShopGenehmigt` | int | - | ✅ | - |
| `ShopGenehmigtDatum` | datetime | - | ✅ | - |
| `ShopGenehmigtDurchLoginId` | uniqueidentifier | - | ✅ | - |
| `Bruttowert` | decimal | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `HallenCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Abgeschlossen` | -1 |
| `Abrechenbar` | 0 |
| `AbteilungCode` | 0 |
| `AnsprpCode` | 1834654766 |
| `Auftragsbeginn` | NULL |
| `AuftragsDatum` | NULL |
| `AuftragsNummer` | 0 |
| `AutNummer` | -1 |
| `BankverbindungCode` | 0 |
| `BenutzerCode` | 59088549 |
| `BenutzerCode2` | 59088549 |
| `Bestätigt` | 0 |
| `BestellDatum` | NULL |
| `Bezugsgroesse` | NULL |
| `Briefdatei` | NULL |
| `BriefFormulareCode` | 0 |
| `Brutto` | 0 |
| `Code` | 111221 |
| `Datei` | NULL |
| `Datum` | 2024-11-12 00:00:00 |
| `DB` | 0.0 |
| `EditDate` | 2024-12-19 13:25:41.013000 |
| `Eingefroren` | -1 |
| `Feld1` | NULL |
| `Feld2` | NULL |
| `Feld3` | NULL |
| `Feld4` | NULL |
| `Feld5` | NULL |
| `Feld6` | NULL |
| `Feld7` | NULL |
| `Fixkosten` | NULL |
| `HauptAdresse` | Dekura GmbH

Frau Valerie Markus

Eugen-Diesel-Straße 3

37671  Höxter

 |
| `IhrZeichen` |  |
| `KarteiCode` | 0 |
| `Kopftext` | Sehr geehrte Frau Markus,



wir bestellen folgende Positionen: |
| `Kostenst` | 0 |
| `Kurs` | 1.0 |
| `KursDatum` | 2001-10-24 00:00:00 |
| `KW` | 0 |
| `Leistungsort` |  |
| `Lieferadressegeändert` | 0 |
| `LieferterminTatsächlich` | 2024-12-02 00:00:00 |
| `LieferungsArtCode` | 0 |
| `LieferungsArtZiel` | 0 |
| `ListFlag` | 0 |
| `LookupCode` | 0 |
| `MobileBearbeitung` | 0 |
| `NebenAdrAbteilungCode1` | 0 |
| `NebenAdrAbteilungCode2` | 0 |
| `NebenAdrAbteilungCode3` | 0 |
| `NebenAdrAPCode1` | 0 |
| `NebenAdrAPCode2` | 1834654766 |
| `NebenAdrAPCode3` | 1834654766 |
| `NebenAdrCode1` | 35833830 |
| `NebenAdrCode2` | 35833830 |
| `NebenAdrCode3` | 35833830 |
| `NebenAdrPostfach1` | 0 |
| `NebenAdrPostfach2` | 0 |
| `NebenAdrPostfach3` | 0 |
| `NebenAdrText1` | J. S. Fenster & Türen GmbH

Regensburger Straße 59

92224 Amberg

 |
| `NebenAdrText2` | Dekura GmbH

Frau Valerie Markus

Eugen-Diesel-Straße 3

37671  Höxter

 |
| `NebenAdrText3` | Dekura GmbH

Frau Valerie Markus

Eugen-Diesel-Straße 3

37671  Höxter

 |
| `NebenAdrType1` | 0 |
| `NebenAdrType2` | 0 |
| `NebenAdrType3` | 0 |
| `Notiz` | Gitterbox | Dekura | A-2024006780 |
| `Nummer` | 240895 |
| `ObjGrCode` | NULL |
| `Postfach` | 0 |
| `Preisgruppe` | 0 |
| `ProjektCode` | 0 |
| `ProjektVorgangsCode` | 0 |
| `RTFKopftext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil\fcharset0 Arial;}}

{\*\gener... (total: 233 chars) |
| `RTFSchlußtext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil\fcharset0 Arial;}{\f1\fnil Ar... (total: 292 chars) |
| `Schlußtext` | Bitte die Kommissionszeile in der Auftragsbestätigung angeben ! |
| `SDObjMemberCode` | 35833830 |
| `SDObjType` | 0 |
| `Skonto` | 0.0 |
| `Skontofrist` | 0.0 |
| `Skonto2` | 0.0 |
| `Skontofrist2` | 0.0 |
| `SprachCode` | 0 |
| `Status1` | 0 |
| `Status2` | 0 |
| `Status3` | 0 |
| `Status4` | 0 |
| `Status5` | 0 |
| `UnserZeichen` | SZ |
| `VerteilerCode` | 0 |
| `WaehrungCode` | 1 |
| `WartungsobjektCode` | 0 |
| `WEDatum` | NULL |
| `Wert` | 0.0 |
| `WordParentCode` | 0 |
| `ZahlungsCode` | 0 |
| `Zahlungsfrist` | 14 |
| `APP_UnterschriebenVon` |  |
| `APP_EmailKopieAn` |  |
| `LieferterminAbgehend` | NULL |
| `Dispositionsbeginn` | NULL |
| `Dispositionsende` | NULL |
| `Mietdauer` | 0.0 |
| `Mietfaktor` | 1.0 |
| `NiederlassungsCode` | 0 |
| `Leistungsbeginn` | NULL |
| `Leistungsende` | NULL |
| `CreatedByLoginId` | 00000000-0000-0000-0000-000000000000 |
| `WebShopOrderDefinitionData` |  |
| `Nebenadresse3Geändert` | 0 |
| `ShopGenehmigt` | 0 |
| `ShopGenehmigtDatum` | NULL |
| `ShopGenehmigtDurchLoginId` | 00000000-0000-0000-0000-000000000000 |
| `Bruttowert` | 0.00 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |
| `HallenCode` | 0 |

---

## dbo.Beziehungen

<a name="dboBeziehungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `GP1Code` | int | - | ✅ | - |
| `GP2Code` | int | - | ✅ | - |
| `GP1Type` | int | - | ✅ | - |
| `GP2Type` | int | - | ✅ | - |
| `AP1Code` | int | - | ✅ | - |
| `AP2Code` | int | - | ✅ | - |
| `Beziehung1` | varchar | 200 | ✅ | - |
| `DatumAngelegt` | datetime | - | ❌ | - |
| `BCodeAngelegt` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Bilder

<a name="dboBilder"></a>

**Anzahl Datensätze:** 17,477

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 500 | ✅ | - |
| `ObjMemberCode` | int | - | ❌ | - |
| `ObjType` | int | - | ❌ | - |
| `Picture` | image | 2147483647 | ✅ | - |
| `SelectedPicture` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `FileID` | uniqueidentifier | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 139087 |
| `Name` | image005.png |
| `ObjMemberCode` | 0 |
| `ObjType` | 1000 |
| `Picture` | <binary data, 11215 bytes> |
| `SelectedPicture` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `FileID` | NULL |

---

## dbo.BilderLookUp

<a name="dboBilderLookUp"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelCode` | int | - | ✅ | - |
| `BilderCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `LookUpCode` | int | - | ✅ | - |
| `LookUps` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Briefe

<a name="dboBriefe"></a>

**Anzahl Datensätze:** 21,868

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `Art` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `BlobFileType` | nvarchar | 20 | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datei` | nvarchar | 250 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Editor` | int | - | ✅ | ((0)) |
| `EntryID` | nvarchar | 100 | ✅ | - |
| `Gesperrt` | int | - | ✅ | - |
| `HtmlText` | ntext | 1073741823 | ✅ | - |
| `Inhalt` | nvarchar | 255 | ✅ | - |
| `InterneDatei` | varchar | -1 | ✅ | - |
| `KundenGrCode` | int | - | ✅ | ((0)) |
| `LastModificationDate` | datetime | - | ✅ | - |
| `LieferantenGrCode` | int | - | ✅ | ((0)) |
| `LookupCode` | int | - | ✅ | ((0)) |
| `MailanPrivat` | int | - | ✅ | - |
| `MailBCC` | ntext | 1073741823 | ✅ | - |
| `MailCC` | ntext | 1073741823 | ✅ | - |
| `MailFormat` | int | - | ✅ | - |
| `MailFrom` | nvarchar | 4000 | ✅ | - |
| `MailTo` | nvarchar | 4000 | ✅ | - |
| `MsgFile` | nvarchar | 700 | ✅ | - |
| `MsgNoteText` | ntext | 1073741823 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `ObjGr` | int | - | ✅ | ((0)) |
| `ObjGrCode` | int | - | ✅ | - |
| `ParentCode` | int | - | ✅ | ((0)) |
| `Personalisiert` | int | - | ✅ | - |
| `Priorität` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Status1` | int | - | ✅ | ((0)) |
| `Status2` | int | - | ✅ | ((0)) |
| `Status3` | int | - | ✅ | ((0)) |
| `Status4` | int | - | ✅ | ((0)) |
| `Status5` | int | - | ✅ | ((0)) |
| `SupportID` | uniqueidentifier | - | ✅ | - |
| `VerteilerCode` | int | - | ✅ | ((0)) |
| `MIMEContent` | ntext | 1073741823 | ✅ | ('') |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `BccMailContacts` | nvarchar | -1 | ✅ | - |
| `CcMailContacts` | nvarchar | -1 | ✅ | - |
| `ToMailContacts` | nvarchar | -1 | ✅ | - |
| `SaveSendMailJobID` | uniqueidentifier | - | ✅ | - |
| `FileID` | uniqueidentifier | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `AnsprpCode` | 0 |
| `Art` | 3 |
| `BCode` | 581413548 |
| `BenutzerCode` | 581413548 |
| `BlobFileType` | NULL |
| `Briefdatei` | NULL |
| `Code` | 33940 |
| `Datei` |  |
| `Datum` | 2023-10-20 10:19:34.237000 |
| `Editor` | 0 |
| `EntryID` | NULL |
| `Gesperrt` | 0 |
| `HtmlText` | <!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head>

<title></title>

    <!--[if !mso]... (total: 16335 chars) |
| `Inhalt` |  |
| `InterneDatei` | NULL |
| `KundenGrCode` | 0 |
| `LastModificationDate` | 2023-10-20 11:23:32.020000 |
| `LieferantenGrCode` | 0 |
| `LookupCode` | 0 |
| `MailanPrivat` | NULL |
| `MailBCC` |  |
| `MailCC` |  |
| `MailFormat` | NULL |
| `MailFrom` | no-reply=planstack.de@mg.planstack.de |
| `MailTo` | Info |
| `MsgFile` | NULL |
| `MsgNoteText` |  <https://s3.eu-central-1.amazonaws.com/prod-planstack/company/3d89bc65-2334-4df8-8612-0c42c3ca0165/... (total: 1123 chars) |
| `Notiz` | Herzlich willkommen bei Planstack! |
| `Nummer` | 0 |
| `ObjGr` | 0 |
| `ObjGrCode` | 0 |
| `ParentCode` | 0 |
| `Personalisiert` | 0 |
| `Priorität` | 1 |
| `ProjektCode` | 1263078498 |
| `SDObjMemberCode` | 218671445 |
| `SDObjType` | 1 |
| `Status1` | 0 |
| `Status2` | 0 |
| `Status3` | 0 |
| `Status4` | 0 |
| `Status5` | 0 |
| `SupportID` | 00000000-0000-0000-0000-000000000000 |
| `VerteilerCode` | 0 |
| `MIMEContent` |  |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `BccMailContacts` | NULL |
| `CcMailContacts` | NULL |
| `ToMailContacts` | NULL |
| `SaveSendMailJobID` | NULL |
| `FileID` | NULL |

---

## dbo.BriefeGr

<a name="dboBriefeGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.BriefFormulare

<a name="dboBriefFormulare"></a>

**Anzahl Datensätze:** 7

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BausteinFormular` | int | - | ✅ | - |
| `Betreff` | nvarchar | 100 | ✅ | - |
| `BriefFormularCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BZType` | int | - | ✅ | ((0)) |
| `Editor` | int | - | ✅ | ((0)) |
| `EMailFormular` | int | - | ✅ | - |
| `FormularFileName` | nvarchar | 1000 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `InfoFensterName` | nvarchar | 100 | ✅ | - |
| `Makro` | nvarchar | 50 | ✅ | - |
| `Notiz` | nvarchar | 100 | ✅ | - |
| `Ordner` | nvarchar | 100 | ✅ | - |
| `Serienbrief` | int | - | ✅ | ((0)) |
| `Verkaufschance` | int | - | ✅ | - |
| `Settings` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `BausteinFormular` | 0 |
| `Betreff` | NULL |
| `BriefFormularCode` | 1 |
| `BZType` | 0 |
| `Editor` | 0 |
| `EMailFormular` | 0 |
| `FormularFileName` | work4all Brief.docx |
| `GrCode` | 2 |
| `InfoFensterName` | NULL |
| `Makro` | NULL |
| `Notiz` | work4all Brief |
| `Ordner` | NULL |
| `Serienbrief` | 0 |
| `Verkaufschance` | 0 |
| `Settings` | NULL |

---

## dbo.BriefFormulareEigene

<a name="dboBriefFormulareEigene"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `Datei` | nvarchar | 250 | ✅ | - |
| `Name` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.BriefFormulareFelder

<a name="dboBriefFormulareFelder"></a>

**Anzahl Datensätze:** 89

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BriefFormulareCode` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Feldname` | nvarchar | 50 | ✅ | - |
| `Notiz` | nvarchar | 50 | ✅ | - |
| `Position` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `BriefFormulareCode` | 1 |
| `Code` | 1 |
| `Feldname` | PozNr |
| `Notiz` | Positionsnummer |
| `Position` | 1 |

---

## dbo.BuchenMark

<a name="dboBuchenMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Anzahl` | float | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | - |
| `LagerortCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Chargen

<a name="dboChargen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtCode` | int | - | ✅ | ((0)) |
| `ChargenNummer` | nvarchar | 20 | ✅ | - |
| `Code` | int | - | ❌ | - |
| `Frei1` | nvarchar | 50 | ✅ | - |
| `LagerortCode` | int | - | ✅ | - |
| `Menge` | float | - | ✅ | ((0)) |
| `PositionenCode` | int | - | ✅ | ((0)) |
| `Verfallsdatum` | datetime | - | ✅ | - |
| `WareneingangCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | -1 | ✅ | ('') |
| `Notiz2` | nvarchar | -1 | ✅ | ('') |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ChargenEingänge

<a name="dboChargenEingänge"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Charge` | nvarchar | -1 | ✅ | ('') |
| `WareneingangCode` | int | - | ✅ | ((0)) |
| `Menge` | float | - | ✅ | - |
| `ArtCode` | int | - | ✅ | ((0)) |
| `SeriennummerverwaltungCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Chargenreservierung

<a name="dboChargenreservierung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtCode` | int | - | ✅ | - |
| `Chargennummer` | nvarchar | 20 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `LagerortCode` | int | - | ✅ | - |
| `Menge` | float | - | ✅ | - |
| `PositionenCode` | int | - | ✅ | - |
| `Verfallsdatum` | datetime | - | ✅ | - |
| `WareneingangCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Checkliste

<a name="dboCheckliste"></a>

**Anzahl Datensätze:** 29

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AnsprpCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Mustervorlage` | int | - | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Titel` | nvarchar | 250 | ✅ | - |
| `LastModificationDate` | datetime | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `AnsprpCode` | 0 |
| `BenutzerCode` | 888797748 |
| `Code` | 1292222 |
| `Datum` | 2023-12-15 15:37:43.127000 |
| `Mustervorlage` | -1 |
| `Notiz` | NULL |
| `ProjektCode` | 524551640 |
| `SDObjMemberCode` | 0 |
| `SDObjType` | 1 |
| `Titel` | Vorlage - Referenzen |
| `LastModificationDate` | 2023-12-19 16:47:52.007000 |
| `ProjektePlanungCode` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |

---

## dbo.ChecklistePositionen

<a name="dboChecklistePositionen"></a>

**Anzahl Datensätze:** 1,306

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Art` | int | - | ✅ | - |
| `BCodeErledigt` | int | - | ✅ | - |
| `BCodeGeplant` | int | - | ✅ | - |
| `BisWann` | datetime | - | ✅ | - |
| `Checked` | int | - | ✅ | - |
| `ChecklisteCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `DatumErledigt` | datetime | - | ✅ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Farbe` | nvarchar | 50 | ✅ | - |
| `Kategorie1` | nvarchar | 50 | ✅ | - |
| `Kategorie2` | nvarchar | 50 | ✅ | - |
| `Name` | nvarchar | -1 | ✅ | - |
| `Notiz` | nvarchar | -1 | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `PersonGeplant` | nvarchar | 100 | ✅ | - |
| `PozNr` | nvarchar | 50 | ✅ | - |
| `LieferantenCode` | int | - | ✅ | ((0)) |
| `Prioritaet` | int | - | ✅ | ((0)) |
| `VorlageProjektDatumBezug` | nvarchar | 2000 | ✅ | ('') |
| `ProjektePlanungCode` | int | - | ✅ | ((0)) |
| `BeginntAm` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Art` | 0 |
| `BCodeErledigt` | 888797748 |
| `BCodeGeplant` | 0 |
| `BisWann` | 2024-12-31 00:00:00 |
| `Checked` | -1 |
| `ChecklisteCode` | 231158248 |
| `Code` | 220251 |
| `DatumErledigt` | 2024-06-18 00:00:00 |
| `Farbe` | NULL |
| `Kategorie1` | NULL |
| `Kategorie2` | NULL |
| `Name` | Innentüren |
| `Notiz` | Wertgutschein 300,-€

Ab 2.000,-€ Brutto Warenwerte |
| `Nummer` | 15 |
| `PersonGeplant` | NULL |
| `PozNr` | 4.2 |
| `LieferantenCode` | 846918456 |
| `Prioritaet` | 1 |
| `VorlageProjektDatumBezug` |  |
| `ProjektePlanungCode` | 0 |
| `BeginntAm` | 2024-10-01 00:00:00 |

---

## dbo.CompanyListFilter

<a name="dboCompanyListFilter"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BenutzerCode` | int | - | ✅ | - |
| `Data` | nvarchar | -1 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `ID` | uniqueidentifier | - | ✅ | - |
| `KateCode` | int | - | ✅ | - |
| `LastModification` | datetime | - | ✅ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `ObjType` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ControllingDefinition

<a name="dboControllingDefinition"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Art` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 100 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `IstNetto` | int | - | ✅ | - |
| `Mwst` | float | - | ✅ | - |
| `PosNr` | int | - | ✅ | ((0)) |
| `Sachkonto` | int | - | ✅ | - |
| `SchowinLiqui` | int | - | ✅ | - |
| `ShowinGuV` | int | - | ✅ | - |
| `Unvisible` | int | - | ✅ | - |
| `UnvisibleGuV` | int | - | ✅ | - |
| `UnvisibleLiquidität` | int | - | ✅ | - |
| `Kostenstelle` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ControllingDefinitionDetails

<a name="dboControllingDefinitionDetails"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ControllingDefinitionCode` | int | - | ✅ | ((0)) |
| `Konto` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ControllingWerte

<a name="dboControllingWerte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ControllingDefinitionCode` | int | - | ✅ | ((0)) |
| `Jahr` | float | - | ✅ | ((0)) |
| `Monat` | float | - | ✅ | ((0)) |
| `Wert` | float | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ConvertedFiles

<a name="dboConvertedFiles"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `FileKey` | nvarchar | 500 | ✅ | - |
| `Filename` | nvarchar | 300 | ✅ | - |
| `HadConvertError` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `ObjectCode` | int | - | ✅ | - |
| `ObjectId` | uniqueidentifier | - | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `SdObjMemberCode` | int | - | ✅ | - |
| `SdObjType` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.CustomEmojis

<a name="dboCustomEmojis"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Aliases` | nvarchar | 1000 | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `Data` | varbinary | -1 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 50 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Dateien

<a name="dboDateien"></a>

**Anzahl Datensätze:** 5,802

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Data` | image | 2147483647 | ✅ | - |
| `DMSId` | nvarchar | 200 | ✅ | - |
| `Info1` | nvarchar | 50 | ✅ | - |
| `Info2` | nvarchar | 50 | ✅ | - |
| `LocalFilename` | nvarchar | 500 | ✅ | ('') |
| `Name` | nvarchar | 500 | ✅ | - |
| `ObjMemberCode` | int | - | ❌ | - |
| `ObjType` | int | - | ❌ | - |
| `Pfad` | nvarchar | 500 | ✅ | ('') |
| `Stillgelegt` | int | - | ✅ | - |
| `SprachCode` | int | - | ✅ | ((0)) |
| `AnhangAngebot` | int | - | ✅ | ((0)) |
| `AnhangAuftrag` | int | - | ✅ | ((0)) |
| `AnhangLieferschein` | int | - | ✅ | ((0)) |
| `AnhangRechnung` | int | - | ✅ | ((0)) |
| `AnhangKalkulation` | int | - | ✅ | ((0)) |
| `AnhangBedarf` | int | - | ✅ | ((0)) |
| `AnhangBestellung` | int | - | ✅ | ((0)) |
| `Reihenfolge` | int | - | ✅ | - |
| `ShowInShop` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `ParentCode` | int | - | ✅ | - |
| `ERechnungFormat` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 119128 |
| `Data` | <binary data, 44855 bytes> |
| `DMSId` |  |
| `Info1` |  |
| `Info2` |  |
| `LocalFilename` |  |
| `Name` | 3232195_2022-12-001024.pdf |
| `ObjMemberCode` | 811926688 |
| `ObjType` | 1 |
| `Pfad` |  |
| `Stillgelegt` | 0 |
| `SprachCode` | 0 |
| `AnhangAngebot` | 0 |
| `AnhangAuftrag` | 0 |
| `AnhangLieferschein` | 0 |
| `AnhangRechnung` | 0 |
| `AnhangKalkulation` | 0 |
| `AnhangBedarf` | 0 |
| `AnhangBestellung` | 0 |
| `Reihenfolge` | 1 |
| `ShowInShop` | 0 |
| `Datum` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `ParentCode` | NULL |
| `ERechnungFormat` | NULL |

---

## dbo.DatevExportProtokoll

<a name="dboDatevExportProtokoll"></a>

**Anzahl Datensätze:** 36

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `AnzahlBelege` | int | - | ✅ | - |
| `AnzahlBelegeFehlerhaft` | int | - | ✅ | - |
| `AnzahlBuchungsdaten` | int | - | ✅ | - |
| `AnzahlStammdaten` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Buchungsmerkmal` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Erfolgreich` | int | - | ✅ | - |
| `ExportAusgangsrechnungen` | int | - | ✅ | - |
| `ExportDebitoren` | int | - | ✅ | - |
| `ExportEingangsrechnungen` | int | - | ✅ | - |
| `ExportKreditoren` | int | - | ✅ | - |
| `JobStatus` | nvarchar | -1 | ✅ | - |
| `ResponseBelege` | nvarchar | -1 | ✅ | - |
| `ResponseBuchungsdaten` | nvarchar | -1 | ✅ | - |
| `UploadBelege` | int | - | ✅ | - |
| `UploadBuchungsdaten` | int | - | ✅ | - |
| `ZeitraumEnde` | datetime | - | ✅ | - |
| `ZeitraumStart` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Id` | CA158B0F-5137-4B29-BCD0-0A8E9CDF0D57 |
| `AnzahlBelege` | 3 |
| `AnzahlBelegeFehlerhaft` | 0 |
| `AnzahlBuchungsdaten` | 3 |
| `AnzahlStammdaten` | 9 |
| `BenutzerCode` | 888797748 |
| `Buchungsmerkmal` | -1 |
| `Datum` | 2025-02-06 15:47:04.290000 |
| `Erfolgreich` | -1 |
| `ExportAusgangsrechnungen` | -1 |
| `ExportDebitoren` | -1 |
| `ExportEingangsrechnungen` | -1 |
| `ExportKreditoren` | -1 |
| `JobStatus` | {

  "id": "27c76639-7582-4367-85a7-60786bf41edf",

  "filename": "EXTF_Buchungsstapel 01.08.2024 bi... (total: 480 chars) |
| `ResponseBelege` | [

  {

    "Request": {

      "UserState": null,

      "AllowedDecompressionMethods": [

        ... (total: 27177 chars) |
| `ResponseBuchungsdaten` | {

  "Request": {

    "UserState": null,

    "AllowedDecompressionMethods": [

      0,

      2,
... (total: 12726 chars) |
| `UploadBelege` | -1 |
| `UploadBuchungsdaten` | -1 |
| `ZeitraumEnde` | 2024-12-31 15:46:13 |
| `ZeitraumStart` | 2024-08-01 15:46:13 |

---

## dbo.DhlSendung

<a name="dboDhlSendung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BCode` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `DhlLabelUrl` | nvarchar | 500 | ✅ | ('') |
| `DhlSendenummer` | nvarchar | 100 | ✅ | ('') |
| `ErpAnhangCode` | int | - | ✅ | ((0)) |
| `Lieferdatum` | datetime | - | ✅ | - |
| `Notiz` | nvarchar | 1000 | ✅ | ('') |
| `ObjMemberCode` | int | - | ✅ | ((0)) |
| `ObjType` | int | - | ✅ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.DmsVolltext

<a name="dboDmsVolltext"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `VolltextType` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |
| `ObjId` | uniqueidentifier | - | ✅ | - |
| `PlainText` | nvarchar | -1 | ✅ | - |
| `IndexDatum` | datetime | - | ✅ | - |
| `DokumentLastModified` | datetime | - | ✅ | - |
| `Fehlermeldung` | nvarchar | -1 | ✅ | - |
| `Pfad` | nvarchar | 300 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.DocumentClasses

<a name="dboDocumentClasses"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `ConvertedItem` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 250 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `SdObjType` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Dokumente

<a name="dboDokumente"></a>

**Anzahl Datensätze:** 12,615

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `Art` | int | - | ✅ | ((0)) |
| `Artikelcode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `BlobFileType` | nvarchar | 20 | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datei` | nvarchar | 250 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Editor` | int | - | ✅ | ((0)) |
| `Enddatum` | datetime | - | ✅ | - |
| `EntryID` | nvarchar | 100 | ✅ | - |
| `I_Anzeigen` | int | - | ✅ | - |
| `InfoFensterName` | nvarchar | 4000 | ✅ | - |
| `Internet` | int | - | ✅ | - |
| `KnowledgebaseCode` | int | - | ✅ | ((0)) |
| `KontaktberichtCode` | int | - | ✅ | ((0)) |
| `LastModificationDate` | datetime | - | ✅ | - |
| `LookUpCode` | int | - | ✅ | - |
| `MsgNoteText` | ntext | 1073741823 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `ObjGr` | int | - | ✅ | ((0)) |
| `ObjGrCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `SN` | nvarchar | 50 | ✅ | - |
| `Status1` | int | - | ✅ | ((0)) |
| `Status2` | int | - | ✅ | ((0)) |
| `Status3` | int | - | ✅ | ((0)) |
| `Status4` | int | - | ✅ | ((0)) |
| `Status5` | int | - | ✅ | ((0)) |
| `Abgeschlossen` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `DocumentParentCode` | int | - | ✅ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `NotizHtml` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `AnsprpCode` | 0 |
| `Art` | -1 |
| `Artikelcode` | 0 |
| `BenutzerCode` | 59088549 |
| `BlobFileType` | NULL |
| `Briefdatei` | NULL |
| `Code` | 48148 |
| `Datei` | \\JS_fenster\Scanner\20230905081828.pdf |
| `Datum` | 2023-09-01 08:38:03 |
| `Editor` | 0 |
| `Enddatum` | NULL |
| `EntryID` | NULL |
| `I_Anzeigen` | NULL |
| `InfoFensterName` |  |
| `Internet` | NULL |
| `KnowledgebaseCode` | 0 |
| `KontaktberichtCode` | 0 |
| `LastModificationDate` | 2023-09-05 08:38:37.573000 |
| `LookUpCode` | 0 |
| `MsgNoteText` | NULL |
| `Notiz` | MO | Dichtungen |
| `Nummer` | NULL |
| `ObjGr` | 0 |
| `ObjGrCode` | 0 |
| `ProjektCode` | 2123063562 |
| `SDObjMemberCode` | 25356128 |
| `SDObjType` | 1 |
| `SN` |  |
| `Status1` | 0 |
| `Status2` | 0 |
| `Status3` | 0 |
| `Status4` | 0 |
| `Status5` | 0 |
| `Abgeschlossen` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |
| `DocumentParentCode` | NULL |
| `Name` | NULL |
| `NotizHtml` | NULL |

---

## dbo.DokumenteGr

<a name="dboDokumenteGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 50 | ✅ | - |
| `InfoFensterName` | nvarchar | 4000 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.DpdSendungen

<a name="dboDpdSendungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `ObjMembercode` | int | - | ✅ | - |
| `ObjType` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Lieferdatum` | datetime | - | ✅ | - |
| `Sendungsnummer` | varchar | 50 | ✅ | - |
| `ErpAnhangCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Druckdefinitionen

<a name="dboDruckdefinitionen"></a>

**Anzahl Datensätze:** 10

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BCode` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 200 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Port` | nvarchar | 200 | ✅ | - |
| `Port_1` | nvarchar | 200 | ✅ | - |
| `ReportCode` | int | - | ✅ | ((0)) |
| `SchachtFolgende` | int | - | ✅ | ((0)) |
| `SchachtFolgende_1` | int | - | ✅ | ((0)) |
| `SchachtSeite1` | int | - | ✅ | ((0)) |
| `SchachtSeite1_1` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `BCode` | 888797748 |
| `Bezeichnung` | einseitig Briefpapier |
| `Code` | 1702828 |
| `Port` | \\dc\Canon_einseitig_Briefpapier |
| `Port_1` |  |
| `ReportCode` | 5 |
| `SchachtFolgende` | 264 |
| `SchachtFolgende_1` | 0 |
| `SchachtSeite1` | 3 |
| `SchachtSeite1_1` | 0 |

---

## dbo.DTA

<a name="dboDTA"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Abgeschlossen` | int | - | ✅ | - |
| `BankCode` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | - |
| `BIC` | nvarchar | 50 | ✅ | - |
| `BLZ` | nvarchar | 50 | ✅ | - |
| `Buchhaltungskonto` | int | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Dateiname` | nvarchar | 500 | ✅ | - |
| `Dateipfad` | nvarchar | 500 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `DBVerändertBCode` | int | - | ✅ | ((0)) |
| `DBVerändertDatum` | datetime | - | ✅ | - |
| `DBAktualisiertBCode` | int | - | ✅ | ((0)) |
| `DBAktualisiertDatum` | datetime | - | ✅ | - |
| `DTAModus` | int | - | ✅ | - |
| `EigeneReferenz` | nvarchar | 50 | ✅ | - |
| `EigenerName` | nvarchar | 50 | ✅ | - |
| `Einzugsart` | int | - | ✅ | - |
| `IBAN` | nvarchar | 50 | ✅ | - |
| `International` | int | - | ✅ | - |
| `KtoNr` | nvarchar | 50 | ✅ | - |
| `Ort` | nvarchar | 35 | ✅ | - |
| `Referenz` | nvarchar | 50 | ✅ | - |
| `SEPAGläubigerID` | nvarchar | 50 | ✅ | ('') |
| `SEPAMessageFormat` | nvarchar | 50 | ✅ | ('') |
| `Strasse` | nvarchar | 35 | ✅ | - |
| `Verwendungszweck4` | nvarchar | 35 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Abgeschlossen` | 0 |
| `BankCode` | 0 |
| `BCode` | 888797748 |
| `BIC` | GENODEF1AMV |
| `BLZ` | 0 |
| `Buchhaltungskonto` | 1200 |
| `Code` | 89324381 |
| `Dateiname` | VRBank_0103 |
| `Dateipfad` | C:\SEPA\ |
| `Datum` | 2024-06-24 14:42:38.873000 |
| `DBVerändertBCode` | 0 |
| `DBVerändertDatum` | NULL |
| `DBAktualisiertBCode` | 0 |
| `DBAktualisiertDatum` | NULL |
| `DTAModus` | 0 |
| `EigeneReferenz` | Zahlungslauf vom 24.06.2024 14:42:38 |
| `EigenerName` | J.S. Fenster & Türen GmbH |
| `Einzugsart` | 0 |
| `IBAN` | DE36752900000000079561 |
| `International` | 2 |
| `KtoNr` | NULL |
| `Ort` | NULL |
| `Referenz` | Zahlungslauf vom 24.06.2024 14:42:38 |
| `SEPAGläubigerID` | 0 |
| `SEPAMessageFormat` | ZKA_Pain_001_001_03 |
| `Strasse` | NULL |
| `Verwendungszweck4` |  |

---

## dbo.DTAMark

<a name="dboDTAMark"></a>

**Anzahl Datensätze:** 12

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Angeklickt` | int | - | ✅ | - |
| `Buchungsbetrag` | float | - | ✅ | ((0)) |
| `Buchungsdatum` | datetime | - | ✅ | - |
| `Buchungskonto` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `DTACode` | int | - | ✅ | - |
| `DTAFälligBetrag` | float | - | ✅ | ((0)) |
| `DTAFälligDatum` | datetime | - | ✅ | - |
| `RACode` | int | - | ✅ | - |
| `RECode` | int | - | ✅ | - |
| `SEPAMandatsReferenzNummer` | nvarchar | 50 | ✅ | ('') |
| `Skonto` | int | - | ✅ | - |
| `Skontobetrag` | float | - | ✅ | ((0)) |
| `Skontokonto` | int | - | ✅ | ((0)) |
| `Verwendungszweck` | nvarchar | 54 | ✅ | - |
| `AusZahlungslaufEntfernt` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Angeklickt` | -1 |
| `Buchungsbetrag` | 181.0084 |
| `Buchungsdatum` | 2023-07-19 00:00:00 |
| `Buchungskonto` | 0 |
| `Code` | 4924116 |
| `DTACode` | 520241669 |
| `DTAFälligBetrag` | 380.79 |
| `DTAFälligDatum` | 2023-08-18 00:00:00 |
| `RACode` | 0 |
| `RECode` | 652204332 |
| `SEPAMandatsReferenzNummer` | NULL |
| `Skonto` | 0 |
| `Skontobetrag` | 0.0 |
| `Skontokonto` | 3736 |
| `Verwendungszweck` |  |
| `AusZahlungslaufEntfernt` | NULL |

---

## dbo.EditorBild

<a name="dboEditorBild"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Persistent` | int | - | ✅ | ((0)) |
| `Filename` | nvarchar | 500 | ✅ | ('') |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Eingangslieferschein

<a name="dboEingangslieferschein"></a>

**Anzahl Datensätze:** 3,905

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Abgeschlossen` | int | - | ✅ | - |
| `AbteilungCode` | int | - | ✅ | ((0)) |
| `AnsprpCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `BenutzerCode2` | int | - | ✅ | - |
| `Bezugsgroesse` | float | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `DokumenteCode` | int | - | ✅ | ((0)) |
| `EditDate` | datetime | - | ✅ | - |
| `Eingefroren` | int | - | ✅ | - |
| `Feld1` | nvarchar | 500 | ✅ | - |
| `Feld2` | nvarchar | 500 | ✅ | - |
| `Feld3` | nvarchar | 500 | ✅ | - |
| `Feld4` | nvarchar | 500 | ✅ | - |
| `Feld5` | nvarchar | 500 | ✅ | - |
| `Feld6` | nvarchar | 500 | ✅ | - |
| `Feld7` | nvarchar | 500 | ✅ | - |
| `HauptAdresse` | ntext | 1073741823 | ✅ | - |
| `IhrZeichen` | nvarchar | 50 | ✅ | - |
| `Kopftext` | text | 2147483647 | ✅ | - |
| `Kostenst` | int | - | ✅ | ((0)) |
| `Kurs` | float | - | ✅ | ((1)) |
| `KursDatum` | datetime | - | ✅ | - |
| `Leistungsort` | nvarchar | 100 | ✅ | ('') |
| `LieferscheinNummer` | nvarchar | 20 | ✅ | - |
| `LieferDatum` | datetime | - | ✅ | - |
| `MobileBearbeitung` | int | - | ✅ | ((0)) |
| `NebenAdrPostfach1` | int | - | ✅ | ((0)) |
| `NebenAdrPostfach2` | int | - | ✅ | ((0)) |
| `NebenAdrPostfach3` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `OLE` | image | 2147483647 | ✅ | - |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `ProjektVorgangsCode` | int | - | ✅ | - |
| `RECode` | int | - | ✅ | ((0)) |
| `RTFKopftext` | text | 2147483647 | ✅ | - |
| `RTFSchlußtext` | text | 2147483647 | ✅ | - |
| `Rücknahme` | int | - | ✅ | ((0)) |
| `Scandatei` | image | 2147483647 | ✅ | - |
| `ScanFile` | nvarchar | 500 | ✅ | - |
| `Schlußtext` | text | 2147483647 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | ((0)) |
| `Status1` | int | - | ✅ | - |
| `Status2` | int | - | ✅ | - |
| `Status3` | int | - | ✅ | - |
| `Status4` | int | - | ✅ | - |
| `Status5` | int | - | ✅ | - |
| `UnserZeichen` | nvarchar | 50 | ✅ | - |
| `WaehrungCode` | int | - | ✅ | ((0)) |
| `WartungsobjektCode` | int | - | ✅ | ((0)) |
| `LieferterminAbgehend` | datetime | - | ✅ | - |
| `Postfach` | int | - | ✅ | ((0)) |
| `Mietdauer` | float | - | ✅ | - |
| `Mietfaktor` | float | - | ✅ | - |
| `Eingangslieferscheinart` | int | - | ✅ | ((0)) |
| `NiederlassungsCode` | int | - | ✅ | ((0)) |
| `Leistungsbeginn` | datetime | - | ✅ | - |
| `Leistungsende` | datetime | - | ✅ | - |
| `CreatedByLoginId` | uniqueidentifier | - | ✅ | - |
| `WebShopOrderDefinitionData` | nvarchar | -1 | ✅ | ('') |
| `Bruttowert` | decimal | - | ✅ | - |
| `Storniert` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `HallenCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Abgeschlossen` | -1 |
| `AbteilungCode` | 0 |
| `AnsprpCode` | 0 |
| `BenutzerCode` | 581413548 |
| `BenutzerCode2` | 22209630 |
| `Bezugsgroesse` | NULL |
| `Code` | 199140 |
| `Datum` | 2023-10-05 00:00:00 |
| `DokumenteCode` | 0 |
| `EditDate` | 2023-10-09 09:25:04.310000 |
| `Eingefroren` | -1 |
| `Feld1` | NULL |
| `Feld2` | NULL |
| `Feld3` | Meyer |
| `Feld4` | NULL |
| `Feld5` | NULL |
| `Feld6` | NULL |
| `Feld7` | NULL |
| `HauptAdresse` | Sühac GmbH

Rudolf-Diesel-Straße 3

91522 Ansbach-Brodswinden

 |
| `IhrZeichen` |  |
| `Kopftext` |  |
| `Kostenst` | 0 |
| `Kurs` | 1.0 |
| `KursDatum` | 2001-10-24 00:00:00 |
| `Leistungsort` |  |
| `LieferscheinNummer` | 23697720 |
| `LieferDatum` | 2023-10-06 00:00:00 |
| `MobileBearbeitung` | 0 |
| `NebenAdrPostfach1` | 0 |
| `NebenAdrPostfach2` | 0 |
| `NebenAdrPostfach3` | 0 |
| `Notiz` | IT | Sühac | 23697720 |
| `Nummer` | 230804 |
| `OLE` | NULL |
| `ProjektCode` | 1312768195 |
| `ProjektVorgangsCode` | 0 |
| `RECode` | 2057824350 |
| `RTFKopftext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil Arial;}}

{\*\generator Riche... (total: 154 chars) |
| `RTFSchlußtext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil Arial;}}

{\*\generator Riche... (total: 154 chars) |
| `Rücknahme` | 0 |
| `Scandatei` | NULL |
| `ScanFile` | NULL |
| `Schlußtext` |  |
| `SDObjMemberCode` | 145228141 |
| `SDObjType` | 0 |
| `Status1` | 0 |
| `Status2` | 0 |
| `Status3` | 0 |
| `Status4` | 0 |
| `Status5` | 0 |
| `UnserZeichen` | RH |
| `WaehrungCode` | 1 |
| `WartungsobjektCode` | 0 |
| `LieferterminAbgehend` | NULL |
| `Postfach` | 0 |
| `Mietdauer` | 0.0 |
| `Mietfaktor` | 1.0 |
| `Eingangslieferscheinart` | 0 |
| `NiederlassungsCode` | 0 |
| `Leistungsbeginn` | NULL |
| `Leistungsende` | NULL |
| `CreatedByLoginId` | 00000000-0000-0000-0000-000000000000 |
| `WebShopOrderDefinitionData` |  |
| `Bruttowert` | 0.00 |
| `Storniert` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |
| `HallenCode` | NULL |

---

## dbo.Einheit

<a name="dboEinheit"></a>

**Anzahl Datensätze:** 13

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Bezeichnung` | nvarchar | 50 | ✅ | - |
| `EinheitCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `EinheitChild` | int | - | ✅ | - |
| `EinheitName` | nvarchar | 30 | ✅ | - |
| `EinheitOrder` | int | - | ✅ | - |
| `Faktor` | float | - | ✅ | - |
| `Minuten` | int | - | ✅ | ((0)) |
| `EinheitERechnung` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Bezeichnung` | NULL |
| `EinheitCode` | 2 |
| `EinheitChild` | NULL |
| `EinheitName` | St. |
| `EinheitOrder` | 1 |
| `Faktor` | 0.0 |
| `Minuten` | 0 |
| `EinheitERechnung` | NULL |

---

## dbo.EKPreise

<a name="dboEKPreise"></a>

**Anzahl Datensätze:** 12,704

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtCode` | int | - | ✅ | ((0)) |
| `ArtNr` | nvarchar | 20 | ✅ | - |
| `Bestellmenge` | float | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `EAN` | int | - | ✅ | - |
| `EinheitCode` | int | - | ✅ | - |
| `EKPreis` | real | - | ✅ | ((0)) |
| `Gebindefaktor` | float | - | ✅ | ((1)) |
| `LetztePreisänderung` | datetime | - | ✅ | - |
| `Level` | int | - | ✅ | - |
| `LFCode` | int | - | ✅ | ((0)) |
| `LieferantenText` | ntext | 1073741823 | ✅ | - |
| `Lieferzeit` | int | - | ✅ | ((0)) |
| `Listenpreis` | real | - | ✅ | ((0)) |
| `MengeProEinheit` | int | - | ✅ | - |
| `Notiz` | nvarchar | -1 | ✅ | - |
| `Preisstaffel` | int | - | ✅ | ((0)) |
| `Rabatt` | real | - | ✅ | ((0)) |
| `Waehrung` | nvarchar | 10 | ✅ | - |
| `WaehrungCode` | int | - | ✅ | ((0)) |
| `Rabatt2` | float | - | ✅ | - |
| `Rabatt3` | float | - | ✅ | - |
| `Rabatt4` | float | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `ArtCode` | 1269851155 |
| `ArtNr` |  |
| `Bestellmenge` | 0.0 |
| `Code` | 29222 |
| `EAN` | NULL |
| `EinheitCode` | 2 |
| `EKPreis` | 118.6500015258789 |
| `Gebindefaktor` | 1.0 |
| `LetztePreisänderung` | 2024-04-01 00:00:00 |
| `Level` | NULL |
| `LFCode` | 2160179 |
| `LieferantenText` | NULL |
| `Lieferzeit` | 0 |
| `Listenpreis` | 237.3000030517578 |
| `MengeProEinheit` | 1 |
| `Notiz` | NULL |
| `Preisstaffel` | 0 |
| `Rabatt` | 50.0 |
| `Waehrung` | EUR |
| `WaehrungCode` | 1 |
| `Rabatt2` | 0.0 |
| `Rabatt3` | 0.0 |
| `Rabatt4` | 0.0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.EMailSignaturen

<a name="dboEMailSignaturen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `Body` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.EmailVorlagen

<a name="dboEmailVorlagen"></a>

**Anzahl Datensätze:** 7

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Art` | nvarchar | 50 | ✅ | - |
| `Attachments` | ntext | 1073741823 | ✅ | - |
| `Code` | int | - | ❌ | - |
| `Document` | nvarchar | 4000 | ✅ | - |
| `HTMLBody` | ntext | 1073741823 | ✅ | - |
| `InterneDatei` | nvarchar | 4000 | ✅ | ('') |
| `Name` | nvarchar | 100 | ✅ | - |
| `Subject` | nvarchar | 255 | ✅ | - |
| `Type` | int | - | ✅ | - |
| `Mahnvorlage` | int | - | ✅ | - |
| `Mahnstufe` | int | - | ✅ | - |
| `Gruppe` | nvarchar | 100 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Art` | 17 |
| `Attachments` | \\APPSERVER\Work4all\Mail001\2024\12\4\2537749^Allgemeine Geschäftsbedingungen.pdf/// |
| `Code` | 2537749 |
| `Document` | NULL |
| `HTMLBody` | <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-str... (total: 3319 chars) |
| `InterneDatei` |  |
| `Name` | Angebote |
| `Subject` |  |
| `Type` | 0 |
| `Mahnvorlage` | 0 |
| `Mahnstufe` | 0 |
| `Gruppe` | Vorgänge |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.EmailVorlagen2

<a name="dboEmailVorlagen2"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Art` | nvarchar | 50 | ✅ | ('') |
| `Attachments` | ntext | 1073741823 | ✅ | ('') |
| `Code` | int | - | ❌ | ((0)) |
| `HTML` | ntext | 1073741823 | ✅ | ('') |
| `InterneDatei` | nvarchar | 4000 | ✅ | ('') |
| `Name` | nvarchar | 100 | ✅ | ('') |
| `ParentVorlage` | int | - | ✅ | - |
| `SprachCode` | int | - | ✅ | - |
| `Stream` | varbinary | -1 | ✅ | - |
| `Subject` | nvarchar | 255 | ✅ | ('') |
| `Type` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Art` |  |
| `Attachments` |  |
| `Code` | 1 |
| `HTML` |  |
| `InterneDatei` | NULL |
| `Name` | Benachrichtigung |
| `ParentVorlage` | 0 |
| `SprachCode` | 0 |
| `Stream` | <binary data, 1966 bytes> |
| `Subject` | Benachrichtigung [Objekt] | [Objektnotiz] |
| `Type` | 2 |

---

## dbo.EmailVorlagen2Anhang

<a name="dboEmailVorlagen2Anhang"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((0)) |
| `Datei_Stream` | image | 2147483647 | ✅ | - |
| `Dateiname` | nvarchar | 1000 | ✅ | ('') |
| `Stream` | varbinary | -1 | ✅ | - |
| `VorlagenCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.EMailVorlagen3

<a name="dboEMailVorlagen3"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `Betreff` | nvarchar | 500 | ✅ | - |
| `Body` | nvarchar | -1 | ✅ | - |
| `SignaturId` | uniqueidentifier | - | ✅ | - |
| `SignaturMode` | int | - | ✅ | - |
| `VorlagenArt` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `LegacyTemplateCode` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `GroupId` | uniqueidentifier | - | ✅ | - |
| `LanguageCode` | int | - | ✅ | - |
| `ParentId` | uniqueidentifier | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.EMailVorlagen3Anhang

<a name="dboEMailVorlagen3Anhang"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Dateiname` | nvarchar | 255 | ✅ | - |
| `Name` | nvarchar | 255 | ✅ | - |
| `VorlagenId` | uniqueidentifier | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.EMailVorlagenGruppen

<a name="dboEMailVorlagenGruppen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Name` | nvarchar | 200 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.EntitySchema

<a name="dboEntitySchema"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `EntityName` | nvarchar | 200 | ✅ | - |
| `JsonSchema` | nvarchar | -1 | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.EntitySchema2

<a name="dboEntitySchema2"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `EntityName` | nvarchar | 200 | ✅ | - |
| `JsonSchema` | nvarchar | -1 | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ERPAnhänge

<a name="dboERPAnhänge"></a>

**Anzahl Datensätze:** 14,004

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BZObjType` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `DateiErweiterung` | nvarchar | 50 | ✅ | - |
| `Dateiname` | nvarchar | 500 | ✅ | - |
| `OriginalDateiname` | nvarchar | 500 | ✅ | - |
| `LastModificationDate` | datetime | - | ✅ | - |
| `Pfad` | nvarchar | 1000 | ✅ | - |
| `MailVersand` | int | - | ✅ | ((0)) |
| `MailMerge` | int | - | ✅ | - |
| `Rechnungsbegruendend` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `BZObjType` | 9 |
| `BZObjMemberCode` | 1387550380 |
| `Code` | 129117 |
| `DateiErweiterung` | .pdf |
| `Dateiname` | 3818f762-e326-4af9-a89e-b8238737fd11 |
| `OriginalDateiname` | Freigabe Auftrag 330126046.pdf |
| `LastModificationDate` | NULL |
| `Pfad` | \\APPSERVER\Work4all\ |
| `MailVersand` | 0 |
| `MailMerge` | 0 |
| `Rechnungsbegruendend` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `BenutzerCode` | NULL |

---

## dbo.Etikettendruck

<a name="dboEtikettendruck"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelCode` | int | - | ✅ | - |
| `Artikelname` | nvarchar | 250 | ✅ | - |
| `Artikelnummer` | nvarchar | 250 | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `Charge` | nvarchar | 250 | ✅ | - |
| `Chargenbemerkung` | nvarchar | 250 | ✅ | - |
| `Chargenverfallsdatum` | nvarchar | 50 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Eingangslieferscheindatum` | datetime | - | ✅ | - |
| `Eingangslieferscheinnummer` | nvarchar | 250 | ✅ | - |
| `Index` | int | - | ✅ | - |
| `Lieferant` | nvarchar | 250 | ✅ | - |
| `Lieferdatum` | nvarchar | 250 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Verfallsdatum` | datetime | - | ✅ | - |
| `WareneingangCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Events

<a name="dboEvents"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `CreationDate` | datetime | - | ✅ | - |
| `EventType` | int | - | ✅ | - |
| `ObjectId` | nvarchar | 36 | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `ParentId` | uniqueidentifier | - | ✅ | - |
| `Payload` | nvarchar | -1 | ✅ | - |
| `TransactionId` | nvarchar | 42 | ✅ | - |
| `UserCode` | int | - | ✅ | - |
| `ParentObjectId` | nvarchar | 36 | ✅ | - |
| `ParentObjectType` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Favoriten

<a name="dboFavoriten"></a>

**Anzahl Datensätze:** 52

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | uniqueidentifier | - | ❌ | - |
| `ObjArt` | int | - | ✅ | ((0)) |
| `ObjCode` | int | - | ✅ | ((0)) |
| `ObjId` | uniqueidentifier | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Kommentar` | nvarchar | -1 | ✅ | ('') |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `ID` | 4ACFF0D8-29C0-42D5-9795-00FE879D8549 |
| `ObjArt` | 74 |
| `ObjCode` | 1001768144 |
| `ObjId` | 00000000-0000-0000-0000-000000000000 |
| `BenutzerCode` | 581413548 |
| `Datum` | 2025-11-06 14:34:27.763000 |
| `Kommentar` |  |

---

## dbo.Feiertage

<a name="dboFeiertage"></a>

**Anzahl Datensätze:** 248

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Bezeichnung` | nvarchar | 50 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Bezeichnung` | Heilige Drei Könige |
| `Code` | 1418573 |
| `Datum` | 2010-01-06 00:00:00 |

---

## dbo.FileContentCatalogue

<a name="dboFileContentCatalogue"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Content` | nvarchar | -1 | ✅ | - |
| `FileDate` | datetime | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `ObjectCode` | int | - | ✅ | - |
| `ObjectId` | uniqueidentifier | - | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.FileLink

<a name="dboFileLink"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `FileLinkType` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Link` | nvarchar | -1 | ✅ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Folders

<a name="dboFolders"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `LVCode` | int | - | ✅ | - |
| `Path` | nvarchar | 4000 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjMemberType` | int | - | ✅ | - |
| `Type` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Forecast

<a name="dboForecast"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `BCodeAngelegt` | int | - | ✅ | - |
| `BCodeVerantwortlich` | int | - | ✅ | - |
| `DatumAngelegt` | datetime | - | ✅ | - |
| `ForecastBeginn` | datetime | - | ✅ | - |
| `ForecastEnde` | datetime | - | ✅ | - |
| `LastArtikelfilter` | nvarchar | 500 | ✅ | - |
| `LastKundenfilter` | nvarchar | 500 | ✅ | - |
| `LastArtikelfilterCaption` | nvarchar | 200 | ✅ | - |
| `LastKundenfilterCaption` | nvarchar | 200 | ✅ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | ('') |
| `ProjektCode` | int | - | ✅ | - |
| `ProjektcodeVergleich` | int | - | ✅ | - |
| `Status` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ForecastFilter

<a name="dboForecastFilter"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Art` | int | - | ✅ | - |
| `ArtikelKategorienCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `ForecastCode` | int | - | ✅ | - |
| `KundenGrCode` | nvarchar | -1 | ✅ | - |
| `Name` | nvarchar | 300 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ForecastSoll

<a name="dboForecastSoll"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelKategorienCode` | int | - | ✅ | - |
| `BCodeAngelegt` | int | - | ✅ | - |
| `BCodeSoll` | int | - | ✅ | - |
| `Code` | int | - | ❌ | - |
| `DatumÄnderung` | datetime | - | ✅ | - |
| `ForecastCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | ('') |
| `ProjektCode` | int | - | ✅ | - |
| `SDObjmemberCode` | int | - | ✅ | - |
| `Sollmenge` | float | - | ✅ | - |
| `Sollwert` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ForecastSollMonate

<a name="dboForecastSollMonate"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((0)) |
| `DatumÄnderung` | datetime | - | ✅ | - |
| `Sollmenge` | float | - | ✅ | - |
| `Sollwert` | float | - | ✅ | - |
| `BCodeAngelegt` | int | - | ✅ | - |
| `BCodeSoll` | int | - | ✅ | - |
| `Jahr` | int | - | ✅ | - |
| `Monat` | int | - | ✅ | - |
| `Row` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.FreigabeBZObject

<a name="dboFreigabeBZObject"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `FreigabeArt` | int | - | ✅ | - |
| `Kommentar` | nvarchar | -1 | ✅ | - |
| `Vorgang` | nvarchar | 200 | ✅ | - |
| `ZusammenstellungCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Gerätethemen

<a name="dboGerätethemen"></a>

**Anzahl Datensätze:** 14

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KNObjType` | int | - | ✅ | - |
| `Name` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `KNObjType` | NULL |
| `Name` | 01 Erstkontaktgespräch |

---

## dbo.GerätethemenMark

<a name="dboGerätethemenMark"></a>

**Anzahl Datensätze:** 5,703

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GerätethemenCode` | int | - | ✅ | - |
| `ObjArt` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 130129 |
| `GerätethemenCode` | 1119532420 |
| `ObjArt` | 0 |
| `ObjCode` | 198618016 |

---

## dbo.Gesprächspunkte

<a name="dboGesprächspunkte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `APCode` | int | - | ✅ | ((0)) |
| `Art` | int | - | ✅ | - |
| `BisWann` | datetime | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Erledigt` | int | - | ✅ | - |
| `Erledigung` | ntext | 1073741823 | ✅ | - |
| `IsBenutzer` | int | - | ✅ | ((0)) |
| `KCode` | int | - | ✅ | ((0)) |
| `KNBerichtCode` | int | - | ✅ | - |
| `Nummer` | int | - | ✅ | ((0)) |
| `OK` | int | - | ✅ | ((0)) |
| `PozNr` | nvarchar | 20 | ✅ | - |
| `Thema` | ntext | 1073741823 | ✅ | - |
| `ThemenCode` | int | - | ✅ | ((0)) |
| `Vereinbarung` | nvarchar | 200 | ✅ | - |
| `Wer` | nvarchar | 35 | ✅ | - |
| `WhattodoCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.GestarteteArbeit

<a name="dboGestarteteArbeit"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `KundeCode` | int | - | ✅ | ((0)) |
| `AuftragCode` | int | - | ✅ | ((0)) |
| `PositionCode` | int | - | ✅ | ((0)) |
| `TätigkeitCode` | int | - | ✅ | ((0)) |
| `Notiz` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Hallen

<a name="dboHallen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `HallenName` | nvarchar | 100 | ✅ | - |
| `SdObjMemberCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | 1000 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.HallenBelegung

<a name="dboHallenBelegung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `HallenCode` | int | - | ✅ | - |
| `SdObjMemberCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Historie

<a name="dboHistorie"></a>

**Anzahl Datensätze:** 6,399

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Aktion` | nvarchar | 500 | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BZObjType` | int | - | ✅ | ((0)) |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Person` | nvarchar | 100 | ✅ | - |
| `SDObjMembercode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Aktion` | Übernahme ins Rechnungsausgangsbuch:  230354 |
| `Code` | 126599 |
| `BZObjType` | 7 |
| `BZObjMemberCode` | 124895287 |
| `Datum` | 2023-06-20 14:48:28.597000 |
| `Person` | Jolanta Stolarczyk |
| `SDObjMembercode` | 0 |

---

## dbo.Historie2

<a name="dboHistorie2"></a>

**Anzahl Datensätze:** 337,715

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Art` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `ObjectCode` | int | - | ✅ | ((0)) |
| `ObjectName` | nvarchar | 100 | ✅ | ('') |
| `ParentObjectCode` | int | - | ✅ | ((0)) |
| `PCName` | nvarchar | 100 | ✅ | ('') |
| `ShadowCopy` | ntext | 1073741823 | ✅ | ('') |
| `StackTrace` | ntext | 1073741823 | ✅ | ('') |
| `Id` | uniqueidentifier | - | ❌ | (newid()) |
| `ObjectId` | uniqueidentifier | - | ✅ | - |
| `ParentObjectId` | uniqueidentifier | - | ✅ | - |
| `Kommentar` | nvarchar | 1000 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Art` | 0 |
| `BenutzerCode` | 581413548 |
| `Datum` | 2023-01-31 16:30:54.910000 |
| `ObjectCode` | 1698159162 |
| `ObjectName` | Angebot |
| `ParentObjectCode` | 0 |
| `PCName` | PC001 |
| `ShadowCopy` |  |
| `StackTrace` |  |
| `Id` | DA8C6D32-2DAC-49EF-86A3-00002600FA2E |
| `ObjectId` | 00000000-0000-0000-0000-000000000000 |
| `ParentObjectId` | NULL |
| `Kommentar` | NULL |

---

## dbo.Historie2Item

<a name="dboHistorie2Item"></a>

**Anzahl Datensätze:** 276,958

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Historie2Code` | int | - | ✅ | ((0)) |
| `PropertyAnzeigename` | nvarchar | 100 | ✅ | ('') |
| `PropertyName` | nvarchar | 100 | ✅ | ('') |
| `PropertyType` | nvarchar | 100 | ✅ | ('') |
| `WertAlt` | nvarchar | 4000 | ✅ | ('') |
| `WertNeu` | nvarchar | 4000 | ✅ | ('') |
| `Id` | uniqueidentifier | - | ❌ | (newid()) |
| `Historie2Id` | uniqueidentifier | - | ✅ | - |
| `ObjectCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Historie2Code` | 0 |
| `PropertyAnzeigename` | Liefertermin |
| `PropertyName` | Position 1.1 | Maße: 546 x 1206 mm |
| `PropertyType` | System.DateTime |
| `WertAlt` | NULL |
| `WertNeu` | 02.10.2025 |
| `Id` | D18F6398-4377-4C6E-94A7-000054D53B33 |
| `Historie2Id` | 3040E03D-5744-4ECC-A499-FD3199B8556D |
| `ObjectCode` | 1478804777 |

---

## dbo.IncomingMailBlockedSender

<a name="dboIncomingMailBlockedSender"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Address` | nvarchar | 300 | ✅ | - |
| `MailboxId` | uniqueidentifier | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.IndividualFields

<a name="dboIndividualFields"></a>

**Anzahl Datensätze:** 13

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((0)) |
| `Control` | nvarchar | 50 | ✅ | - |
| `DisplayOrder` | int | - | ✅ | - |
| `FieldNumber` | int | - | ✅ | - |
| `IndividualPageCode` | int | - | ✅ | - |
| `Pflichtfeld` | int | - | ✅ | - |
| `TableType` | nvarchar | 250 | ✅ | - |
| `Title` | nvarchar | 4000 | ✅ | - |
| `Tooltip` | nvarchar | 4000 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1032893 |
| `Control` | Combo |
| `DisplayOrder` | 0 |
| `FieldNumber` | 1 |
| `IndividualPageCode` | 0 |
| `Pflichtfeld` | 1 |
| `TableType` | Projekte |
| `Title` | Akt vorhanden;;;0```Ja;;;1```Nein;;;2```Noch anlegen;;; |
| `Tooltip` | Auswählen, ob ein Hängeakt angelegt wurde oder nicht |

---

## dbo.IndividualFieldsAnzeige

<a name="dboIndividualFieldsAnzeige"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BZObjType` | int | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Fieldnumber` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.IndividualFieldValues

<a name="dboIndividualFieldValues"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Seriennummer` | nvarchar | 500 | ✅ | ('') |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Feld` | int | - | ✅ | ((0)) |
| `Value` | nvarchar | -1 | ✅ | ('') |
| `WareneingangCode` | int | - | ✅ | ((0)) |
| `DateValue` | datetime | - | ✅ | - |
| `NumericValue` | decimal | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.IndividualPageRights

<a name="dboIndividualPageRights"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Anschauen` | int | - | ✅ | - |
| `Bearbeiten` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `IndividualPageCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.IndividualPages

<a name="dboIndividualPages"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 100 | ✅ | - |
| `TableType` | nvarchar | 100 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Infoblätter

<a name="dboInfoblätter"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | nvarchar | 4000 | ❌ | ('') |
| `Name` | nvarchar | 150 | ✅ | ('') |
| `Pfad` | nvarchar | 260 | ✅ | ('') |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.InfoblätterZuordnung

<a name="dboInfoblätterZuordnung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `FormName` | nvarchar | 100 | ✅ | ('') |
| `InfoblattCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.InlineReport

<a name="dboInlineReport"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `Data` | varbinary | -1 | ✅ | - |
| `LastModificationDate` | datetime | - | ✅ | - |
| `GlobalId` | uniqueidentifier | - | ✅ | - |
| `Kategorie` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Insights

<a name="dboInsights"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `AnsprechpCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `DetailKlassifizierung` | nvarchar | 20 | ✅ | - |
| `GesamtKlassifizierung` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Inventar

<a name="dboInventar"></a>

**Anzahl Datensätze:** 57

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `InventarNr` | int | - | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `Bezeichnung` | nvarchar | 70 | ✅ | - |
| `Kaufpreis` | float | - | ✅ | - |
| `Kaufdatum` | datetime | - | ✅ | - |
| `Baujahr` | int | - | ✅ | - |
| `Garantie` | datetime | - | ✅ | - |
| `Zustand` | nvarchar | 50 | ✅ | - |
| `Arbeitsplatz` | nvarchar | 50 | ✅ | - |
| `Ort` | nvarchar | 50 | ✅ | - |
| `SerienNr` | nvarchar | 50 | ✅ | - |
| `GeräteNr` | nvarchar | 50 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `FibuInventarNr` | nvarchar | 30 | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `CreationDate` | datetime | - | ✅ | - |
| `Filiale` | int | - | ✅ | - |
| `Kost1` | int | - | ✅ | - |
| `Kost2` | int | - | ✅ | - |
| `AfaArt` | nvarchar | 50 | ✅ | - |
| `Nutzungsart` | nvarchar | 50 | ✅ | - |
| `ND` | float | - | ✅ | - |
| `RND` | float | - | ✅ | - |
| `Restbegünstigung` | float | - | ✅ | - |
| `AktuellerWert` | float | - | ✅ | - |
| `WertDatum` | datetime | - | ✅ | - |
| `KontoNr` | nvarchar | 30 | ✅ | - |
| `Ressource` | int | - | ✅ | - |
| `Bestellnummer` | nvarchar | 20 | ✅ | - |
| `Rechnungsnummer` | nvarchar | 20 | ✅ | - |
| `RECode` | int | - | ✅ | - |
| `InventarNrExtern` | nvarchar | 50 | ✅ | - |
| `VerwertungArt` | int | - | ✅ | - |
| `VerwertungRACode` | int | - | ✅ | - |
| `VerwertungGenehmigt` | int | - | ✅ | - |
| `VerwertungDatum` | datetime | - | ✅ | - |
| `LabelPrinted` | datetime | - | ✅ | - |
| `W4AReCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1312137 |
| `InventarNr` | 9 |
| `GrCode` | 1711744567 |
| `Bezeichnung` | Fiat Punto AS-JS 114 |
| `Kaufpreis` | 0.0 |
| `Kaufdatum` | 2023-02-25 00:00:00 |
| `Baujahr` | 2023 |
| `Garantie` | NULL |
| `Zustand` | gebraucht |
| `Arbeitsplatz` | NULL |
| `Ort` | NULL |
| `SerienNr` | NULL |
| `GeräteNr` | NULL |
| `SDObjMemberCode` | 0 |
| `FibuInventarNr` | 9 |
| `Notiz` | NULL |
| `BCode` | 1364566387 |
| `CreationDate` | 2023-02-25 00:00:00 |
| `Filiale` | 0 |
| `Kost1` | 0 |
| `Kost2` | 0 |
| `AfaArt` | linear |
| `Nutzungsart` |  |
| `ND` | 20.0 |
| `RND` | 0.0 |
| `Restbegünstigung` | 0.0 |
| `AktuellerWert` | 0.0 |
| `WertDatum` | NULL |
| `KontoNr` | NULL |
| `Ressource` | 0 |
| `Bestellnummer` | NULL |
| `Rechnungsnummer` | NULL |
| `RECode` | 0 |
| `InventarNrExtern` |  |
| `VerwertungArt` | 0 |
| `VerwertungRACode` | 0 |
| `VerwertungGenehmigt` | 0 |
| `VerwertungDatum` | NULL |
| `LabelPrinted` | NULL |
| `W4AReCode` | 0 |

---

## dbo.InventarGr

<a name="dboInventarGr"></a>

**Anzahl Datensätze:** 60

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrName` | nvarchar | 70 | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrIndex` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `GrCode` | 1419188 |
| `GrName` | Kabel - Bohrmaschine |
| `GrLevel` | 3 |
| `GrIndex` | 33 |

---

## dbo.InventurData

<a name="dboInventurData"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `InventurCode` | int | - | ✅ | - |
| `InventarNr` | int | - | ✅ | - |
| `Menge` | int | - | ✅ | - |
| `Vorhanden` | int | - | ✅ | - |
| `Wert` | float | - | ✅ | - |
| `Bezeichnung` | nvarchar | 250 | ✅ | - |
| `Baujahr` | int | - | ✅ | - |
| `GeräteNr` | nvarchar | 50 | ✅ | - |
| `Notiz` | nvarchar | 250 | ✅ | - |
| `IventarCodeExtern` | nvarchar | 100 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Inventuren

<a name="dboInventuren"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Datum` | datetime | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | 500 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `PersonName` | nvarchar | 100 | ✅ | - |
| `Titel` | nvarchar | 100 | ✅ | - |
| `InventurTyp` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.InventurGr

<a name="dboInventurGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrName` | nvarchar | 70 | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrIndex` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Kalkulation

<a name="dboKalkulation"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Nummer` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Kostenst` | int | - | ✅ | - |
| `IhrZeichen` | nvarchar | 50 | ✅ | - |
| `UnserZeichen` | nvarchar | 50 | ✅ | - |
| `BisDatum` | datetime | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `AnsprpCode` | int | - | ✅ | - |
| `AbteilungCode` | int | - | ✅ | - |
| `NebenAdrCode1` | int | - | ✅ | - |
| `NebenAdrCode2` | int | - | ✅ | - |
| `NebenAdrCode3` | int | - | ✅ | - |
| `NebenAdrText1` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText2` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText3` | ntext | 1073741823 | ✅ | - |
| `NebenAdrType1` | int | - | ✅ | - |
| `NebenAdrType2` | int | - | ✅ | - |
| `NebenAdrType3` | int | - | ✅ | - |
| `NebenAdrApCode1` | int | - | ✅ | - |
| `NebenAdrApCode2` | int | - | ✅ | - |
| `NebenAdrApCode3` | int | - | ✅ | - |
| `NebenAdrAbteilungCode1` | int | - | ✅ | - |
| `NebenAdrAbteilungCode2` | int | - | ✅ | - |
| `NebenAdrAbteilungCode3` | int | - | ✅ | - |
| `NebenAdrPostfach1` | int | - | ✅ | - |
| `NebenAdrPostfach2` | int | - | ✅ | - |
| `NebenAdrPostfach3` | int | - | ✅ | - |
| `Kopftext` | ntext | 1073741823 | ✅ | - |
| `Schlußtext` | ntext | 1073741823 | ✅ | - |
| `AutNummer` | int | - | ✅ | - |
| `Zahlungsfrist` | int | - | ✅ | - |
| `Skonto` | float | - | ✅ | - |
| `Skontofrist` | float | - | ✅ | - |
| `Status1` | int | - | ✅ | - |
| `Status2` | int | - | ✅ | - |
| `Status3` | int | - | ✅ | - |
| `Status4` | int | - | ✅ | - |
| `Status5` | int | - | ✅ | - |
| `Eingefroren` | int | - | ✅ | - |
| `WaehrungCode` | int | - | ✅ | - |
| `Kurs` | float | - | ✅ | - |
| `KursDatum` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Brutto` | int | - | ✅ | - |
| `Preisgruppe` | int | - | ✅ | - |
| `ZahlungsCode` | int | - | ✅ | - |
| `RTFKopftext` | ntext | 1073741823 | ✅ | - |
| `RTFSchlusstext` | ntext | 1073741823 | ✅ | - |
| `DB` | float | - | ✅ | - |
| `Kalkulation` | int | - | ✅ | - |
| `SprachCode` | int | - | ✅ | - |
| `Postfach` | int | - | ✅ | - |
| `Datei` | nvarchar | 500 | ✅ | - |
| `Briefdatei` | varbinary | 8000 | ✅ | - |
| `karrenberg` | nvarchar | 4000 | ✅ | - |
| `Abgeschlossen` | int | - | ✅ | - |
| `BenutzerCode2` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `VerteilerCode` | int | - | ✅ | - |
| `Freigabe` | int | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `LFCode` | int | - | ✅ | - |
| `Wert` | float | - | ✅ | - |
| `Feld1` | nvarchar | 500 | ✅ | - |
| `Feld2` | nvarchar | 500 | ✅ | - |
| `Feld3` | nvarchar | 500 | ✅ | - |
| `Feld4` | nvarchar | 500 | ✅ | - |
| `Feld5` | nvarchar | 500 | ✅ | - |
| `Feld6` | nvarchar | 500 | ✅ | - |
| `Feld7` | nvarchar | 500 | ✅ | - |
| `Skonto2` | float | - | ✅ | - |
| `Skontofrist2` | float | - | ✅ | - |
| `HauptAdresse` | ntext | 1073741823 | ✅ | ('') |
| `Leistungsort` | nvarchar | 100 | ✅ | ('') |
| `WartungsobjektCode` | int | - | ✅ | ((0)) |
| `MobileBearbeitung` | int | - | ✅ | ((0)) |
| `APP_UnterschriebenVon` | nvarchar | 4000 | ✅ | ('') |
| `EditDate` | datetime | - | ✅ | - |
| `LieferterminAbgehend` | datetime | - | ✅ | - |
| `Dispositionsbeginn` | datetime | - | ✅ | - |
| `Dispositionsende` | datetime | - | ✅ | - |
| `TourCode` | int | - | ✅ | ((0)) |
| `Mietdauer` | float | - | ✅ | - |
| `Mietfaktor` | float | - | ✅ | - |
| `NiederlassungsCode` | int | - | ✅ | ((0)) |
| `Leistungsbeginn` | datetime | - | ✅ | - |
| `Leistungsende` | datetime | - | ✅ | - |
| `CreatedByLoginId` | uniqueidentifier | - | ✅ | - |
| `WebShopOrderDefinitionData` | nvarchar | -1 | ✅ | ('') |
| `Nebenadresse3Geändert` | int | - | ✅ | - |
| `Bruttowert` | decimal | - | ✅ | - |
| `ShopGenehmigt` | int | - | ✅ | - |
| `ShopGenehmigtDatum` | datetime | - | ✅ | - |
| `ShopGenehmigtDurchLoginId` | uniqueidentifier | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `Auftragsbeginn` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `HallenCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1475002342 |
| `Nummer` | 220001 |
| `SDObjMemberCode` | 1845218 |
| `SDObjType` | 1 |
| `Datum` | 2022-10-04 00:00:00 |
| `Kostenst` | 0 |
| `IhrZeichen` |  |
| `UnserZeichen` | RH |
| `BisDatum` | NULL |
| `ProjektCode` | 1581101078 |
| `Notiz` | DKF | HT |
| `AnsprpCode` | 0 |
| `AbteilungCode` | 0 |
| `NebenAdrCode1` | 1845218 |
| `NebenAdrCode2` | 1845218 |
| `NebenAdrCode3` | 1845218 |
| `NebenAdrText1` | Herr

Sven Bittkau

Einthaler Weg 13

93083 Obertraubling

 |
| `NebenAdrText2` | Herr

Sven Bittkau

Einthaler Weg 13

93083 Obertraubling

 |
| `NebenAdrText3` | Herr

Sven Bittkau

Einthaler Weg 13

93083 Obertraubling

 |
| `NebenAdrType1` | 1 |
| `NebenAdrType2` | 1 |
| `NebenAdrType3` | 1 |
| `NebenAdrApCode1` | 0 |
| `NebenAdrApCode2` | 0 |
| `NebenAdrApCode3` | 0 |
| `NebenAdrAbteilungCode1` | 0 |
| `NebenAdrAbteilungCode2` | 0 |
| `NebenAdrAbteilungCode3` | 0 |
| `NebenAdrPostfach1` | 0 |
| `NebenAdrPostfach2` | 0 |
| `NebenAdrPostfach3` | 0 |
| `Kopftext` |  |
| `Schlußtext` |  |
| `AutNummer` | -1 |
| `Zahlungsfrist` | 14 |
| `Skonto` | 0.0 |
| `Skontofrist` | 0.0 |
| `Status1` | 0 |
| `Status2` | 0 |
| `Status3` | 0 |
| `Status4` | 0 |
| `Status5` | 0 |
| `Eingefroren` | 0 |
| `WaehrungCode` | 1 |
| `Kurs` | 1.0 |
| `KursDatum` | 2001-10-24 00:00:00 |
| `BenutzerCode` | 581413548 |
| `Brutto` | 0 |
| `Preisgruppe` | 0 |
| `ZahlungsCode` | 0 |
| `RTFKopftext` |  |
| `RTFSchlusstext` |  |
| `DB` | NULL |
| `Kalkulation` | NULL |
| `SprachCode` | 0 |
| `Postfach` | 0 |
| `Datei` | NULL |
| `Briefdatei` | NULL |
| `karrenberg` | NULL |
| `Abgeschlossen` | 0 |
| `BenutzerCode2` | 22209630 |
| `LookupCode` | 0 |
| `VerteilerCode` | NULL |
| `Freigabe` | NULL |
| `ObjGrCode` | NULL |
| `LFCode` | NULL |
| `Wert` | 13548.53 |
| `Feld1` | NULL |
| `Feld2` | NULL |
| `Feld3` | NULL |
| `Feld4` | NULL |
| `Feld5` | NULL |
| `Feld6` | NULL |
| `Feld7` | NULL |
| `Skonto2` | NULL |
| `Skontofrist2` | NULL |
| `HauptAdresse` | Herr

Sven Bittkau

Einthaler Weg 13

93083 Obertraubling

 |
| `Leistungsort` |  |
| `WartungsobjektCode` | 0 |
| `MobileBearbeitung` | 0 |
| `APP_UnterschriebenVon` |  |
| `EditDate` | 2022-10-04 08:29:59.160000 |
| `LieferterminAbgehend` | NULL |
| `Dispositionsbeginn` | NULL |
| `Dispositionsende` | NULL |
| `TourCode` | 0 |
| `Mietdauer` | 0.0 |
| `Mietfaktor` | 1.0 |
| `NiederlassungsCode` | 0 |
| `Leistungsbeginn` | NULL |
| `Leistungsende` | NULL |
| `CreatedByLoginId` | 00000000-0000-0000-0000-000000000000 |
| `WebShopOrderDefinitionData` |  |
| `Nebenadresse3Geändert` | 0 |
| `Bruttowert` | 16122.75 |
| `ShopGenehmigt` | 0 |
| `ShopGenehmigtDatum` | NULL |
| `ShopGenehmigtDurchLoginId` | 00000000-0000-0000-0000-000000000000 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `Auftragsbeginn` | NULL |
| `CreatedByUserCode` | NULL |
| `HallenCode` | NULL |

---

## dbo.KAnsprechp

<a name="dboKAnsprechp"></a>

**Anzahl Datensätze:** 1,152

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `KAnsprechpCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KundenCode` | int | - | ✅ | - |
| `AnredeCode` | int | - | ✅ | - |
| `Vorname` | nvarchar | 30 | ✅ | - |
| `Name` | nvarchar | 30 | ✅ | - |
| `Telefon` | nvarchar | 50 | ✅ | - |
| `Telefon2` | nvarchar | 50 | ✅ | - |
| `Telefon3` | nvarchar | 50 | ✅ | - |
| `Telefax` | nvarchar | 50 | ✅ | - |
| `Briefanrede` | nvarchar | 50 | ✅ | - |
| `Funktion` | nvarchar | 50 | ✅ | - |
| `AbteilungCode` | int | - | ✅ | - |
| `Straße` | nvarchar | 100 | ✅ | - |
| `Staat` | nvarchar | 20 | ✅ | - |
| `Plz` | nvarchar | 50 | ✅ | - |
| `Ort` | nvarchar | 50 | ✅ | - |
| `Mobilfunk` | nvarchar | 50 | ✅ | - |
| `AdreßErweiterung` | nvarchar | 50 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `E-Mail` | nvarchar | 150 | ✅ | - |
| `MailanPrivat` | int | - | ✅ | ((0)) |
| `TelPrivat` | nvarchar | 50 | ✅ | - |
| `FaxPrivat` | nvarchar | 50 | ✅ | - |
| `Geburtsdatum` | datetime | - | ✅ | - |
| `OutlookAdresse` | int | - | ✅ | ((0)) |
| `SenderName` | nvarchar | 50 | ✅ | - |
| `Entlassen` | int | - | ✅ | ((0)) |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `eMailPrivat` | nvarchar | 150 | ✅ | - |
| `BCodeErstkontakt` | int | - | ✅ | ((0)) |
| `BCodeLetzteÄnderung` | int | - | ✅ | ((0)) |
| `I_LogName` | nvarchar | 50 | ✅ | - |
| `GeburtstagTag` | int | - | ✅ | ((0)) |
| `GeburtstagMonat` | int | - | ✅ | ((0)) |
| `GeburtstagJahr` | int | - | ✅ | ((0)) |
| `VIP` | int | - | ✅ | - |
| `Serienbriefsperre` | int | - | ✅ | - |
| `Mailsperre` | int | - | ✅ | - |
| `Titelerweiterung` | nvarchar | 50 | ✅ | - |
| `Namenserweiterung` | nvarchar | 30 | ✅ | - |
| `Erstkontakt` | datetime | - | ✅ | - |
| `PrimäreAdresse` | int | - | ✅ | - |
| `FirmenAdresse` | int | - | ✅ | - |
| `AbteilungInAdresseZeigen` | int | - | ✅ | - |
| `FunktionInAdresseZeigen` | int | - | ✅ | - |
| `Skypename` | nvarchar | 50 | ✅ | - |
| `MobilPrivat` | nvarchar | 50 | ✅ | - |
| `NotizRTF` | nvarchar | 4000 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `KAnsprechpCode` | 2012424 |
| `KundenCode` | 831472698 |
| `AnredeCode` | 3 |
| `Vorname` | Peter |
| `Name` | Schiegerl |
| `Telefon` |  |
| `Telefon2` |  |
| `Telefon3` |  |
| `Telefax` |  |
| `Briefanrede` | Sehr geehrter Herr Schiegerl, |
| `Funktion` | Geschäftsführung |
| `AbteilungCode` | 0 |
| `Straße` |  |
| `Staat` |  |
| `Plz` |  |
| `Ort` |  |
| `Mobilfunk` | +49-172-8963910 |
| `AdreßErweiterung` |  |
| `Notiz` |  |
| `E-Mail` | p.schiegerl@schiegerl-hausverwaltung.de |
| `MailanPrivat` | 0 |
| `TelPrivat` |  |
| `FaxPrivat` |  |
| `Geburtsdatum` | NULL |
| `OutlookAdresse` | 0 |
| `SenderName` |  |
| `Entlassen` | 0 |
| `LetzteÄnderung` | 2023-01-20 08:57:10.257000 |
| `eMailPrivat` |  |
| `BCodeErstkontakt` | 888797748 |
| `BCodeLetzteÄnderung` | 888797748 |
| `I_LogName` | NULL |
| `GeburtstagTag` | 0 |
| `GeburtstagMonat` | 0 |
| `GeburtstagJahr` | 0 |
| `VIP` | 0 |
| `Serienbriefsperre` | 0 |
| `Mailsperre` | 0 |
| `Titelerweiterung` |  |
| `Namenserweiterung` |  |
| `Erstkontakt` | 2021-11-15 14:37:18.493000 |
| `PrimäreAdresse` | 0 |
| `FirmenAdresse` | 0 |
| `AbteilungInAdresseZeigen` | 0 |
| `FunktionInAdresseZeigen` | 0 |
| `Skypename` | NULL |
| `MobilPrivat` |  |
| `NotizRTF` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil Arial;}}

{\*\generator Riche... (total: 154 chars) |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.Kasse

<a name="dboKasse"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | varchar | 50 | ✅ | - |
| `Angelegt` | datetime | - | ✅ | - |
| `Produktion` | varchar | 50 | ✅ | - |
| `Ort` | varchar | 50 | ✅ | - |
| `Gesperrt` | int | - | ✅ | ((0)) |
| `Art` | int | - | ✅ | ((0)) |
| `GesperrtDatum` | datetime | - | ✅ | - |
| `Notiz` | text | 2147483647 | ✅ | - |
| `Sollbetrag` | int | - | ✅ | ((0)) |
| `Kostenstelle` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KasseEinAuszahlung

<a name="dboKasseEinAuszahlung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Art` | int | - | ✅ | - |
| `KasseId` | nvarchar | 50 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Betrag` | decimal | - | ✅ | - |
| `Notiz` | nvarchar | 500 | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Kassenabschluss

<a name="dboKassenabschluss"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Datum` | datetime | - | ✅ | - |
| `KassenId` | nvarchar | 200 | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Kassenstart` | datetime | - | ✅ | - |
| `AnzahlBarzahlungen` | int | - | ✅ | - |
| `AnzahlEinzahlungen` | int | - | ✅ | - |
| `AnzahlKartenzahlungen` | int | - | ✅ | - |
| `AnzahlStorno` | int | - | ✅ | - |
| `AnzahlAuszahlungen` | int | - | ✅ | - |
| `SummeBarzahlungen` | decimal | - | ✅ | - |
| `SummeKartenzahlungen` | decimal | - | ✅ | - |
| `SummeEinzahlungen` | decimal | - | ✅ | - |
| `SummeAuszahlungen` | decimal | - | ✅ | - |
| `SummeStorno` | decimal | - | ✅ | - |
| `BestandBarSoll` | decimal | - | ✅ | - |
| `BestandBarGezaehlt` | decimal | - | ✅ | - |
| `Umsatz` | decimal | - | ✅ | - |
| `SummeKassenstart` | decimal | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KassenabschlussDetails

<a name="dboKassenabschlussDetails"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Art` | int | - | ✅ | - |
| `RechnungCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | 2000 | ✅ | - |
| `Betrag` | decimal | - | ✅ | - |
| `Gegeben` | decimal | - | ✅ | - |
| `Kartenzahlung` | int | - | ✅ | - |
| `KassenabschlussId` | uniqueidentifier | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KassenBelege

<a name="dboKassenBelege"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KassenCode` | int | - | ✅ | ((0)) |
| `Bezeichnung` | varchar | 50 | ✅ | - |
| `Nummer` | int | - | ✅ | ((0)) |
| `BetragNetto` | float | - | ✅ | ((0)) |
| `BetragMwst` | float | - | ✅ | ((0)) |
| `BetragBrutto` | float | - | ✅ | ((0)) |
| `WaehrungCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `Gegenkonto` | int | - | ✅ | ((0)) |
| `Abrechnungsnummer` | int | - | ✅ | ((0)) |
| `Status` | int | - | ✅ | ((0)) |
| `Steuerschlüssel` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `ErfasstAm` | datetime | - | ✅ | - |
| `Abgelehnt` | int | - | ✅ | - |
| `Buchungsdatum` | datetime | - | ✅ | - |
| `Belegdatum` | datetime | - | ✅ | - |
| `Kostenstelle` | int | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `Freigabe` | varchar | 50 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KassenBerechtigung

<a name="dboKassenBerechtigung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KassenCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Stammdaten` | int | - | ✅ | ((0)) |
| `Belege` | int | - | ✅ | ((0)) |
| `Prüfer` | int | - | ✅ | ((0)) |
| `Notiz` | text | 2147483647 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KassenBuchungen

<a name="dboKassenBuchungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | uniqueidentifier | - | ❌ | (newid()) |
| `BZObjType` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `PositionCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | 1000 | ✅ | - |
| `Result` | int | - | ✅ | - |
| `Timestamp` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KassenFreigabe

<a name="dboKassenFreigabe"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KassenCode` | int | - | ✅ | ((0)) |
| `Abrechnungsnummer` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Freigabetext` | varchar | 100 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KassenSaldo

<a name="dboKassenSaldo"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `Saldo` | float | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `Nummer` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KKartei

<a name="dboKKartei"></a>

**Anzahl Datensätze:** 180

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `KKarteiCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Nummer` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | ((1)) |
| `KundenCode` | int | - | ✅ | - |
| `SDObjType2` | int | - | ✅ | ((1)) |
| `KundenCode2` | int | - | ✅ | ((0)) |
| `VerknüpfungCode` | int | - | ✅ | ((0)) |
| `AnsprechpCode` | int | - | ✅ | - |
| `AnsprechpCode2` | int | - | ✅ | - |
| `BCodeErstellt` | int | - | ✅ | - |
| `DatumErstellt` | datetime | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `KKarteiCode` | 992395554 |
| `Nummer` | NULL |
| `SDObjType` | 1 |
| `KundenCode` | 66149117 |
| `SDObjType2` | 1 |
| `KundenCode2` | 1577373318 |
| `VerknüpfungCode` | 61194209 |
| `AnsprechpCode` | NULL |
| `AnsprechpCode2` | NULL |
| `BCodeErstellt` | 888797748 |
| `DatumErstellt` | 2021-11-16 00:00:00 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.Kontaktbericht

<a name="dboKontaktbericht"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KNType` | int | - | ✅ | ((0)) |
| `KNCode` | int | - | ✅ | ((0)) |
| `Thema` | ntext | 1073741823 | ✅ | - |
| `Ort` | nvarchar | 50 | ✅ | - |
| `Uhrzeitvon` | datetime | - | ✅ | - |
| `Uhrzeitbis` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `Datei` | nvarchar | 500 | ✅ | - |
| `Art` | int | - | ✅ | ((0)) |
| `Nummer` | int | - | ✅ | ((0)) |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `KlassifizierungCode` | int | - | ✅ | ((0)) |
| `CreationDate` | datetime | - | ✅ | - |
| `ObjGr` | int | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | - |
| `BriefDatei` | image | 2147483647 | ✅ | - |
| `TemplateName` | nvarchar | 70 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KontaktberichtAnhang

<a name="dboKontaktberichtAnhang"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `ObjCode` | int | - | ✅ | ((0)) |
| `Datei` | nvarchar | 500 | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KontaktberichtKundenMark

<a name="dboKontaktberichtKundenMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `KontaktberichtCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Kontenbereiche

<a name="dboKontenbereiche"></a>

**Anzahl Datensätze:** 11

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Nummer` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `Nummer` | 0 |
| `Bezeichnung` | -ohne- |

---

## dbo.Kontokorrent

<a name="dboKontokorrent"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Monat` | int | - | ✅ | - |
| `Jahr` | int | - | ✅ | - |
| `Kontokorrent` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Kostenerfassung

<a name="dboKostenerfassung"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjectCode` | int | - | ✅ | - |
| `Kostenart` | int | - | ✅ | - |
| `MitarbeiterCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | (getdate()) |
| `DatumUhrzeitVon` | datetime | - | ✅ | - |
| `DatumUhrzeitBis` | datetime | - | ✅ | - |
| `Anzahl` | real | - | ✅ | ((1)) |
| `EinheitCode` | int | - | ✅ | - |
| `PositionCode` | int | - | ✅ | - |
| `TätigkeitCode` | int | - | ✅ | - |
| `Tätigkeit` | nvarchar | 70 | ✅ | - |
| `LohnartCode` | int | - | ✅ | - |
| `MAText` | nvarchar | 50 | ✅ | - |
| `Lohnsatz` | real | - | ✅ | ((0)) |
| `Status` | int | - | ✅ | ((0)) |
| `EKPreis` | float | - | ✅ | ((0)) |
| `Bemerkung` | ntext | 1073741823 | ✅ | - |
| `RECode` | int | - | ✅ | ((0)) |
| `Kosten` | float | - | ✅ | ((0)) |
| `Anteil` | real | - | ✅ | - |
| `BZObjMemberType` | int | - | ✅ | ((0)) |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `PlanungCode` | int | - | ✅ | ((0)) |
| `RechnungCode` | int | - | ✅ | ((0)) |
| `Gesperrt` | int | - | ✅ | - |
| `Abrechenbar` | int | - | ✅ | - |
| `UhrzeitVon` | datetime | - | ✅ | - |
| `UhrzeitBis` | datetime | - | ✅ | - |
| `Pause` | int | - | ✅ | - |
| `ScanDatei` | nvarchar | 500 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `KNCode` | int | - | ✅ | ((0)) |
| `KNType` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | - |
| `KAnsprechpartnerCode` | int | - | ✅ | - |
| `Zeiteinheiten` | float | - | ✅ | - |
| `MiteID` | nvarchar | 200 | ✅ | - |
| `LookupArtCode` | int | - | ✅ | - |
| `TicketNumber` | int | - | ✅ | ((0)) |
| `WartungsobjektCode` | int | - | ✅ | ((0)) |
| `ErfassungArt` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `LieferscheinCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1835152226 |
| `ProjectCode` | 922121847 |
| `Kostenart` | 0 |
| `MitarbeiterCode` | 22209630 |
| `Datum` | 2022-04-22 00:00:00 |
| `DatumUhrzeitVon` | 2022-04-22 11:00:00 |
| `DatumUhrzeitBis` | 2022-04-22 13:00:00 |
| `Anzahl` | 2.0 |
| `EinheitCode` | NULL |
| `PositionCode` | 0 |
| `TätigkeitCode` | 0 |
| `Tätigkeit` | Tätigkeit |
| `LohnartCode` | NULL |
| `MAText` | NULL |
| `Lohnsatz` | 1.0 |
| `Status` | 1 |
| `EKPreis` | 0.0 |
| `Bemerkung` | Ticket 65 [Erfasst] Rollo Reparatur

Rollo Reparatur |
| `RECode` | 0 |
| `Kosten` | 0.0 |
| `Anteil` | NULL |
| `BZObjMemberType` | 5 |
| `BZObjMemberCode` | 0 |
| `PlanungCode` | 0 |
| `RechnungCode` | 0 |
| `Gesperrt` | NULL |
| `Abrechenbar` | -1 |
| `UhrzeitVon` | 2022-04-22 11:00:00 |
| `UhrzeitBis` | 2022-04-22 13:00:00 |
| `Pause` | 0 |
| `ScanDatei` | NULL |
| `SDObjMemberCode` | 948052360 |
| `KNCode` | 0 |
| `KNType` | 0 |
| `BenutzerCode` | 22209630 |
| `KAnsprechpartnerCode` | NULL |
| `Zeiteinheiten` | 0.0 |
| `MiteID` | NULL |
| `LookupArtCode` | 0 |
| `TicketNumber` | 65 |
| `WartungsobjektCode` | 0 |
| `ErfassungArt` | 1 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `LieferscheinCode` | NULL |

---

## dbo.KostenerfassungTemp

<a name="dboKostenerfassungTemp"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `MitarbeiterCode ` | int | - | ✅ | ((0)) |
| `ProjektCode ` | int | - | ✅ | ((0)) |
| `StartZeit ` | datetime | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Anzahl` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `BZObjMemberType` | int | - | ✅ | ((0)) |
| `Status` | int | - | ✅ | ((0)) |
| `Tätigkeit` | nvarchar | 70 | ✅ | ('') |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Kostenst

<a name="dboKostenst"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `KostenstCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KostenstName` | nvarchar | 50 | ✅ | - |
| `KostenstNummer` | int | - | ✅ | - |
| `LetzteNummer` | int | - | ✅ | ((0)) |
| `Deaktiviert` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | 250 | ✅ | - |
| `Zusatz` | nvarchar | 10 | ✅ | - |
| `Mandantennummer` | int | - | ✅ | ((0)) |
| `EKPreisSpezial` | float | - | ✅ | - |
| `ErsteNummer` | int | - | ✅ | ((0)) |
| `KostenstGruppe` | nvarchar | 100 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `BankverbindungCode` | int | - | ✅ | - |
| `UstIdNr` | nvarchar | 100 | ✅ | - |
| `Beraternummer` | int | - | ✅ | - |
| `Bundesland` | nvarchar | 500 | ✅ | - |
| `Firmenname` | nvarchar | 500 | ✅ | - |
| `Internet` | nvarchar | 500 | ✅ | - |
| `Land` | nvarchar | 500 | ✅ | - |
| `Ort` | nvarchar | 500 | ✅ | - |
| `PLZ` | nvarchar | 50 | ✅ | - |
| `Steuernummer` | nvarchar | 500 | ✅ | - |
| `Strasse` | nvarchar | 500 | ✅ | - |
| `Telefax` | nvarchar | 500 | ✅ | - |
| `Telefon` | nvarchar | 500 | ✅ | - |
| `MandantEMail` | nvarchar | 500 | ✅ | - |
| `MandantGeschaeftsfuehrer` | nvarchar | 500 | ✅ | - |
| `MandantHandelsregisterGerichtsstand` | nvarchar | 200 | ✅ | - |
| `MandantHandelsregisterNummer` | nvarchar | 200 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `KostenstCode` | 1 |
| `KostenstName` | Montage |
| `KostenstNummer` | 1000 |
| `LetzteNummer` | 0 |
| `Deaktiviert` | 0 |
| `Bemerkung` | NULL |
| `Zusatz` | NULL |
| `Mandantennummer` | 0 |
| `EKPreisSpezial` | NULL |
| `ErsteNummer` | NULL |
| `KostenstGruppe` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `BankverbindungCode` | NULL |
| `UstIdNr` | NULL |
| `Beraternummer` | NULL |
| `Bundesland` | NULL |
| `Firmenname` | NULL |
| `Internet` | NULL |
| `Land` | NULL |
| `Ort` | NULL |
| `PLZ` | NULL |
| `Steuernummer` | NULL |
| `Strasse` | NULL |
| `Telefax` | NULL |
| `Telefon` | NULL |
| `MandantEMail` | NULL |
| `MandantGeschaeftsfuehrer` | NULL |
| `MandantHandelsregisterGerichtsstand` | NULL |
| `MandantHandelsregisterNummer` | NULL |

---

## dbo.Krankheit

<a name="dboKrankheit"></a>

**Anzahl Datensätze:** 1,014

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `MitarbeiterCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Menge` | real | - | ✅ | ((0)) |
| `Notiz` | nvarchar | 50 | ✅ | - |
| `DatevArtLookUpCode` | int | - | ✅ | - |
| `UrlaubsArt` | int | - | ✅ | - |
| `DatumAntrag` | datetime | - | ✅ | - |
| `DatumGenehmigung` | datetime | - | ✅ | - |
| `BCodeGenehmigung` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1368322284 |
| `MitarbeiterCode` | 1668774798 |
| `Datum` | 2021-05-21 00:00:00 |
| `Menge` | 1.0 |
| `Notiz` | NULL |
| `DatevArtLookUpCode` | 0 |
| `UrlaubsArt` | 0 |
| `DatumAntrag` | NULL |
| `DatumGenehmigung` | NULL |
| `BCodeGenehmigung` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.Kunden

<a name="dboKunden"></a>

**Anzahl Datensätze:** 8,675

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 160 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `Firma1` | nvarchar | 100 | ✅ | - |
| `Firma2` | nvarchar | 100 | ✅ | - |
| `Firma3` | nvarchar | 100 | ✅ | - |
| `Straße` | nvarchar | 100 | ✅ | - |
| `Staat` | nvarchar | 20 | ✅ | - |
| `Plz` | nvarchar | 50 | ✅ | - |
| `Ort` | nvarchar | 50 | ✅ | - |
| `Telefon` | nvarchar | 50 | ✅ | - |
| `Telefax` | nvarchar | 50 | ✅ | - |
| `Privatkunde` | int | - | ✅ | ((0)) |
| `Bruttorechnung` | int | - | ✅ | ((0)) |
| `Gesperrt` | int | - | ✅ | ((0)) |
| `Zahlungsfrist` | int | - | ✅ | ((0)) |
| `Skonto` | real | - | ✅ | ((0)) |
| `Skontofrist` | real | - | ✅ | ((0)) |
| `Skonto2` | float | - | ✅ | ((0)) |
| `Skonto2Frist` | int | - | ✅ | ((0)) |
| `Mahntoleranz` | float | - | ✅ | ((0)) |
| `Rabattvorschlag` | real | - | ✅ | ((0)) |
| `Preisgruppe` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `KAnsprechpCode` | int | - | ✅ | - |
| `NebenAdrCode1` | int | - | ✅ | ((0)) |
| `NebenAdrCode2` | int | - | ✅ | ((0)) |
| `NebenAdrCode3` | int | - | ✅ | ((0)) |
| `NebenAdrType1` | int | - | ✅ | ((0)) |
| `NebenAdrType2` | int | - | ✅ | ((0)) |
| `NebenAdrType3` | int | - | ✅ | ((0)) |
| `KKontaktCode` | int | - | ✅ | - |
| `Erstkontakt` | datetime | - | ✅ | (getdate()) |
| `Letzterkontakt` | datetime | - | ✅ | - |
| `PersonErstkontakt` | nvarchar | 50 | ✅ | - |
| `PersonLetzterkontakt` | nvarchar | 50 | ✅ | - |
| `Waswurdezuletztgetan` | nvarchar | 50 | ✅ | - |
| `Entfernung` | real | - | ✅ | ((0)) |
| `Postfach` | nvarchar | 20 | ✅ | - |
| `PLZPostfach` | nvarchar | 8 | ✅ | - |
| `OrtPostfach` | nvarchar | 50 | ✅ | - |
| `Vorwahl` | nvarchar | 50 | ✅ | - |
| `AnsprechPartner` | nvarchar | 50 | ✅ | - |
| `BriefAnrede` | nvarchar | 50 | ✅ | - |
| `AnredeCode` | int | - | ✅ | ((1)) |
| `Autotelefon` | nvarchar | 50 | ✅ | - |
| `InterNet` | nvarchar | 200 | ✅ | - |
| `VertreterCode` | int | - | ✅ | ((0)) |
| `Provision` | float | - | ✅ | ((0)) |
| `Mark` | nvarchar | 1 | ✅ | - |
| `Standardkonto` | int | - | ✅ | - |
| `Steuer` | int | - | ✅ | ((0)) |
| `Kontonummer` | nvarchar | 30 | ✅ | - |
| `Bankverbindung` | nvarchar | 30 | ✅ | - |
| `Bankleitzahl` | nvarchar | 30 | ✅ | - |
| `Kontoinhaber` | nvarchar | 50 | ✅ | - |
| `Bankeinzug` | int | - | ✅ | ((0)) |
| `USTIDNR` | nvarchar | 50 | ✅ | - |
| `Kundennr` | nvarchar | 20 | ✅ | - |
| `Kürzel` | nvarchar | 10 | ✅ | - |
| `HausbankCode` | int | - | ✅ | - |
| `SprachCode` | int | - | ✅ | ((0)) |
| `E-Mail` | nvarchar | 150 | ✅ | - |
| `WährungCode` | int | - | ✅ | ((1)) |
| `Kreditlimit` | float | - | ✅ | ((0)) |
| `ZahlungsCode` | int | - | ✅ | ((0)) |
| `DB` | int | - | ✅ | ((0)) |
| `SteuerschluesselCode` | int | - | ✅ | - |
| `SenderName` | nvarchar | 50 | ✅ | - |
| `OutlookAdresse` | int | - | ✅ | ((0)) |
| `Geburtsdatum` | datetime | - | ✅ | - |
| `Vertreter2Code` | int | - | ✅ | - |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `Titelerweiterung` | nvarchar | 30 | ✅ | - |
| `GeburtstagTag` | int | - | ✅ | ((0)) |
| `GeburtstagMonat` | int | - | ✅ | ((0)) |
| `GeburtstagJahr` | int | - | ✅ | ((0)) |
| `Namenserweiterung` | nvarchar | 50 | ✅ | - |
| `Erloschen` | int | - | ✅ | ((0)) |
| `Funktion` | nvarchar | 50 | ✅ | - |
| `FirmenAnrede` | nvarchar | 255 | ✅ | - |
| `Intern` | int | - | ✅ | - |
| `DoublettenCheck_NichtMehrAnzeigen` | int | - | ✅ | ((0)) |
| `Adreßerweiterung` | ntext | 1073741823 | ✅ | - |
| `E-Mail2` | nvarchar | 150 | ✅ | - |
| `NotizRTF` | nvarchar | 4000 | ✅ | - |
| `IBAN` | nvarchar | 34 | ✅ | - |
| `BIC` | nvarchar | 11 | ✅ | - |
| `Telefon2` | nvarchar | 30 | ✅ | - |
| `Lieferadresse` | int | - | ✅ | - |
| `DTANichtZusammenfassen` | int | - | ✅ | - |
| `MailSperre` | int | - | ✅ | - |
| `SerienbriefSperre` | int | - | ✅ | - |
| `LieferungsArtCode` | int | - | ✅ | - |
| `LieferungsArtZiel` | int | - | ✅ | - |
| `MiteID` | nvarchar | 100 | ✅ | - |
| `Konzernkennzeichen` | nvarchar | 50 | ✅ | - |
| `Mahnsperre` | int | - | ✅ | - |
| `TeilrechnungslogikCode` | int | - | ✅ | - |
| `Ordner` | nvarchar | 1000 | ✅ | - |
| `VertreterSDObjMemberCode` | int | - | ✅ | - |
| `VertreterSDObjType` | int | - | ✅ | - |
| `NebenadrAPCode1` | int | - | ✅ | - |
| `NebenadrAPCode2` | int | - | ✅ | - |
| `NebenadrAPCode3` | int | - | ✅ | - |
| `ERPFreigabepflichtDeaktivieren` | int | - | ✅ | - |
| `AdresseWirdGepflegtBeiLieferantCode` | int | - | ✅ | ((0)) |
| `Rabatt2` | float | - | ✅ | - |
| `Rabatt3` | float | - | ✅ | - |
| `Rabatt4` | float | - | ✅ | - |
| `AdresseWirdGepflegtBeiKundeCode` | int | - | ✅ | ((0)) |
| `KeineStaffelrabatte` | int | - | ✅ | ((0)) |
| `LastModificationDate` | datetime | - | ✅ | - |
| `IntrastatNichtberücksichtigen` | int | - | ✅ | ((0)) |
| `RechnungsadresseEMail` | nvarchar | -1 | ✅ | ('') |
| `Rechnungsform` | int | - | ✅ | ((0)) |
| `GeoLat` | nvarchar | 200 | ✅ | ('') |
| `GeoLon` | nvarchar | 200 | ✅ | ('') |
| `TourCode` | int | - | ✅ | ((0)) |
| `ShopLizenzen` | int | - | ✅ | ((0)) |
| `ShopLoginVerwaltung` | int | - | ✅ | ((0)) |
| `ShopAnsichtGrId` | uniqueidentifier | - | ✅ | - |
| `ShopDefinitionId` | uniqueidentifier | - | ✅ | - |
| `ShopProjektGrCode` | int | - | ✅ | ((0)) |
| `ERechnungFormat` | int | - | ✅ | - |
| `OPNotiz` | nvarchar | -1 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `ERechnung_LeitwegId_BT10` | nvarchar | 500 | ✅ | - |
| `ReverseCharge` | int | - | ✅ | - |
| `DefaultBankAccount` | int | - | ✅ | - |
| `EMailAdresseMahnungen` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1139123046 |
| `Name` | SC Germania Amberg, Amberg |
| `GrCode` | 7 |
| `Nummer` | 16725 |
| `Firma1` | SC Germania Amberg |
| `Firma2` | NULL |
| `Firma3` | NULL |
| `Straße` | Langangerweg 1a |
| `Staat` | D |
| `Plz` | 92224 |
| `Ort` | Amberg |
| `Telefon` |  |
| `Telefax` |  |
| `Privatkunde` | 0 |
| `Bruttorechnung` | 0 |
| `Gesperrt` | 0 |
| `Zahlungsfrist` | 14 |
| `Skonto` | 0.0 |
| `Skontofrist` | 0.0 |
| `Skonto2` | 0.0 |
| `Skonto2Frist` | 0 |
| `Mahntoleranz` | 14.0 |
| `Rabattvorschlag` | 0.0 |
| `Preisgruppe` | 0 |
| `Notiz` |  |
| `KAnsprechpCode` | 0 |
| `NebenAdrCode1` | 1139123046 |
| `NebenAdrCode2` | 1139123046 |
| `NebenAdrCode3` | 1139123046 |
| `NebenAdrType1` | 1 |
| `NebenAdrType2` | 1 |
| `NebenAdrType3` | 1 |
| `KKontaktCode` | NULL |
| `Erstkontakt` | 2021-11-17 09:03:22.117000 |
| `Letzterkontakt` | NULL |
| `PersonErstkontakt` | Roland Hoffmann |
| `PersonLetzterkontakt` | Roland Hoffmann |
| `Waswurdezuletztgetan` | NULL |
| `Entfernung` | 0.0 |
| `Postfach` |  |
| `PLZPostfach` |  |
| `OrtPostfach` |  |
| `Vorwahl` | NULL |
| `AnsprechPartner` |  |
| `BriefAnrede` |  |
| `AnredeCode` | 3 |
| `Autotelefon` |  |
| `InterNet` | NULL |
| `VertreterCode` | 0 |
| `Provision` | 0.0 |
| `Mark` | NULL |
| `Standardkonto` | NULL |
| `Steuer` | 0 |
| `Kontonummer` | NULL |
| `Bankverbindung` | NULL |
| `Bankleitzahl` | NULL |
| `Kontoinhaber` | NULL |
| `Bankeinzug` | 0 |
| `USTIDNR` | NULL |
| `Kundennr` | NULL |
| `Kürzel` | NULL |
| `HausbankCode` | NULL |
| `SprachCode` | 0 |
| `E-Mail` |  |
| `WährungCode` | 1 |
| `Kreditlimit` | 0.0 |
| `ZahlungsCode` | 0 |
| `DB` | 0 |
| `SteuerschluesselCode` | NULL |
| `SenderName` | NULL |
| `OutlookAdresse` | 0 |
| `Geburtsdatum` | NULL |
| `Vertreter2Code` | NULL |
| `LetzteÄnderung` | 2021-11-17 09:03:22.117000 |
| `Titelerweiterung` | NULL |
| `GeburtstagTag` | 0 |
| `GeburtstagMonat` | 0 |
| `GeburtstagJahr` | 0 |
| `Namenserweiterung` | NULL |
| `Erloschen` | 0 |
| `Funktion` | NULL |
| `FirmenAnrede` | NULL |
| `Intern` | NULL |
| `DoublettenCheck_NichtMehrAnzeigen` | 0 |
| `Adreßerweiterung` |  |
| `E-Mail2` | NULL |
| `NotizRTF` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil Arial;}}

{\*\generator Riche... (total: 154 chars) |
| `IBAN` | NULL |
| `BIC` | NULL |
| `Telefon2` |  |
| `Lieferadresse` | 0 |
| `DTANichtZusammenfassen` | 0 |
| `MailSperre` | 0 |
| `SerienbriefSperre` | 0 |
| `LieferungsArtCode` | 0 |
| `LieferungsArtZiel` | 0 |
| `MiteID` | NULL |
| `Konzernkennzeichen` |  |
| `Mahnsperre` | 0 |
| `TeilrechnungslogikCode` | 0 |
| `Ordner` | NULL |
| `VertreterSDObjMemberCode` | 0 |
| `VertreterSDObjType` | 0 |
| `NebenadrAPCode1` | 0 |
| `NebenadrAPCode2` | 0 |
| `NebenadrAPCode3` | 0 |
| `ERPFreigabepflichtDeaktivieren` | 0 |
| `AdresseWirdGepflegtBeiLieferantCode` | 0 |
| `Rabatt2` | 0.0 |
| `Rabatt3` | 0.0 |
| `Rabatt4` | 0.0 |
| `AdresseWirdGepflegtBeiKundeCode` | 0 |
| `KeineStaffelrabatte` | 0 |
| `LastModificationDate` | 2021-11-17 09:03:22.133000 |
| `IntrastatNichtberücksichtigen` | -1 |
| `RechnungsadresseEMail` | NULL |
| `Rechnungsform` | 0 |
| `GeoLat` |  |
| `GeoLon` |  |
| `TourCode` | 0 |
| `ShopLizenzen` | 0 |
| `ShopLoginVerwaltung` | 0 |
| `ShopAnsichtGrId` | 00000000-0000-0000-0000-000000000000 |
| `ShopDefinitionId` | 00000000-0000-0000-0000-000000000000 |
| `ShopProjektGrCode` | 0 |
| `ERechnungFormat` | 2 |
| `OPNotiz` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |
| `ERechnung_LeitwegId_BT10` | NULL |
| `ReverseCharge` | NULL |
| `DefaultBankAccount` | NULL |
| `EMailAdresseMahnungen` | NULL |

---

## dbo.KundenGr

<a name="dboKundenGr"></a>

**Anzahl Datensätze:** 29

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 40 | ✅ | - |
| `Info` | nvarchar | 4000 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `GrCode` | 1 |
| `GrIndex` | 0 |
| `GrLevel` | 1 |
| `GrName` | 01 Kunden |
| `Info` |  |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.KundenGrMark

<a name="dboKundenGrMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.KundenMark

<a name="dboKundenMark"></a>

**Anzahl Datensätze:** 20

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |
| `KAnsprechpCode` | int | - | ✅ | ((0)) |
| `Markierung` | int | - | ✅ | - |
| `OriginalCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `BenutzerCode` | 581413548 |
| `ObjCode` | 1020481282 |
| `KAnsprechpCode` | 0 |
| `Markierung` | 0 |
| `OriginalCode` | 0 |

---

## dbo.Kurse

<a name="dboKurse"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `WaehrungCode` | int | - | ✅ | ((0)) |
| `Stand` | datetime | - | ✅ | - |
| `Faktor` | float | - | ✅ | ((0)) |
| `User` | nvarchar | 150 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 14 |
| `WaehrungCode` | 1 |
| `Stand` | 2001-10-24 00:00:00 |
| `Faktor` | 1.0 |
| `User` | NULL |

---

## dbo.KursImportLogs

<a name="dboKursImportLogs"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `WährungsName` | nvarchar | 50 | ✅ | ('') |
| `WährungsCode` | int | - | ✅ | - |
| `Kurs` | float | - | ✅ | - |
| `BCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Lagerinventur

<a name="dboLagerinventur"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `CreatedBy` | int | - | ✅ | - |
| `CreationDate` | datetime | - | ✅ | - |
| `Gebucht` | int | - | ✅ | - |
| `GebuchtDatum` | datetime | - | ✅ | - |
| `GebuchtDurch` | int | - | ✅ | - |
| `Name` | nvarchar | 150 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.LagerinventurMark

<a name="dboLagerinventurMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `AlteMenge` | float | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `Gebucht` | int | - | ✅ | - |
| `LagerinventurCode` | int | - | ✅ | - |
| `LagerortCode` | int | - | ✅ | - |
| `NeueMenge` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Lagerort

<a name="dboLagerort"></a>

**Anzahl Datensätze:** 5

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `LagerortCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `LagerortName` | nvarchar | 30 | ✅ | - |
| `SDObjMemberType` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `Superlager` | int | - | ✅ | ((0)) |
| `MinUnterschreitungZulassen` | int | - | ✅ | ((0)) |
| `MinUnterschreitungMelden` | int | - | ✅ | ((0)) |
| `NegativerLagerbestand` | int | - | ✅ | ((0)) |
| `RueckstaendeBilden` | int | - | ✅ | ((0)) |
| `Hide` | int | - | ✅ | - |
| `Frei1` | nvarchar | 200 | ✅ | - |
| `Frei2` | nvarchar | 200 | ✅ | - |
| `Frei3` | nvarchar | 200 | ✅ | - |
| `Frei4` | nvarchar | 200 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `NichtVerfügbar` | int | - | ✅ | - |
| `Reparaturlager` | int | - | ✅ | ((0)) |
| `LagerortNummer` | nvarchar | 2000 | ✅ | ('') |
| `Standort` | nvarchar | 500 | ✅ | - |
| `Halle` | nvarchar | 500 | ✅ | - |
| `Regal` | nvarchar | 500 | ✅ | - |
| `Fach` | nvarchar | 500 | ✅ | - |
| `Ebene` | nvarchar | 500 | ✅ | - |
| `Grösse` | nvarchar | 500 | ✅ | - |
| `MaximaleBoxBreite` | int | - | ✅ | - |
| `Type` | int | - | ✅ | - |
| `TypeMemberCode` | int | - | ✅ | - |
| `NichtVerfuegbar` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `LagerortCode` | 1 |
| `LagerortName` | Hauptlager |
| `SDObjMemberType` | 0 |
| `SDObjMemberCode` | 0 |
| `Superlager` | -1 |
| `MinUnterschreitungZulassen` | 0 |
| `MinUnterschreitungMelden` | 0 |
| `NegativerLagerbestand` | 0 |
| `RueckstaendeBilden` | 0 |
| `Hide` | 0 |
| `Frei1` | NULL |
| `Frei2` | NULL |
| `Frei3` | NULL |
| `Frei4` | NULL |
| `Datum` | NULL |
| `NichtVerfügbar` | 0 |
| `Reparaturlager` | 0 |
| `LagerortNummer` |  |
| `Standort` | NULL |
| `Halle` | NULL |
| `Regal` | NULL |
| `Fach` | NULL |
| `Ebene` | NULL |
| `Grösse` | NULL |
| `MaximaleBoxBreite` | 0 |
| `Type` | 0 |
| `TypeMemberCode` | 0 |
| `NichtVerfuegbar` | NULL |

---

## dbo.Länder

<a name="dboLänder"></a>

**Anzahl Datensätze:** 65

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Kennzeichen` | nvarchar | 10 | ✅ | - |
| `Kennzeichen2` | nvarchar | 50 | ✅ | - |
| `Kennzeichen3` | nvarchar | 50 | ✅ | - |
| `Steuer` | int | - | ✅ | ((0)) |
| `Langtext` | nvarchar | 50 | ✅ | - |
| `Korrektur LKZ` | nvarchar | 7 | ✅ | - |
| `Angelsächsisch` | int | - | ✅ | - |
| `ReisekostenÜber24h` | float | - | ✅ | ((0)) |
| `ReisekostenÜber14h` | float | - | ✅ | ((0)) |
| `ReisekostenÜber8h` | float | - | ✅ | ((0)) |
| `ÜbernachtungsPauschale` | float | - | ✅ | ((0)) |
| `Frühstück` | float | - | ✅ | ((0)) |
| `Telefonvorwahl` | nvarchar | 5 | ✅ | - |
| `Steuerschlüssel1` | int | - | ✅ | - |
| `Steuerschlüssel2` | int | - | ✅ | - |
| `Steuerschlüssel3` | int | - | ✅ | - |
| `ReisekostenUnter24h` | float | - | ✅ | - |
| `AbzugEssen` | float | - | ✅ | - |
| `KeineMwst` | int | - | ✅ | - |
| `SprachCode` | int | - | ✅ | - |
| `WaehrungCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `Kennzeichen` | NULL |
| `Kennzeichen2` | NULL |
| `Kennzeichen3` | NULL |
| `Steuer` | 2 |
| `Langtext` | unbekannt |
| `Korrektur LKZ` | NULL |
| `Angelsächsisch` | 0 |
| `ReisekostenÜber24h` | 0.0 |
| `ReisekostenÜber14h` | 0.0 |
| `ReisekostenÜber8h` | 0.0 |
| `ÜbernachtungsPauschale` | 0.0 |
| `Frühstück` | 0.0 |
| `Telefonvorwahl` | NULL |
| `Steuerschlüssel1` | NULL |
| `Steuerschlüssel2` | NULL |
| `Steuerschlüssel3` | NULL |
| `ReisekostenUnter24h` | NULL |
| `AbzugEssen` | NULL |
| `KeineMwst` | 0 |
| `SprachCode` | NULL |
| `WaehrungCode` | NULL |

---

## dbo.Langtexte

<a name="dboLangtexte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Langtext` | ntext | 1073741823 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `SprachCode` | int | - | ✅ | ((0)) |
| `EinheitCode` | int | - | ✅ | ((0)) |
| `Einheit` | nvarchar | 30 | ✅ | - |
| `Kurztext` | ntext | 1073741823 | ✅ | - |
| `SLCode` | int | - | ✅ | ((0)) |
| `RTFLangtext` | ntext | 1073741823 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.LAnsprechp

<a name="dboLAnsprechp"></a>

**Anzahl Datensätze:** 737

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `LAnsprechpCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `LieferantenCode` | int | - | ✅ | - |
| `AnredeCode` | int | - | ✅ | - |
| `Vorname` | nvarchar | 30 | ✅ | - |
| `Name` | nvarchar | 30 | ✅ | - |
| `Telefon` | nvarchar | 50 | ✅ | - |
| `Telefon2` | nvarchar | 50 | ✅ | - |
| `Telefon3` | nvarchar | 50 | ✅ | - |
| `Telefax` | nvarchar | 50 | ✅ | - |
| `Briefanrede` | nvarchar | 50 | ✅ | - |
| `Funktion` | nvarchar | 50 | ✅ | - |
| `Vorwahl` | nvarchar | 50 | ✅ | - |
| `Mobilfunk` | nvarchar | 50 | ✅ | - |
| `AdreßErweiterung` | nvarchar | 50 | ✅ | - |
| `AbteilungCode` | int | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Straße` | nvarchar | 100 | ✅ | - |
| `Staat` | nvarchar | 20 | ✅ | - |
| `Plz` | nvarchar | 50 | ✅ | - |
| `Ort` | nvarchar | 50 | ✅ | - |
| `E-Mail` | nvarchar | 150 | ✅ | - |
| `MailanPrivat` | int | - | ✅ | ((0)) |
| `TelPrivat` | nvarchar | 50 | ✅ | - |
| `FaxPrivat` | nvarchar | 50 | ✅ | - |
| `Geburtsdatum` | datetime | - | ✅ | - |
| `OutlookAdresse` | int | - | ✅ | ((0)) |
| `SenderName` | nvarchar | 50 | ✅ | - |
| `Entlassen` | int | - | ✅ | ((0)) |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `eMailPrivat` | nvarchar | 150 | ✅ | - |
| `BCodeErstkontakt` | int | - | ✅ | ((0)) |
| `BCodeLetzteÄnderung` | int | - | ✅ | ((0)) |
| `GeburtstagTag` | int | - | ✅ | ((0)) |
| `GeburtstagMonat` | int | - | ✅ | ((0)) |
| `GeburtstagJahr` | int | - | ✅ | ((0)) |
| `VIP` | int | - | ✅ | - |
| `Mailsperre` | int | - | ✅ | - |
| `Titelerweiterung` | nvarchar | 50 | ✅ | - |
| `Namenserweiterung` | nvarchar | 30 | ✅ | - |
| `Erstkontakt` | datetime | - | ✅ | - |
| `PrimäreAdresse` | int | - | ✅ | - |
| `FirmenAdresse` | int | - | ✅ | - |
| `Serienbriefsperre` | int | - | ✅ | - |
| `AbteilungInAdresseZeigen` | int | - | ✅ | - |
| `FunktionInAdresseZeigen` | int | - | ✅ | - |
| `Skypename` | nvarchar | 50 | ✅ | - |
| `MobilPrivat` | nvarchar | 50 | ✅ | - |
| `NotizRTF` | nvarchar | 4000 | ✅ | - |
| `Code` | int | - | ❌ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `LAnsprechpCode` | 133205158 |
| `LieferantenCode` | 1 |
| `AnredeCode` | 0 |
| `Vorname` | Support |
| `Name` |  |
| `Telefon` |  |
| `Telefon2` |  |
| `Telefon3` |  |
| `Telefax` |  |
| `Briefanrede` | Hallo Support Team, |
| `Funktion` |  |
| `Vorwahl` | NULL |
| `Mobilfunk` |  |
| `AdreßErweiterung` |  |
| `AbteilungCode` | 2940764 |
| `Notiz` |  |
| `Straße` |  |
| `Staat` |  |
| `Plz` |  |
| `Ort` |  |
| `E-Mail` | Support@work4all.de |
| `MailanPrivat` | 0 |
| `TelPrivat` |  |
| `FaxPrivat` |  |
| `Geburtsdatum` | NULL |
| `OutlookAdresse` | 0 |
| `SenderName` |  |
| `Entlassen` | 0 |
| `LetzteÄnderung` | 2024-01-23 11:02:23.687000 |
| `eMailPrivat` |  |
| `BCodeErstkontakt` | 302416290 |
| `BCodeLetzteÄnderung` | 888797748 |
| `GeburtstagTag` | 0 |
| `GeburtstagMonat` | 0 |
| `GeburtstagJahr` | 0 |
| `VIP` | 0 |
| `Mailsperre` | 0 |
| `Titelerweiterung` |  |
| `Namenserweiterung` |  |
| `Erstkontakt` | 2020-01-20 13:59:05.350000 |
| `PrimäreAdresse` | 0 |
| `FirmenAdresse` | 0 |
| `Serienbriefsperre` | 0 |
| `AbteilungInAdresseZeigen` | 0 |
| `FunktionInAdresseZeigen` | 0 |
| `Skypename` | NULL |
| `MobilPrivat` |  |
| `NotizRTF` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil Arial;}}

{\*\generator Riche... (total: 154 chars) |
| `Code` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.Laufkalender

<a name="dboLaufkalender"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Hours` | int | - | ✅ | - |
| `Minutes` | int | - | ✅ | - |
| `Kilometer` | float | - | ✅ | - |
| `Bemerkung` | nvarchar | 4000 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Layout

<a name="dboLayout"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `LayoutType` | int | - | ✅ | - |
| `Definition` | nvarchar | -1 | ✅ | - |
| `INSERT_TIME` | datetime | - | ✅ | - |
| `UPDATE_TIME` | datetime | - | ✅ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `DefaultLayout` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.LayoutMapping

<a name="dboLayoutMapping"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `LayoutId` | uniqueidentifier | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |
| `GroupCode` | int | - | ✅ | - |
| `INSERT_TIME` | datetime | - | ✅ | - |
| `UPDATE_TIME` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Lieferanten

<a name="dboLieferanten"></a>

**Anzahl Datensätze:** 657

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 160 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `Firma1` | nvarchar | 100 | ✅ | - |
| `Firma2` | nvarchar | 100 | ✅ | - |
| `Firma3` | nvarchar | 100 | ✅ | - |
| `Straße` | nvarchar | 100 | ✅ | - |
| `Staat` | nvarchar | 20 | ✅ | - |
| `Plz` | nvarchar | 20 | ✅ | - |
| `Ort` | nvarchar | 50 | ✅ | - |
| `Telefon` | nvarchar | 50 | ✅ | - |
| `Telefax` | nvarchar | 50 | ✅ | - |
| `Kundennr` | nvarchar | 20 | ✅ | - |
| `LAnsprechpCode` | int | - | ✅ | - |
| `LKontaktCode` | int | - | ✅ | - |
| `Erstkontakt` | datetime | - | ✅ | - |
| `Letzterkontakt` | datetime | - | ✅ | - |
| `PersonErstKontakt` | nvarchar | 50 | ✅ | - |
| `PersonletzterKontakt` | nvarchar | 50 | ✅ | - |
| `Waswurdezuletztgetan` | nvarchar | 50 | ✅ | - |
| `Kontonummer` | nvarchar | 30 | ✅ | - |
| `Bankverbindung` | nvarchar | 30 | ✅ | - |
| `Bankleitzahl` | nvarchar | 30 | ✅ | - |
| `Kontoinhaber` | nvarchar | 50 | ✅ | - |
| `Zahlungsfrist` | int | - | ✅ | - |
| `Skonto` | real | - | ✅ | - |
| `Skontofrist` | real | - | ✅ | - |
| `Skonto2` | float | - | ✅ | ((0)) |
| `Skonto2Frist` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Entfernung` | real | - | ✅ | ((0)) |
| `Postfach` | nvarchar | 20 | ✅ | - |
| `PLZPostfach` | nvarchar | 8 | ✅ | - |
| `OrtPostfach` | nvarchar | 28 | ✅ | - |
| `Vorwahl` | nvarchar | 20 | ✅ | - |
| `Kürzel` | nvarchar | 10 | ✅ | - |
| `ListFlag` | int | - | ✅ | ((0)) |
| `Bruttorechnung` | int | - | ✅ | ((0)) |
| `HausbankCode` | int | - | ✅ | - |
| `AnredeCode` | int | - | ✅ | - |
| `AnsprechPartner` | nvarchar | 50 | ✅ | - |
| `BriefAnrede` | nvarchar | 50 | ✅ | - |
| `Privatkunde` | int | - | ✅ | ((0)) |
| `Gesperrt` | int | - | ✅ | ((0)) |
| `Mahntoleranz` | float | - | ✅ | - |
| `Rabattvorschlag` | real | - | ✅ | - |
| `Preisgruppe` | int | - | ✅ | - |
| `KAnsprechpCode` | int | - | ✅ | - |
| `KKontaktCode` | int | - | ✅ | - |
| `NebenAdrCode1` | int | - | ✅ | - |
| `NebenAdrCode2` | int | - | ✅ | - |
| `NebenAdrCode3` | int | - | ✅ | - |
| `NebenAdrType1` | int | - | ✅ | ((0)) |
| `NebenAdrType2` | int | - | ✅ | ((0)) |
| `NebenAdrType3` | int | - | ✅ | ((0)) |
| `KLieferadrCode` | int | - | ✅ | - |
| `Autotelefon` | nvarchar | 50 | ✅ | - |
| `InterNet` | nvarchar | 200 | ✅ | - |
| `Mark` | nvarchar | 1 | ✅ | - |
| `Standardkonto` | int | - | ✅ | - |
| `VertreterCode` | int | - | ✅ | ((0)) |
| `Provision` | float | - | ✅ | ((0)) |
| `Steuer` | int | - | ✅ | ((0)) |
| `USTIDNR` | nvarchar | 50 | ✅ | - |
| `SprachCode` | int | - | ✅ | ((0)) |
| `E-Mail` | nvarchar | 150 | ✅ | - |
| `WährungCode` | int | - | ✅ | ((1)) |
| `Kreditlimit` | float | - | ✅ | ((0)) |
| `ZahlungsCode` | int | - | ✅ | ((0)) |
| `DB` | int | - | ✅ | ((0)) |
| `SteuerschluesselCode` | int | - | ✅ | - |
| `SenderName` | nvarchar | 50 | ✅ | - |
| `Geburtsdatum` | datetime | - | ✅ | - |
| `Vertreter2Code` | int | - | ✅ | - |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `Titelerweiterung` | nvarchar | 30 | ✅ | - |
| `GeburtstagTag` | int | - | ✅ | ((0)) |
| `GeburtstagMonat` | int | - | ✅ | ((0)) |
| `GeburtstagJahr` | int | - | ✅ | ((0)) |
| `Erloschen` | int | - | ✅ | - |
| `Funktion` | nvarchar | 50 | ✅ | - |
| `FirmenAnrede` | nvarchar | 255 | ✅ | - |
| `Intern` | int | - | ✅ | - |
| `StandardSchlagwort` | int | - | ✅ | ((0)) |
| `DoublettenCheck_NichtMehrAnzeigen` | int | - | ✅ | ((0)) |
| `Namenserweiterung` | nvarchar | 100 | ✅ | - |
| `E-Mail2` | nvarchar | 150 | ✅ | - |
| `NotizRTF` | nvarchar | 4000 | ✅ | - |
| `IBAN` | nvarchar | 34 | ✅ | - |
| `BIC` | nvarchar | 11 | ✅ | - |
| `Adreßerweiterung` | nvarchar | 4000 | ✅ | - |
| `Telefon2` | nvarchar | 50 | ✅ | - |
| `DTANichtZusammenfassen` | int | - | ✅ | - |
| `LieferungsArtCode` | int | - | ✅ | - |
| `Konzernkennzeichen` | nvarchar | 50 | ✅ | - |
| `MailSperre` | int | - | ✅ | - |
| `SerienbriefSperre` | int | - | ✅ | - |
| `VertreterSDObjMemberCode` | int | - | ✅ | - |
| `VertreterSDObjType` | int | - | ✅ | - |
| `NebenAdrAPCode1` | int | - | ✅ | - |
| `NebenAdrAPCode2` | int | - | ✅ | - |
| `NebenAdrAPCode3` | int | - | ✅ | - |
| `ERPFreigabepflichtDeaktivieren` | int | - | ✅ | - |
| `AdresseWirdGepflegtBeiKundeCode` | int | - | ✅ | ((0)) |
| `KeineStaffelrabatte` | int | - | ✅ | ((0)) |
| `LastModificationDate` | datetime | - | ✅ | - |
| `IntrastatNichtberücksichtigen` | int | - | ✅ | ((0)) |
| `RechnungsadresseEMail` | nvarchar | -1 | ✅ | ('') |
| `Rechnungsform` | int | - | ✅ | ((0)) |
| `GeoLat` | nvarchar | 200 | ✅ | ('') |
| `GeoLon` | nvarchar | 200 | ✅ | ('') |
| `ShopAnsichtGrId` | uniqueidentifier | - | ✅ | - |
| `ShopDefinitionId` | uniqueidentifier | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `Name` | work4all GmbH | Köln |
| `GrCode` | 1250988067 |
| `Nummer` | 70177 |
| `Firma1` | work4all GmbH |
| `Firma2` |  |
| `Firma3` | NULL |
| `Straße` | Max-Planck Straße 6-8 |
| `Staat` | D |
| `Plz` | 50858 |
| `Ort` | Köln |
| `Telefon` | +49-2234-6903-0 |
| `Telefax` | +49-2234-6903-290 |
| `Kundennr` | 20846 |
| `LAnsprechpCode` | 133205158 |
| `LKontaktCode` | 0 |
| `Erstkontakt` | 1995-01-25 00:00:00 |
| `Letzterkontakt` | 2007-01-01 00:00:00 |
| `PersonErstKontakt` | Administrator |
| `PersonletzterKontakt` | Administrator |
| `Waswurdezuletztgetan` | Bearbeiten |
| `Kontonummer` |  |
| `Bankverbindung` |  |
| `Bankleitzahl` |  |
| `Kontoinhaber` |  |
| `Zahlungsfrist` | 30 |
| `Skonto` | 0.0 |
| `Skontofrist` | 0.0 |
| `Skonto2` | 0.0 |
| `Skonto2Frist` | 0 |
| `Notiz` |  |
| `Entfernung` | 0.0 |
| `Postfach` | NULL |
| `PLZPostfach` | NULL |
| `OrtPostfach` | NULL |
| `Vorwahl` | NULL |
| `Kürzel` | NULL |
| `ListFlag` | 0 |
| `Bruttorechnung` | 0 |
| `HausbankCode` | NULL |
| `AnredeCode` | 3 |
| `AnsprechPartner` | Support |
| `BriefAnrede` | NULL |
| `Privatkunde` | 0 |
| `Gesperrt` | 0 |
| `Mahntoleranz` | 0.0 |
| `Rabattvorschlag` | 0.0 |
| `Preisgruppe` | 0 |
| `KAnsprechpCode` | NULL |
| `KKontaktCode` | 0 |
| `NebenAdrCode1` | 1 |
| `NebenAdrCode2` | 1 |
| `NebenAdrCode3` | 1 |
| `NebenAdrType1` | 0 |
| `NebenAdrType2` | 0 |
| `NebenAdrType3` | 0 |
| `KLieferadrCode` | NULL |
| `Autotelefon` | NULL |
| `InterNet` | www.work4all.de |
| `Mark` | NULL |
| `Standardkonto` | 4806 |
| `VertreterCode` | 0 |
| `Provision` | 0.0 |
| `Steuer` | 0 |
| `USTIDNR` | NULL |
| `SprachCode` | 0 |
| `E-Mail` | support@work4all.de |
| `WährungCode` | 1 |
| `Kreditlimit` | 0.0 |
| `ZahlungsCode` | 0 |
| `DB` | 0 |
| `SteuerschluesselCode` | NULL |
| `SenderName` | NULL |
| `Geburtsdatum` | NULL |
| `Vertreter2Code` | NULL |
| `LetzteÄnderung` | 2024-04-24 14:03:12.607000 |
| `Titelerweiterung` |  |
| `GeburtstagTag` | 0 |
| `GeburtstagMonat` | 0 |
| `GeburtstagJahr` | 0 |
| `Erloschen` | 0 |
| `Funktion` | NULL |
| `FirmenAnrede` | NULL |
| `Intern` | 0 |
| `StandardSchlagwort` | 0 |
| `DoublettenCheck_NichtMehrAnzeigen` | 0 |
| `Namenserweiterung` | NULL |
| `E-Mail2` | NULL |
| `NotizRTF` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil\fcharset0 Microsoft Sans Seri... (total: 179 chars) |
| `IBAN` |  |
| `BIC` |  |
| `Adreßerweiterung` | NULL |
| `Telefon2` |  |
| `DTANichtZusammenfassen` | 0 |
| `LieferungsArtCode` | 0 |
| `Konzernkennzeichen` | NULL |
| `MailSperre` | NULL |
| `SerienbriefSperre` | NULL |
| `VertreterSDObjMemberCode` | 0 |
| `VertreterSDObjType` | 0 |
| `NebenAdrAPCode1` | NULL |
| `NebenAdrAPCode2` | NULL |
| `NebenAdrAPCode3` | NULL |
| `ERPFreigabepflichtDeaktivieren` | 0 |
| `AdresseWirdGepflegtBeiKundeCode` | 0 |
| `KeineStaffelrabatte` | 0 |
| `LastModificationDate` | 2024-04-24 14:03:12.610000 |
| `IntrastatNichtberücksichtigen` | -1 |
| `RechnungsadresseEMail` | NULL |
| `Rechnungsform` | NULL |
| `GeoLat` |  |
| `GeoLon` |  |
| `ShopAnsichtGrId` | NULL |
| `ShopDefinitionId` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |

---

## dbo.LieferantenBedarfZuordnung

<a name="dboLieferantenBedarfZuordnung"></a>

**Anzahl Datensätze:** 639

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `BZObjCode` | int | - | ✅ | ((0)) |
| `BZObjType` | int | - | ✅ | ((0)) |
| `APCode` | int | - | ✅ | ((0)) |
| `Hauptadresse` | int | - | ✅ | ((0)) |
| `Adresse` | ntext | 1073741823 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 49458030 |
| `SDObjMemberCode` | 72044526 |
| `SDObjType` | 0 |
| `BZObjCode` | 34835410 |
| `BZObjType` | 10 |
| `APCode` | 796918337 |
| `Hauptadresse` | 0 |
| `Adresse` | TRENDTÜREN Richard Burger GmbH

Herr Stefan Thamm

An der Bundesstraße 2

92334 Berching-Pollanten

 |

---

## dbo.Lieferantenbewertung

<a name="dboLieferantenbewertung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `Kommunikation` | int | - | ✅ | - |
| `Umsetzung` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | 4000 | ✅ | - |
| `Erfasst` | datetime | - | ✅ | - |
| `Name` | nvarchar | 100 | ✅ | - |
| `Budgettreu` | int | - | ✅ | - |
| `Termintreu` | int | - | ✅ | - |
| `AnsprpCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.LieferantenGr

<a name="dboLieferantenGr"></a>

**Anzahl Datensätze:** 56

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 40 | ✅ | - |
| `Info` | nvarchar | 4000 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `GrCode` | 1264354185 |
| `GrIndex` | 9 |
| `GrLevel` | 3 |
| `GrName` | Behörden/Ämter |
| `Info` |  |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.LieferantenGrMark

<a name="dboLieferantenGrMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.LieferantenMark

<a name="dboLieferantenMark"></a>

**Anzahl Datensätze:** 440

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |
| `LAnsprechpCode` | int | - | ✅ | ((0)) |
| `Markierung` | int | - | ✅ | - |
| `OriginalCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `BenutzerCode` | 888797748 |
| `ObjCode` | 607874881 |
| `LAnsprechpCode` | 0 |
| `Markierung` | 0 |
| `OriginalCode` | 0 |

---

## dbo.Lieferschein

<a name="dboLieferschein"></a>

**Anzahl Datensätze:** 551

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Nummer` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Kostenst` | int | - | ✅ | ((0)) |
| `IhrZeichen` | nvarchar | 50 | ✅ | - |
| `UnserZeichen` | nvarchar | 50 | ✅ | - |
| `BestellDatum` | datetime | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `AbteilungCode` | int | - | ✅ | ((0)) |
| `Kopftext` | ntext | 1073741823 | ✅ | - |
| `Schlußtext` | ntext | 1073741823 | ✅ | - |
| `LiefadrCode` | int | - | ✅ | ((0)) |
| `NebenAdrCode1` | int | - | ✅ | ((0)) |
| `NebenAdrCode2` | int | - | ✅ | ((0)) |
| `NebenAdrCode3` | int | - | ✅ | ((0)) |
| `AutNummer` | int | - | ✅ | ((0)) |
| `RechnungCode` | int | - | ✅ | - |
| `NebenAdrText1` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText2` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText3` | ntext | 1073741823 | ✅ | - |
| `NebenAdrType1` | int | - | ✅ | ((0)) |
| `NebenAdrType2` | int | - | ✅ | ((0)) |
| `NebenAdrType3` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode3` | int | - | ✅ | ((0)) |
| `NebenAdrPostfach1` | int | - | ✅ | - |
| `NebenAdrPostfach2` | int | - | ✅ | - |
| `NebenAdrPostfach3` | int | - | ✅ | - |
| `NebenAdrAbteilungCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode3` | int | - | ✅ | ((0)) |
| `Feld1` | nvarchar | 500 | ✅ | - |
| `Feld2` | nvarchar | 500 | ✅ | - |
| `Feld3` | nvarchar | 500 | ✅ | - |
| `Feld4` | nvarchar | 500 | ✅ | - |
| `Feld5` | nvarchar | 500 | ✅ | - |
| `Feld6` | nvarchar | 500 | ✅ | - |
| `Feld7` | nvarchar | 500 | ✅ | - |
| `Zahlungsfrist` | int | - | ✅ | ((0)) |
| `Skonto` | real | - | ✅ | - |
| `Skontofrist` | real | - | ✅ | - |
| `KarteiCode` | int | - | ✅ | - |
| `Status1` | int | - | ✅ | ((0)) |
| `Status2` | int | - | ✅ | ((0)) |
| `Status3` | int | - | ✅ | ((0)) |
| `Status4` | int | - | ✅ | ((0)) |
| `Status5` | int | - | ✅ | ((0)) |
| `Eingefroren` | int | - | ✅ | ((0)) |
| `WaehrungCode` | int | - | ✅ | - |
| `Kurs` | float | - | ✅ | ((1)) |
| `KursDatum` | datetime | - | ✅ | - |
| `AuftragsNummer` | int | - | ✅ | - |
| `AuftragsDatum` | datetime | - | ✅ | - |
| `ListFlag` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SN` | nvarchar | 50 | ✅ | - |
| `Brutto` | int | - | ✅ | ((0)) |
| `Preisgruppe` | int | - | ✅ | ((0)) |
| `ZahlungsCode` | int | - | ✅ | ((0)) |
| `Konsignation` | int | - | ✅ | ((0)) |
| `KonLager` | int | - | ✅ | ((0)) |
| `Auftragsbeginn` | datetime | - | ✅ | - |
| `KW` | int | - | ✅ | - |
| `RTFKopftext` | ntext | 1073741823 | ✅ | - |
| `RTFSchlußtext` | ntext | 1073741823 | ✅ | - |
| `DB` | float | - | ✅ | ((0)) |
| `Wert` | float | - | ✅ | ((0)) |
| `SprachCode` | int | - | ✅ | ((0)) |
| `Lieferadressegeändert` | int | - | ✅ | - |
| `Postfach` | int | - | ✅ | - |
| `NichtSteuerbar` | int | - | ✅ | - |
| `ErsatzErlöskonto` | int | - | ✅ | ((0)) |
| `HauptAdresse` | ntext | 1073741823 | ✅ | - |
| `Abgeschlossen` | int | - | ✅ | - |
| `BenutzerCode2` | int | - | ✅ | ((0)) |
| `LookupCode` | int | - | ✅ | ((0)) |
| `Streckengeschäft` | int | - | ✅ | - |
| `VerteilerCode` | int | - | ✅ | ((0)) |
| `WordParentCode` | int | - | ✅ | ((0)) |
| `BriefFormulareCode` | int | - | ✅ | ((0)) |
| `Briefdatei` | image | 2147483647 | ✅ | - |
| `Datei` | nvarchar | 500 | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `BankverbindungCode` | int | - | ✅ | - |
| `WartungsobjektCode` | int | - | ✅ | - |
| `LFCode` | int | - | ✅ | - |
| `LieferungsArtCode` | int | - | ✅ | - |
| `LieferungsArtZiel` | int | - | ✅ | - |
| `ProjektVorgangsCode` | int | - | ✅ | - |
| `Bezugsgrösse` | float | - | ✅ | - |
| `Leistungsort` | nvarchar | 100 | ✅ | - |
| `Skonto2` | float | - | ✅ | - |
| `Skontofrist2` | float | - | ✅ | - |
| `EditDate` | datetime | - | ✅ | - |
| `KonsignationLagerortCode` | int | - | ✅ | ((0)) |
| `MobileBearbeitung` | int | - | ✅ | ((0)) |
| `APP_UnterschriebenVon` | nvarchar | 4000 | ✅ | ('') |
| `APP_EmailKopieAn` | nvarchar | 4000 | ✅ | ('') |
| `UmbuchungsLagerortCode` | int | - | ✅ | ((0)) |
| `TourCode` | int | - | ✅ | ((0)) |
| `LieferterminAbgehend` | datetime | - | ✅ | - |
| `Mietdauer` | float | - | ✅ | - |
| `Mietfaktor` | float | - | ✅ | - |
| `NiederlassungsCode` | int | - | ✅ | ((0)) |
| `Leistungsbeginn` | datetime | - | ✅ | - |
| `Leistungsende` | datetime | - | ✅ | - |
| `CreatedByLoginId` | uniqueidentifier | - | ✅ | - |
| `WebShopOrderDefinitionData` | nvarchar | -1 | ✅ | ('') |
| `Art` | int | - | ✅ | - |
| `Nebenadresse3Geändert` | int | - | ✅ | - |
| `Bruttowert` | decimal | - | ✅ | - |
| `Storniert` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `HallenCode` | int | - | ✅ | - |
| `ERechnung_Auftragsnummer_BT14` | nvarchar | 500 | ✅ | - |
| `ERechnung_Bestellnummer_BT13` | nvarchar | 500 | ✅ | - |
| `ERechnung_Empfangsbestätigung_BT15` | nvarchar | 500 | ✅ | - |
| `ERechnung_Objekt_BT18` | nvarchar | 500 | ✅ | - |
| `ERechnung_Projektreferenz_BT11` | nvarchar | 500 | ✅ | - |
| `ERechnung_ReverseCharge` | int | - | ✅ | - |
| `ERechnung_Tender_BT17` | nvarchar | 500 | ✅ | - |
| `ERechnung_Versandanzeige_BT16` | nvarchar | 500 | ✅ | - |
| `ERechnung_Vertragsnummer_BT12` | nvarchar | 500 | ✅ | - |
| `ERechnungsart_BT3` | int | - | ✅ | - |
| `BankAccountCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 283529 |
| `Nummer` | 220085 |
| `SDObjMemberCode` | 642064997 |
| `SDObjType` | 1 |
| `Datum` | 2022-09-05 00:00:00 |
| `Notiz` | WET |
| `Kostenst` | 0 |
| `IhrZeichen` |  |
| `UnserZeichen` | AS |
| `BestellDatum` | NULL |
| `ProjektCode` | 38491065 |
| `AnsprpCode` | 0 |
| `AbteilungCode` | 0 |
| `Kopftext` | Sehr geehrte Frau Reuther,



wir bedanken uns für Ihren uns erteilten Auftrag und liefern und monti... (total: 121 chars) |
| `Schlußtext` | Wir bitten die Ware auf offene Mängel zu überprüfen. Spätere, insbesondere nach Transport auftretend... (total: 320 chars) |
| `LiefadrCode` | 0 |
| `NebenAdrCode1` | 642064997 |
| `NebenAdrCode2` | 642064997 |
| `NebenAdrCode3` | 642064997 |
| `AutNummer` | -1 |
| `RechnungCode` | 0 |
| `NebenAdrText1` | Frau

Helga Reuther

Adenauerstraße 10

97359 Schwarzach - Schwarzenau

 |
| `NebenAdrText2` | Frau

Helga Reuther

Adenauerstraße 10

97359 Schwarzach - Schwarzenau

 |
| `NebenAdrText3` | Frau

Helga Reuther

Adenauerstraße 10

97359 Schwarzach - Schwarzenau

 |
| `NebenAdrType1` | 1 |
| `NebenAdrType2` | 1 |
| `NebenAdrType3` | 1 |
| `NebenAdrAPCode1` | 0 |
| `NebenAdrAPCode2` | 0 |
| `NebenAdrAPCode3` | 0 |
| `NebenAdrPostfach1` | 0 |
| `NebenAdrPostfach2` | 0 |
| `NebenAdrPostfach3` | 0 |
| `NebenAdrAbteilungCode1` | 0 |
| `NebenAdrAbteilungCode2` | 0 |
| `NebenAdrAbteilungCode3` | 0 |
| `Feld1` |  |
| `Feld2` | NULL |
| `Feld3` | NULL |
| `Feld4` | NULL |
| `Feld5` | NULL |
| `Feld6` | NULL |
| `Feld7` | NULL |
| `Zahlungsfrist` | 14 |
| `Skonto` | 0.0 |
| `Skontofrist` | 0.0 |
| `KarteiCode` | 0 |
| `Status1` | 0 |
| `Status2` | 0 |
| `Status3` | 0 |
| `Status4` | 0 |
| `Status5` | 0 |
| `Eingefroren` | -1 |
| `WaehrungCode` | 1 |
| `Kurs` | 1.0 |
| `KursDatum` | 2001-10-24 00:00:00 |
| `AuftragsNummer` | 220135 |
| `AuftragsDatum` | 2022-08-01 00:00:00 |
| `ListFlag` | 0 |
| `BenutzerCode` | 888797748 |
| `SN` | NULL |
| `Brutto` | 0 |
| `Preisgruppe` | 0 |
| `ZahlungsCode` | 0 |
| `Konsignation` | 0 |
| `KonLager` | 0 |
| `Auftragsbeginn` | NULL |
| `KW` | 0 |
| `RTFKopftext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fswiss\fprq2\fcharset0 Arial;}{\f1... (total: 377 chars) |
| `RTFSchlußtext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil Arial;}{\f1\fnil\fcharset0 Ar... (total: 607 chars) |
| `DB` | 0.0 |
| `Wert` | 678.94 |
| `SprachCode` | 0 |
| `Lieferadressegeändert` | 0 |
| `Postfach` | 0 |
| `NichtSteuerbar` | NULL |
| `ErsatzErlöskonto` | 0 |
| `HauptAdresse` | Frau

Helga Reuther

Adenauerstraße 10

97359 Schwarzach - Schwarzenau

 |
| `Abgeschlossen` | -1 |
| `BenutzerCode2` | 888797748 |
| `LookupCode` | 0 |
| `Streckengeschäft` | NULL |
| `VerteilerCode` | 0 |
| `WordParentCode` | 0 |
| `BriefFormulareCode` | 0 |
| `Briefdatei` | NULL |
| `Datei` | NULL |
| `ObjGrCode` | NULL |
| `BankverbindungCode` | 0 |
| `WartungsobjektCode` | 0 |
| `LFCode` | NULL |
| `LieferungsArtCode` | 0 |
| `LieferungsArtZiel` | 0 |
| `ProjektVorgangsCode` | 0 |
| `Bezugsgrösse` | NULL |
| `Leistungsort` |  |
| `Skonto2` | 0.0 |
| `Skontofrist2` | 0.0 |
| `EditDate` | 2022-09-06 11:11:40.827000 |
| `KonsignationLagerortCode` | 0 |
| `MobileBearbeitung` | 0 |
| `APP_UnterschriebenVon` |  |
| `APP_EmailKopieAn` |  |
| `UmbuchungsLagerortCode` | 0 |
| `TourCode` | 0 |
| `LieferterminAbgehend` | NULL |
| `Mietdauer` | 0.0 |
| `Mietfaktor` | 1.0 |
| `NiederlassungsCode` | 0 |
| `Leistungsbeginn` | NULL |
| `Leistungsende` | NULL |
| `CreatedByLoginId` | 00000000-0000-0000-0000-000000000000 |
| `WebShopOrderDefinitionData` |  |
| `Art` | 0 |
| `Nebenadresse3Geändert` | 0 |
| `Bruttowert` | 807.94 |
| `Storniert` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |
| `HallenCode` | NULL |
| `ERechnung_Auftragsnummer_BT14` | NULL |
| `ERechnung_Bestellnummer_BT13` | NULL |
| `ERechnung_Empfangsbestätigung_BT15` | NULL |
| `ERechnung_Objekt_BT18` | NULL |
| `ERechnung_Projektreferenz_BT11` | NULL |
| `ERechnung_ReverseCharge` | NULL |
| `ERechnung_Tender_BT17` | NULL |
| `ERechnung_Versandanzeige_BT16` | NULL |
| `ERechnung_Vertragsnummer_BT12` | NULL |
| `ERechnungsart_BT3` | NULL |
| `BankAccountCode` | NULL |

---

## dbo.Lieferungsart

<a name="dboLieferungsart"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Text` | nvarchar | 50 | ✅ | - |
| `Langtext` | nvarchar | 4000 | ✅ | - |
| `Stufe` | int | - | ✅ | - |
| `Schlüssel` | int | - | ✅ | - |
| `Lieferungsziel` | int | - | ✅ | - |
| `IntrastatNichtBerücksichtigen` | int | - | ✅ | ((0)) |
| `Incoterm` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 25535088 |
| `Text` | Lieferung |
| `Langtext` | Lieferung ohne Montage |
| `Stufe` | NULL |
| `Schlüssel` | NULL |
| `Lieferungsziel` | 0 |
| `IntrastatNichtBerücksichtigen` | 0 |
| `Incoterm` | NULL |

---

## dbo.LockedSdObjects

<a name="dboLockedSdObjects"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `SdObjMemberCode` | int | - | ✅ | - |
| `SdObjType` | int | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Lohnarten

<a name="dboLohnarten"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `LohnartenCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `LohnartenName` | varchar | 50 | ✅ | - |
| `LohnartenWert` | real | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.LookUp

<a name="dboLookUp"></a>

**Anzahl Datensätze:** 111

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 100 | ✅ | - |
| `ObjArt` | int | - | ✅ | ((0)) |
| `Standard` | int | - | ✅ | ((0)) |
| `Wert` | int | - | ✅ | ((0)) |
| `LookUpCode` | int | - | ✅ | ((0)) |
| `Symbol` | int | - | ✅ | ((0)) |
| `AbgeschlossenStatus` | int | - | ✅ | - |
| `Farbe` | nvarchar | 50 | ✅ | - |
| `WertDouble` | float | - | ✅ | - |
| `Textwert` | nvarchar | 4000 | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `DesktopTab` | int | - | ✅ | - |
| `GruppenAnsicht` | int | - | ✅ | - |
| `Faktor` | float | - | ✅ | - |
| `AnzeigenAls` | nvarchar | 500 | ✅ | - |
| `ErweitertMaxArbeitsstunden` | int | - | ✅ | - |
| `UrlaubsartKurzarbeit` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `QuarantaeneStatus` | int | - | ✅ | - |
| `AboVertragAliasKopftext` | nvarchar | 500 | ✅ | - |
| `AboVertragAliasNotiz` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 7917430 |
| `Name` | Vereinbarungen |
| `ObjArt` | 48 |
| `Standard` | 0 |
| `Wert` | 0 |
| `LookUpCode` | 0 |
| `Symbol` | 0 |
| `AbgeschlossenStatus` | NULL |
| `Farbe` | NULL |
| `WertDouble` | NULL |
| `Textwert` | NULL |
| `BenutzerCode` | NULL |
| `DesktopTab` | NULL |
| `GruppenAnsicht` | NULL |
| `Faktor` | NULL |
| `AnzeigenAls` | NULL |
| `ErweitertMaxArbeitsstunden` | NULL |
| `UrlaubsartKurzarbeit` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `QuarantaeneStatus` | NULL |
| `AboVertragAliasKopftext` | NULL |
| `AboVertragAliasNotiz` | NULL |

---

## dbo.Löschvorgänge

<a name="dboLöschvorgänge"></a>

**Anzahl Datensätze:** 73,466

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Aktion` | ntext | 1073741823 | ✅ | - |
| `ObjCode` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `Klasse` | nvarchar | 200 | ✅ | - |
| `Tabelle` | nvarchar | 200 | ✅ | - |
| `Stacktrace` | ntext | 1073741823 | ✅ | - |
| `Computername` | nvarchar | 200 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 96627863 |
| `BCode` | 302416290 |
| `Datum` | 2015-10-26 15:28:27.050000 |
| `Aktion` | Kunde gelöscht: Kunde  (10000) |
| `ObjCode` | 806962428 |
| `SDObjMemberCode` | 0 |
| `Klasse` | Kunden |
| `Tabelle` | Kunden |
| `Stacktrace` |  |
| `Computername` | TORSTEN-LAPTOP |

---

## dbo.Mahnlauf

<a name="dboMahnlauf"></a>

**Anzahl Datensätze:** 33

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Nummer` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | - |
| `ErstellerCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 3608986 |
| `Nummer` | 1 |
| `Datum` | 2022-08-23 13:58:43.707000 |
| `Notiz` | Mahnlauf AS | 23.08.2022 |
| `ErstellerCode` | 888797748 |

---

## dbo.MahnlaufMark

<a name="dboMahnlaufMark"></a>

**Anzahl Datensätze:** 72

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `RACode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `LetzteMahnstufe` | int | - | ✅ | - |
| `AktuelleMahnstufe` | int | - | ✅ | - |
| `ErstellerCode` | int | - | ✅ | - |
| `MahnlaufCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | - |
| `Frist` | datetime | - | ✅ | - |
| `Summe` | float | - | ✅ | - |
| `Offen` | float | - | ✅ | - |
| `Gebühr` | float | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 951752 |
| `RACode` | 685009784 |
| `Datum` | 2023-08-10 15:58:37.793000 |
| `LetzteMahnstufe` | 1 |
| `AktuelleMahnstufe` | 2 |
| `ErstellerCode` | 888797748 |
| `MahnlaufCode` | 83011491 |
| `Notiz` | NULL |
| `Frist` | 2023-08-17 00:00:00 |
| `Summe` | 7420.35 |
| `Offen` | 7400.35 |
| `Gebühr` | 20.0 |

---

## dbo.Mahnungen

<a name="dboMahnungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `PosCode` | int | - | ✅ | ((0)) |
| `Mahnstufe` | int | - | ✅ | ((0)) |
| `LetzteMahnung` | datetime | - | ✅ | - |
| `Mahnen` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Mahnwesen

<a name="dboMahnwesen"></a>

**Anzahl Datensätze:** 4

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Stufe` | int | - | ✅ | - |
| `Kopftext` | ntext | 1073741823 | ✅ | - |
| `Fußtext` | ntext | 1073741823 | ✅ | - |
| `Frist` | int | - | ✅ | - |
| `Gebühr` | int | - | ✅ | - |
| `SprachCode` | int | - | ✅ | ((0)) |
| `Lieferantenmahnung` | int | - | ✅ | - |
| `Vorlage` | nvarchar | 200 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `Stufe` | 1 |
| `Kopftext` | Sehr geehrte Damen und Herren,



bei Durchsicht unserer Konten stellten wir fest, dass nachfolgende... (total: 186 chars) |
| `Fußtext` | Sollten Sie diese Rechnung(en) zwischenzeitlich beglichen haben, betrachten Sie dieses Schreiben bit... (total: 253 chars) |
| `Frist` | 7 |
| `Gebühr` | 0 |
| `SprachCode` | 0 |
| `Lieferantenmahnung` | 0 |
| `Vorlage` | NULL |

---

## dbo.MailAnhang

<a name="dboMailAnhang"></a>

**Anzahl Datensätze:** 53,535

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BriefCode` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `DateiName` | nvarchar | 500 | ✅ | - |
| `Eingehend` | int | - | ✅ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `InlineAttachement` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1515816568 |
| `BriefCode` | 245187165 |
| `BCode` | 0 |
| `DateiName` | 2022\11\9\245187165^Profilzylinder mit Sicherungskarte.pdf |
| `Eingehend` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `InlineAttachement` | NULL |

---

## dbo.MailCC

<a name="dboMailCC"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BCode` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `Adresse` | nvarchar | 50 | ✅ | - |
| `Blind` | int | - | ✅ | ((0)) |
| `An` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Material

<a name="dboMaterial"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `Name` | ntext | 1073741823 | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `SDKAbteilungCode` | int | - | ✅ | - |
| `SDKAnsprechpCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Mehrwertsteuersätze

<a name="dboMehrwertsteuersätze"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `MwstCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `MwstName` | real | - | ✅ | ((0)) |
| `MwstReihenfolge` | int | - | ✅ | ((0)) |
| `Deaktiviert` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `MwstCode` | 1 |
| `MwstName` | 19.0 |
| `MwstReihenfolge` | 0 |
| `Deaktiviert` | NULL |

---

## dbo.Mentions

<a name="dboMentions"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `FromUserCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `ObjectCode` | int | - | ✅ | - |
| `ObjectId` | uniqueidentifier | - | ✅ | - |
| `ObjectTyp` | int | - | ✅ | - |
| `ParentObjectCode` | int | - | ✅ | - |
| `ParentObjectId` | uniqueidentifier | - | ✅ | - |
| `ParentObjectType` | int | - | ✅ | - |
| `ToUserCode` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Mitarbeiter

<a name="dboMitarbeiter"></a>

**Anzahl Datensätze:** 43

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 50 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `MName` | nvarchar | 35 | ✅ | - |
| `Vorname` | nvarchar | 30 | ✅ | - |
| `Straße` | nvarchar | 35 | ✅ | - |
| `Staat` | nvarchar | 4 | ✅ | - |
| `Plz` | nvarchar | 8 | ✅ | - |
| `Ort` | nvarchar | 28 | ✅ | - |
| `Telefon` | nvarchar | 20 | ✅ | - |
| `Beschart` | int | - | ✅ | - |
| `Anspruch` | real | - | ✅ | - |
| `Vorjahr` | real | - | ✅ | - |
| `Bisjetzt` | real | - | ✅ | - |
| `BilddateiName` | nvarchar | 40 | ✅ | - |
| `PLZ2` | nvarchar | 8 | ✅ | - |
| `Postfach` | nvarchar | 20 | ✅ | - |
| `Vorwahl` | nvarchar | 20 | ✅ | - |
| `Telefax` | nvarchar | 20 | ✅ | - |
| `AnredeCode` | int | - | ✅ | ((0)) |
| `BriefAnrede` | nvarchar | 50 | ✅ | - |
| `Lohnsatz1` | real | - | ✅ | ((0)) |
| `Lohnsatz2` | real | - | ✅ | ((0)) |
| `Lohnsatz3` | real | - | ✅ | ((0)) |
| `StandardLohnsatz` | int | - | ✅ | ((0)) |
| `ListFlag` | int | - | ✅ | ((0)) |
| `Pass1` | int | - | ✅ | - |
| `Pass2` | int | - | ✅ | - |
| `Mark` | nvarchar | 1 | ✅ | - |
| `Maschine` | int | - | ✅ | ((0)) |
| `Eintrittsdatum` | datetime | - | ✅ | - |
| `Geburtsdatum` | datetime | - | ✅ | - |
| `Geburtsort` | nvarchar | 50 | ✅ | - |
| `Staatsangehörigkeit` | nvarchar | 50 | ✅ | - |
| `Sozialversicherungsnummer` | nvarchar | 50 | ✅ | - |
| `Krankenkasse` | nvarchar | 50 | ✅ | - |
| `Bruttogehalt` | float | - | ✅ | ((0)) |
| `Bankverbindung` | nvarchar | 50 | ✅ | - |
| `BLZ` | nvarchar | 50 | ✅ | - |
| `Kontonummer` | nvarchar | 50 | ✅ | - |
| `Frei1` | nvarchar | 50 | ✅ | - |
| `Frei2` | nvarchar | 50 | ✅ | - |
| `Frei3` | nvarchar | 50 | ✅ | - |
| `Frei4` | nvarchar | 50 | ✅ | - |
| `Frei5` | nvarchar | 50 | ✅ | - |
| `Teilzeitfaktor` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `eMail` | nvarchar | 50 | ✅ | - |
| `Mobilfunk` | nvarchar | 20 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Ausgeschieden` | int | - | ✅ | ((0)) |
| `LieferantenCode` | int | - | ✅ | ((0)) |
| `Kostenstelle` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 575681368 |
| `Name` | TEST |
| `GrCode` | NULL |
| `Nummer` | NULL |
| `MName` | NULL |
| `Vorname` | TEST |
| `Straße` | NULL |
| `Staat` | NULL |
| `Plz` | NULL |
| `Ort` | NULL |
| `Telefon` | NULL |
| `Beschart` | NULL |
| `Anspruch` | NULL |
| `Vorjahr` | NULL |
| `Bisjetzt` | NULL |
| `BilddateiName` | NULL |
| `PLZ2` | NULL |
| `Postfach` | NULL |
| `Vorwahl` | NULL |
| `Telefax` | NULL |
| `AnredeCode` | 0 |
| `BriefAnrede` | NULL |
| `Lohnsatz1` | 0.0 |
| `Lohnsatz2` | 0.0 |
| `Lohnsatz3` | 0.0 |
| `StandardLohnsatz` | 0 |
| `ListFlag` | 0 |
| `Pass1` | NULL |
| `Pass2` | NULL |
| `Mark` | NULL |
| `Maschine` | 0 |
| `Eintrittsdatum` | NULL |
| `Geburtsdatum` | NULL |
| `Geburtsort` | NULL |
| `Staatsangehörigkeit` | NULL |
| `Sozialversicherungsnummer` | NULL |
| `Krankenkasse` | NULL |
| `Bruttogehalt` | 0.0 |
| `Bankverbindung` | NULL |
| `BLZ` | NULL |
| `Kontonummer` | NULL |
| `Frei1` | NULL |
| `Frei2` | NULL |
| `Frei3` | NULL |
| `Frei4` | NULL |
| `Frei5` | NULL |
| `Teilzeitfaktor` | 0 |
| `BenutzerCode` | 575681368 |
| `eMail` | NULL |
| `Mobilfunk` | NULL |
| `Notiz` | NULL |
| `Ausgeschieden` | 0 |
| `LieferantenCode` | 0 |
| `Kostenstelle` | 0 |

---

## dbo.MitarbeiterGr

<a name="dboMitarbeiterGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 40 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.MitarbeiterMark

<a name="dboMitarbeiterMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BenutzerCode` | int | - | ❌ | - |
| `ObjCode` | int | - | ❌ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Monatssoll

<a name="dboMonatssoll"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Monat` | int | - | ✅ | ((0)) |
| `Jahr` | int | - | ✅ | ((0)) |
| `Sollwert` | float | - | ✅ | ((0)) |
| `MitarbeiterCode` | int | - | ✅ | ((0)) |
| `Arbeitstage` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.MussFelder

<a name="dboMussFelder"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Form` | nvarchar | 50 | ✅ | - |
| `Field` | nvarchar | 50 | ✅ | - |
| `Index` | int | - | ✅ | ((0)) |
| `StdWert` | nvarchar | 50 | ✅ | - |
| `BZObjType` | int | - | ✅ | ((0)) |
| `Meldung` | ntext | 1073741823 | ✅ | - |
| `DataType` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Muster

<a name="dboMuster"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BZObjType` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `Bezeichnung` | nvarchar | 100 | ✅ | - |
| `MusterErstelltBCode` | int | - | ✅ | - |
| `MusterErstelltDatum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Neukunden

<a name="dboNeukunden"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjMemberCode` | int | - | ✅ | - |
| `AnsprechpCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | 4000 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.NotificationHandled

<a name="dboNotificationHandled"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `NotificationId` | uniqueidentifier | - | ✅ | - |
| `SentDetails` | nvarchar | -1 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.NotificationsRead

<a name="dboNotificationsRead"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `NotificationEntityId` | uniqueidentifier | - | ✅ | - |
| `NotificationType` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Notizen

<a name="dboNotizen"></a>

**Anzahl Datensätze:** 240

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `KNBerichtCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | - |
| `SN` | nvarchar | 50 | ✅ | - |
| `ParentCode` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `BErstellt` | datetime | - | ✅ | - |
| `ModificationDate` | datetime | - | ✅ | - |
| `ErinnernDate` | datetime | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `Status` | int | - | ✅ | - |
| `Titel` | nvarchar | 100 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 99953320 |
| `BenutzerCode` | 39819682 |
| `SDObjType` | 1 |
| `SDObjMemberCode` | 126145102 |
| `Datum` | 2022-04-13 00:00:00 |
| `AnsprpCode` | 0 |
| `Notiz` | Herr Wagner hat den Weru-Farbfächer mit den Kaschierfarben abgeholt.



Er benötigt ihn für einen Te... (total: 172 chars) |
| `KNBerichtCode` | 0 |
| `ProjektCode` | 46132572 |
| `SN` | NULL |
| `ParentCode` | 0 |
| `BCode` | 39819682 |
| `BErstellt` | 2022-04-13 16:07:40.530000 |
| `ModificationDate` | 2022-05-09 08:52:24.640000 |
| `ErinnernDate` | NULL |
| `ObjGrCode` | 0 |
| `Status` | NULL |
| `Titel` | Abholung Weru-Farbfächer - Kaschierfarben |
| `ArtikelCode` | 0 |
| `ProjektePlanungCode` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.NotizenAnhang

<a name="dboNotizenAnhang"></a>

**Anzahl Datensätze:** 4

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `ObjCode` | int | - | ✅ | ((0)) |
| `Datei` | nvarchar | 255 | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |
| `OriginalFileName` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 24866865 |
| `Notiz` |  |
| `Datum` | 2022-05-23 11:56:15.257000 |
| `BenutzerCode` | 0 |
| `ObjCode` | 59756772 |
| `Datei` | PDF_2_000866.pdf |
| `Briefdatei` | <binary data, 19000 bytes> |
| `OriginalFileName` | NULL |

---

## dbo.NotizHistorie

<a name="dboNotizHistorie"></a>

**Anzahl Datensätze:** 797

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `KNCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Aktion` | nvarchar | 4000 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Person` | nvarchar | 4000 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 951752 |
| `KNCode` | 95967468 |
| `BCode` | 59088549 |
| `Aktion` | Änderung |
| `Datum` | 2023-06-12 08:40:13.800000 |
| `Person` | Susann Zielinski |

---

## dbo.NummernHistorie

<a name="dboNummernHistorie"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `RelatedSDObjMemberCode` | int | - | ✅ | - |
| `RelatedSDObjType` | int | - | ✅ | - |
| `Nummer` | nvarchar | 50 | ✅ | - |
| `Notiz` | nvarchar | 200 | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.NummernKreise

<a name="dboNummernKreise"></a>

**Anzahl Datensätze:** 18

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ObjType` | int | - | ❌ | - |
| `ErsteNummer` | int | - | ✅ | - |
| `LetzteNummer` | int | - | ✅ | - |
| `Step` | float | - | ✅ | ((1)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `ObjType` | 0 |
| `ErsteNummer` | 70000 |
| `LetzteNummer` | 99999 |
| `Step` | 1.0 |

---

## dbo.ObjectLock

<a name="dboObjectLock"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `OwnerCode` | int | - | ❌ | - |
| `ObjType` | int | - | ❌ | - |
| `ObjCode` | int | - | ✅ | - |
| `Heartbeat` | datetime | - | ❌ | - |
| `ObjId` | uniqueidentifier | - | ✅ | - |
| `Code` | int | - | ❌ | ((0)) |
| `CreationDateTime` | datetime | - | ✅ | - |
| `Application` | nvarchar | 200 | ✅ | ('') |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Id` | E6D8B421-35CF-4269-9CCD-1B9623DA1CE6 |
| `OwnerCode` | 581413548 |
| `ObjType` | 7 |
| `ObjCode` | 690606163 |
| `Heartbeat` | 2025-12-05 09:18:57.537000 |
| `ObjId` | 00000000-0000-0000-0000-000000000000 |
| `Code` | 615594160 |
| `CreationDateTime` | 2025-12-05 08:34:53.773000 |
| `Application` | work4all 10 |

---

## dbo.ObjektBegriffe

<a name="dboObjektBegriffe"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Original` | nvarchar | 256 | ✅ | - |
| `Wert` | nvarchar | 256 | ✅ | - |
| `Sprachcode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1197489585 |
| `Original` | Bedarfsanforderung |
| `Wert` | Preisanfrage |
| `Sprachcode` | 0 |

---

## dbo.ObjektDateiZugriff

<a name="dboObjektDateiZugriff"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `ObjectCode` | int | - | ✅ | - |
| `ObjectId` | uniqueidentifier | - | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `TTL` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Objekte

<a name="dboObjekte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Listflag` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `WV_Nummer` | nvarchar | 50 | ✅ | - |
| `WV_Dokument` | nvarchar | 120 | ✅ | - |
| `WV_Von` | datetime | - | ✅ | - |
| `WV_Bis` | datetime | - | ✅ | - |
| `WV_Betrag` | float | - | ✅ | ((0)) |
| `SN_Nummer` | nvarchar | 50 | ✅ | - |
| `SN_Dokument` | nvarchar | 120 | ✅ | - |
| `SN_LieferscheinNummer` | int | - | ✅ | ((0)) |
| `SN_Datum` | datetime | - | ✅ | - |
| `Name` | nvarchar | 100 | ✅ | - |
| `AbteilungCode` | int | - | ✅ | ((0)) |
| `AnsprechpartnerCode` | int | - | ✅ | ((0)) |
| `EndkundenCode` | int | - | ✅ | ((0)) |
| `WhattodoDatum` | datetime | - | ✅ | - |
| `WhattodoBCode` | int | - | ✅ | ((0)) |
| `Rechnung_Art` | int | - | ✅ | ((0)) |
| `Rhythmus` | int | - | ✅ | ((0)) |
| `ZahlungsCode` | int | - | ✅ | ((0)) |
| `LookupCode` | int | - | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `NebenAdrCode1` | int | - | ✅ | - |
| `NebenAdrCode2` | int | - | ✅ | - |
| `NebenAdrCode3` | int | - | ✅ | - |
| `NebenAdrAPCode1` | int | - | ✅ | - |
| `NebenAdrAPCode2` | int | - | ✅ | - |
| `NebenAdrAPCode3` | int | - | ✅ | - |
| `DatumKündigung` | datetime | - | ✅ | - |
| `DatumNächsteAbrechnung` | datetime | - | ✅ | - |
| `EndkundenAPCode` | int | - | ✅ | - |
| `DatumAngelegt` | datetime | - | ✅ | - |
| `BCodeAngelegt` | int | - | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `KostenStCode` | int | - | ✅ | - |
| `Skonto` | real | - | ✅ | - |
| `Skontofrist` | real | - | ✅ | - |
| `Zahlungsfrist` | int | - | ✅ | - |
| `AuftragCode` | int | - | ✅ | ((0)) |
| `SprachCode` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode2` | int | - | ✅ | ((0)) |
| `Dauerrechnung` | int | - | ✅ | ((0)) |
| `Preisgruppe` | int | - | ✅ | - |
| `InkludierteMinutenJeMonat` | int | - | ✅ | - |
| `InkludierteZeitenAutomatisch` | int | - | ✅ | - |
| `NebenAdrPostfach2` | int | - | ✅ | - |
| `Steuer` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `Erstbelegnummer` | int | - | ✅ | - |
| `ERechnung_Auftragsnummer_BT14` | nvarchar | 500 | ✅ | - |
| `ERechnung_Bestellnummer_BT13` | nvarchar | 500 | ✅ | - |
| `ERechnung_Empfangsbestätigung_BT15` | nvarchar | 500 | ✅ | - |
| `ERechnung_Objekt_BT18` | nvarchar | 500 | ✅ | - |
| `ERechnung_Projektreferenz_BT11` | nvarchar | 500 | ✅ | - |
| `ERechnung_Tender_BT17` | nvarchar | 500 | ✅ | - |
| `ERechnung_Versandanzeige_BT16` | nvarchar | 500 | ✅ | - |
| `ERechnung_Vertragsnummer_BT12` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ObjekteDetails

<a name="dboObjekteDetails"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ObjektCode` | int | - | ✅ | ((0)) |
| `ObjektParentCode` | int | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Beschreibung` | varchar | 300 | ✅ | - |
| `SN` | varchar | 30 | ✅ | - |
| `WartungNr` | varchar | 30 | ✅ | - |
| `Notiz` | varchar | 200 | ✅ | - |
| `ObjektIndex` | int | - | ✅ | ((0)) |
| `Anzahl` | int | - | ✅ | ((0)) |
| `Preis` | float | - | ✅ | ((0)) |
| `ArtikelNummer` | varchar | 15 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Garantie` | datetime | - | ✅ | - |
| `WartungspreisJahr` | float | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ObjekteGr

<a name="dboObjekteGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrName` | nvarchar | 70 | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrIndex` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ObjekteHistorie

<a name="dboObjekteHistorie"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `ObjektCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `InkludierteMinutenJeMonat` | int | - | ✅ | - |
| `InkludierteZeitenAutomatisch` | int | - | ✅ | - |
| `SummeAbzurechnen` | float | - | ✅ | - |
| `Rhythmus` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ObjekteParent

<a name="dboObjekteParent"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ObjektIndex` | int | - | ✅ | ((0)) |
| `ObjektCode` | int | - | ✅ | ((0)) |
| `Beschreibung` | ntext | 1073741823 | ✅ | - |
| `SN` | nvarchar | 30 | ✅ | - |
| `WartungNr` | nvarchar | 30 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Anzahl` | int | - | ✅ | ((0)) |
| `Preis` | float | - | ✅ | ((0)) |
| `ArtikelNummer` | nvarchar | 20 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Garantie` | datetime | - | ✅ | - |
| `WartungspreisJahr` | float | - | ✅ | ((0)) |
| `Prozent` | float | - | ✅ | - |
| `Art` | int | - | ✅ | - |
| `Rabatt` | float | - | ✅ | - |
| `Kurztext` | nvarchar | 150 | ✅ | - |
| `Herstellernummer` | varchar | 20 | ✅ | - |
| `Preis2` | float | - | ✅ | - |
| `Preis2AbDatum` | datetime | - | ✅ | - |
| `GültigAb` | datetime | - | ✅ | - |
| `GültigBis` | datetime | - | ✅ | - |
| `EKPreis` | float | - | ✅ | - |
| `LieferantenCode` | int | - | ✅ | - |
| `EKPreis2` | float | - | ✅ | - |
| `Frei1` | nvarchar | 4000 | ✅ | ('') |
| `Frei2` | nvarchar | 4000 | ✅ | ('') |
| `Frei3` | nvarchar | 4000 | ✅ | ('') |
| `Frei4` | nvarchar | 4000 | ✅ | ('') |
| `Frei5` | nvarchar | 4000 | ✅ | ('') |
| `Lieferantentext` | ntext | 1073741823 | ✅ | ('') |
| `AnzahlLieferant` | int | - | ✅ | - |
| `AnzahlDecimal` | float | - | ✅ | - |
| `Kostenstelle` | int | - | ✅ | ((0)) |
| `Rabatt2` | float | - | ✅ | - |
| `Faktor` | float | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ObjGrBZObject

<a name="dboObjGrBZObject"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BZObjMemberCode` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Kommentar` | nvarchar | 4000 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ObjGrItems

<a name="dboObjGrItems"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ObjGrCode` | int | - | ✅ | ((0)) |
| `SDObjMembercode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `LastModificationDate` | datetime | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 2098120861 |
| `ObjGrCode` | 1 |
| `SDObjMembercode` | 35833830 |
| `SDObjType` | 2 |
| `BCode` | 0 |
| `LastModificationDate` | 2022-10-10 21:49:55.733000 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.OciWebShop

<a name="dboOciWebShop"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Name` | nvarchar | 500 | ✅ | - |
| `Url` | nvarchar | -1 | ✅ | - |
| `CustomerNumber` | nvarchar | 500 | ✅ | - |
| `Password` | nvarchar | 500 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `UserName` | nvarchar | 500 | ✅ | - |
| `ShopType` | int | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |
| `VisibleForAllUsers` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.OciWebShopRequest

<a name="dboOciWebShopRequest"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BzObjMemberCode` | int | - | ✅ | - |
| `BzObjType` | int | - | ✅ | - |
| `Id` | uniqueidentifier | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Response` | nvarchar | -1 | ✅ | - |
| `ShadowBzObjectId` | uniqueidentifier | - | ✅ | - |
| `State` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.OnlineBankingBooked

<a name="dboOnlineBankingBooked"></a>

**Anzahl Datensätze:** 4,249

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Amount` | float | - | ✅ | - |
| `ArtAuszifferung` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `BookedDate` | datetime | - | ✅ | - |
| `DatumAngelegt` | datetime | - | ✅ | - |
| `EntryDate` | datetime | - | ✅ | - |
| `PaymentPurpose` | nvarchar | 500 | ✅ | - |
| `RABezSummeCode` | int | - | ✅ | - |
| `REBezSummeCode` | int | - | ✅ | - |
| `RACode` | int | - | ✅ | - |
| `RECode` | int | - | ✅ | - |
| `PayeePayerName` | nvarchar | 200 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 172154 |
| `Amount` | 1983.09 |
| `ArtAuszifferung` | 0 |
| `BenutzerCode` | 1364566387 |
| `BookedDate` | 2023-08-11 00:00:00 |
| `DatumAngelegt` | 2023-08-16 16:07:14.473000 |
| `EntryDate` | 2023-08-11 00:00:00 |
| `PaymentPurpose` | Rechn.Nr.  230476 |
| `RABezSummeCode` | 0 |
| `REBezSummeCode` | 0 |
| `RACode` | 173248055 |
| `RECode` | 0 |
| `PayeePayerName` | NULL |

---

## dbo.OperationLog

<a name="dboOperationLog"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `ApiId` | nvarchar | 500 | ✅ | - |
| `ApiUrl` | nvarchar | -1 | ✅ | - |
| `ApplicationType` | nvarchar | 500 | ✅ | - |
| `DebugSessionName` | nvarchar | -1 | ✅ | - |
| `Environment` | nvarchar | 500 | ✅ | - |
| `GqlRequest` | int | - | ✅ | - |
| `ObjectCode` | int | - | ✅ | - |
| `ObjectId` | uniqueidentifier | - | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `OperationType` | int | - | ✅ | - |
| `SentryTraceId` | uniqueidentifier | - | ✅ | - |
| `Timestamp` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |
| `WebsiteHost` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.OutlookAdressen

<a name="dboOutlookAdressen"></a>

**Anzahl Datensätze:** 2,353

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `AnsprechpCode` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `ModificationDate` | datetime | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 85000503 |
| `SDObjMemberCode` | 66149117 |
| `SDObjType` | 1 |
| `AnsprechpCode` | 112185233 |
| `BCode` | 581413548 |
| `ModificationDate` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.PAN

<a name="dboPAN"></a>

**Anzahl Datensätze:** 11,091

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `AnsprechpCode` | int | - | ✅ | ((0)) |
| `Nummer_Original` | nvarchar | 50 | ✅ | - |
| `Nummer_Pan` | nvarchar | 50 | ✅ | - |
| `Nummer_Typ` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 963048222 |
| `SDObjType` | 0 |
| `SDObjMemberCode` | 1 |
| `AnsprechpCode` | 0 |
| `Nummer_Original` | +49-2234-6903-0 |
| `Nummer_Pan` | 0223469030 |
| `Nummer_Typ` | 1 |

---

## dbo.PlugInRechte

<a name="dboPlugInRechte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BenutzerCode` | int | - | ✅ | - |
| `PlugInName` | nvarchar | 200 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.PositionConversionHistory

<a name="dboPositionConversionHistory"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ✅ | - |
| `OriginalPositionCode` | int | - | ✅ | - |
| `PositionCode` | int | - | ✅ | - |
| `OriginalBzObjType` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Positionen

<a name="dboPositionen"></a>

**Anzahl Datensätze:** 119,877

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BZObjType` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `PozNr` | nvarchar | 20 | ✅ | - |
| `Bezeichnung` | ntext | 1073741823 | ✅ | - |
| `ArtNr` | nvarchar | 20 | ✅ | - |
| `Anzahl` | real | - | ✅ | ((0)) |
| `Minutenpreis` | float | - | ✅ | ((0)) |
| `Einheit` | nvarchar | 30 | ✅ | - |
| `EinzPreis` | float | - | ✅ | ((0)) |
| `GesPreis` | float | - | ✅ | ((0)) |
| `Mwst` | real | - | ✅ | ((0)) |
| `Rabatt` | real | - | ✅ | ((0)) |
| `Zuschlag` | real | - | ✅ | ((0)) |
| `Aufmaß` | ntext | 1073741823 | ✅ | - |
| `EKPreis` | real | - | ✅ | ((0)) |
| `Aufwand` | real | - | ✅ | ((0)) |
| `ArtikelArt` | int | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Bemerkung` | ntext | 1073741823 | ✅ | - |
| `Faktor` | float | - | ✅ | - |
| `KostenstNummer` | int | - | ✅ | - |
| `SachkNummer` | int | - | ✅ | - |
| `Rueckstand` | float | - | ✅ | ((0)) |
| `Geliefert` | float | - | ✅ | ((0)) |
| `Liefertermin` | datetime | - | ✅ | - |
| `ProvisionProzent` | float | - | ✅ | ((0)) |
| `ProvisionDM` | float | - | ✅ | ((0)) |
| `ProvisionärCode` | int | - | ✅ | ((0)) |
| `Bestellmenge` | float | - | ✅ | ((0)) |
| `Gebucht` | int | - | ✅ | ((0)) |
| `tmpUmwandlung` | int | - | ✅ | ((0)) |
| `Kurztext` | nvarchar | 150 | ✅ | - |
| `LagerortCode` | int | - | ✅ | ((0)) |
| `SLArtCode` | int | - | ✅ | ((0)) |
| `SLAnzahl` | float | - | ✅ | ((0)) |
| `SLType` | int | - | ✅ | ((0)) |
| `PosCode` | int | - | ✅ | ((0)) |
| `GarantieBis` | datetime | - | ✅ | - |
| `OriginalCode` | int | - | ✅ | ((0)) |
| `SLIndex` | int | - | ✅ | ((0)) |
| `TitelCode` | int | - | ✅ | ((0)) |
| `Mahnen` | int | - | ✅ | ((0)) |
| `ZuletztGemahnt` | datetime | - | ✅ | - |
| `RTFBezeichnung` | ntext | 1073741823 | ✅ | - |
| `Reserviert` | float | - | ✅ | ((0)) |
| `Kostenkonto` | int | - | ✅ | ((0)) |
| `EKZuschlag` | float | - | ✅ | ((0)) |
| `AnzahlungCode` | int | - | ✅ | ((0)) |
| `Einzelgewicht` | float | - | ✅ | - |
| `Gewicht` | float | - | ✅ | ((0)) |
| `Frei1` | int | - | ✅ | ((0)) |
| `Frei2` | nvarchar | 10 | ✅ | - |
| `Frei3` | nvarchar | 25 | ✅ | - |
| `Abrechenbar` | int | - | ✅ | ((0)) |
| `StaffelDefinitionenCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | - |
| `CreationDate` | datetime | - | ✅ | - |
| `EditBenutzerCode` | int | - | ✅ | - |
| `EditDate` | datetime | - | ✅ | - |
| `ProduktionschargenCode` | int | - | ✅ | - |
| `LFCode` | int | - | ✅ | - |
| `Länge` | float | - | ✅ | - |
| `Breite` | float | - | ✅ | - |
| `Rabatt2` | float | - | ✅ | - |
| `SLMode` | int | - | ✅ | - |
| `EigeneArtikelnummer` | nvarchar | 200 | ✅ | - |
| `Listenpreis` | float | - | ✅ | - |
| `AnzahlungsrechnungCode` | int | - | ✅ | - |
| `Volumen` | float | - | ✅ | - |
| `Gesamtvolumen` | float | - | ✅ | - |
| `Kalkulationslogik` | int | - | ✅ | - |
| `KalkulationslogikFaktor` | float | - | ✅ | - |
| `UhrzeitBeginn` | datetime | - | ✅ | - |
| `UhrzeitEnde` | datetime | - | ✅ | - |
| `FormatierungsArt` | nvarchar | 100 | ✅ | - |
| `Herstellernummer` | nvarchar | 200 | ✅ | - |
| `VEFaktor` | decimal | - | ✅ | - |
| `KartonFaktor` | decimal | - | ✅ | - |
| `AutoEKProzent` | float | - | ✅ | - |
| `ObjekteParentCode` | int | - | ✅ | - |
| `EinzPreisBrutto` | float | - | ✅ | - |
| `GesPreisBrutto` | float | - | ✅ | - |
| `Vorgang` | nvarchar | 250 | ✅ | ('') |
| `Rabatt3` | float | - | ✅ | - |
| `Rabatt4` | float | - | ✅ | - |
| `Lagerort` | nvarchar | 4000 | ✅ | ('') |
| `Palettenfaktor` | float | - | ✅ | - |
| `Fertigmeldung` | int | - | ✅ | ((0)) |
| `FertigmeldungDatum` | datetime | - | ✅ | - |
| `FertigmeldungDurchBCode` | int | - | ✅ | ((0)) |
| `FertigmeldungNotiz` | nvarchar | 4000 | ✅ | ('') |
| `VEFaktorMultiplikator` | decimal | - | ✅ | - |
| `KartonFaktorMultiplikator` | decimal | - | ✅ | - |
| `PalettenFaktorMultiplikator` | decimal | - | ✅ | - |
| `XMLImport` | int | - | ✅ | ((0)) |
| `KostenstNummer2` | int | - | ✅ | ((0)) |
| `DispositionBegin` | datetime | - | ✅ | - |
| `DispositionEnde` | datetime | - | ✅ | - |
| `Disposition` | int | - | ✅ | ((0)) |
| `Zeitbedarf` | float | - | ✅ | - |
| `LagerMobilFertig` | int | - | ✅ | - |
| `BearbeiterBenutzerCode` | int | - | ✅ | - |
| `Frei4` | nvarchar | -1 | ✅ | - |
| `KundenMaterial` | nvarchar | 500 | ✅ | - |
| `TatsaechlicherLiefertermin` | datetime | - | ✅ | - |
| `KundenMaterialCode` | int | - | ✅ | - |
| `KostenerfassungCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `Buchungsmenge` | float | - | ✅ | - |
| `Feld1` | bit | - | ✅ | - |
| `OldBZObjMemberCode` | int | - | ✅ | - |
| `OldBZObjType` | int | - | ✅ | - |
| `Zolltarifnummer` | nvarchar | 50 | ✅ | - |
| `ERechnungObjektKennungBT128` | nvarchar | 500 | ✅ | - |
| `ERechnungObjektKennungTypeBT128` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1476 |
| `BZObjType` | 7 |
| `BZObjMemberCode` | 87238190 |
| `Nummer` | 4 |
| `PozNr` | 2.1 |
| `Bezeichnung` | Austausch der Aluminium-Füllung.

Die Abrechnung erfolgt je Facharbeiter im Viertel-Stunden-Takt.

0... (total: 177 chars) |
| `ArtNr` | 99-000023 |
| `Anzahl` | 2.25 |
| `Minutenpreis` | 0.0 |
| `Einheit` | h |
| `EinzPreis` | 58.82 |
| `GesPreis` | 132.35 |
| `Mwst` | 19.0 |
| `Rabatt` | 0.0 |
| `Zuschlag` | 1.0 |
| `Aufmaß` | NULL |
| `EKPreis` | 48.7400016784668 |
| `Aufwand` | 0.0 |
| `ArtikelArt` | 0 |
| `ArtikelCode` | 4937604 |
| `Bemerkung` |  |
| `Faktor` | NULL |
| `KostenstNummer` | 1000 |
| `SachkNummer` | 8400 |
| `Rueckstand` | 2.25 |
| `Geliefert` | 0.0 |
| `Liefertermin` | 2023-08-04 00:00:00 |
| `ProvisionProzent` | 0.0 |
| `ProvisionDM` | 0.0 |
| `ProvisionärCode` | 0 |
| `Bestellmenge` | 0.0 |
| `Gebucht` | 0 |
| `tmpUmwandlung` | 0 |
| `Kurztext` | Reparatur |
| `LagerortCode` | 1 |
| `SLArtCode` | 0 |
| `SLAnzahl` | 1.0 |
| `SLType` | 1 |
| `PosCode` | 0 |
| `GarantieBis` | NULL |
| `OriginalCode` | 9213032 |
| `SLIndex` | 0 |
| `TitelCode` | 0 |
| `Mahnen` | 0 |
| `ZuletztGemahnt` | NULL |
| `RTFBezeichnung` | NULL |
| `Reserviert` | 0.0 |
| `Kostenkonto` | 0 |
| `EKZuschlag` | 20.68116 |
| `AnzahlungCode` | 0 |
| `Einzelgewicht` | 0.0 |
| `Gewicht` | 0.0 |
| `Frei1` | 0 |
| `Frei2` | NULL |
| `Frei3` | NULL |
| `Abrechenbar` | 0 |
| `StaffelDefinitionenCode` | 0 |
| `ProjektCode` | 0 |
| `BenutzerCode` | 581413548 |
| `CreationDate` | 2023-07-10 00:00:00 |
| `EditBenutzerCode` | 0 |
| `EditDate` | NULL |
| `ProduktionschargenCode` | 0 |
| `LFCode` | 0 |
| `Länge` | 1.0 |
| `Breite` | 1.0 |
| `Rabatt2` | 0.0 |
| `SLMode` | -1 |
| `EigeneArtikelnummer` | 99-000023 |
| `Listenpreis` | 58.819997384 |
| `AnzahlungsrechnungCode` | 0 |
| `Volumen` | 0.0 |
| `Gesamtvolumen` | NULL |
| `Kalkulationslogik` | 0 |
| `KalkulationslogikFaktor` | 1.0 |
| `UhrzeitBeginn` | NULL |
| `UhrzeitEnde` | NULL |
| `FormatierungsArt` |  |
| `Herstellernummer` |  |
| `VEFaktor` | 2.25000000 |
| `KartonFaktor` | 2.25000000 |
| `AutoEKProzent` | 0.0 |
| `ObjekteParentCode` | 0 |
| `EinzPreisBrutto` | 70.0 |
| `GesPreisBrutto` | 157.49 |
| `Vorgang` | A230197.02 |
| `Rabatt3` | 0.0 |
| `Rabatt4` | 0.0 |
| `Lagerort` | Hauptlager |
| `Palettenfaktor` | 2.25 |
| `Fertigmeldung` | 0 |
| `FertigmeldungDatum` | NULL |
| `FertigmeldungDurchBCode` | 0 |
| `FertigmeldungNotiz` | NULL |
| `VEFaktorMultiplikator` | 1.00000000 |
| `KartonFaktorMultiplikator` | 1.00000000 |
| `PalettenFaktorMultiplikator` | 1.00000000 |
| `XMLImport` | 0 |
| `KostenstNummer2` | 0 |
| `DispositionBegin` | NULL |
| `DispositionEnde` | NULL |
| `Disposition` | 0 |
| `Zeitbedarf` | 0.0 |
| `LagerMobilFertig` | 0 |
| `BearbeiterBenutzerCode` | 888797748 |
| `Frei4` |  |
| `KundenMaterial` | NULL |
| `TatsaechlicherLiefertermin` | 2023-08-04 00:00:00 |
| `KundenMaterialCode` | 0 |
| `KostenerfassungCode` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `Buchungsmenge` | 0.0 |
| `Feld1` | True |
| `OldBZObjMemberCode` | NULL |
| `OldBZObjType` | NULL |
| `Zolltarifnummer` | NULL |
| `ERechnungObjektKennungBT128` | NULL |
| `ERechnungObjektKennungTypeBT128` | NULL |

---

## dbo.PositionenBilder

<a name="dboPositionenBilder"></a>

**Anzahl Datensätze:** 29,051

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `ID` | uniqueidentifier | - | ✅ | - |
| `PositionenCode` | int | - | ✅ | - |
| `Sortierung` | int | - | ✅ | - |
| `Bild` | image | 2147483647 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 11031 |
| `ID` | 5B45FA17-95AA-4851-99FC-EFC902CDF463 |
| `PositionenCode` | 10183105 |
| `Sortierung` | 0 |
| `Bild` | <binary data, 15775 bytes> |

---

## dbo.PositionenExport

<a name="dboPositionenExport"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `BZObjType` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `PositionCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Exportpfad` | nvarchar | 500 | ✅ | - |
| `ExportModus` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.PositionenFertigmeldung

<a name="dboPositionenFertigmeldung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `PositionenCode` | int | - | ✅ | ((0)) |
| `DatumFertigmeldung` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | ('') |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.PostIt

<a name="dboPostIt"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Owner` | int | - | ✅ | - |
| `Note` | nvarchar | 4000 | ✅ | - |
| `DateCreated` | datetime | - | ✅ | - |
| `Font` | nvarchar | 500 | ✅ | - |
| `FontSize` | int | - | ✅ | - |
| `FontStyle` | nvarchar | 50 | ✅ | - |
| `Extends` | int | - | ✅ | - |
| `Visibility` | bit | - | ✅ | - |
| `DateModified` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Preise

<a name="dboPreise"></a>

**Anzahl Datensätze:** 6,475

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Preisgruppe` | int | - | ✅ | ((0)) |
| `Preis` | float | - | ✅ | ((0)) |
| `Zuschlag` | float | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Festpreis` | int | - | ✅ | - |
| `AMinutenpreis` | float | - | ✅ | - |
| `Minutenpreis` | float | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1157329929 |
| `Preisgruppe` | 4 |
| `Preis` | 3910.99609375 |
| `Zuschlag` | 53.846 |
| `ArtikelCode` | 169227 |
| `Festpreis` | 0 |
| `AMinutenpreis` | NULL |
| `Minutenpreis` | 0.0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.PreiseHistorie

<a name="dboPreiseHistorie"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `PreiseHistorieAktionCode` | int | - | ✅ | - |
| `ParentCode` | int | - | ✅ | - |
| `DetailCode` | int | - | ✅ | - |
| `WährungCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `AlterPreis` | float | - | ✅ | - |
| `NeuerPreis` | float | - | ✅ | - |
| `Prozent` | float | - | ✅ | - |
| `DatumAb` | datetime | - | ✅ | - |
| `Zielfeld` | varchar | 50 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `PreisgruppenCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `ArtArtikelÄnderung` | int | - | ✅ | - |
| `TypFeldÄnderung` | int | - | ✅ | - |
| `StaffelpreiseCode` | int | - | ✅ | - |
| `VKPreiseCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.PreiseHistorieAktion

<a name="dboPreiseHistorieAktion"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Aktion` | varchar | 200 | ✅ | - |
| `DatumAktion` | datetime | - | ✅ | - |
| `Art` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `RücksetzungCode` | int | - | ✅ | - |
| `Abgeschlossen` | int | - | ✅ | - |
| `AbgeschlossenDatum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Preisgruppen

<a name="dboPreisgruppen"></a>

**Anzahl Datensätze:** 4

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 200 | ✅ | ('') |
| `WaehrungCode` | int | - | ✅ | ((0)) |
| `Bruttopreis` | int | - | ✅ | ((0)) |
| `Index` | int | - | ✅ | ((0)) |
| `KostenstellenCode` | int | - | ✅ | - |
| `Standard` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 0 |
| `Name` | Neukunde |
| `WaehrungCode` | 1 |
| `Bruttopreis` | 0 |
| `Index` | 1 |
| `KostenstellenCode` | 0 |
| `Standard` | NULL |

---

## dbo.PreisgruppenKalkulation

<a name="dboPreisgruppenKalkulation"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `PreisgruppenIndex` | int | - | ✅ | - |
| `BinaryFile` | image | 2147483647 | ✅ | - |
| `BerechneterWertZeile` | int | - | ✅ | - |
| `BerechneterWertSpalte` | int | - | ✅ | - |
| `ZielPositionsspalte` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.PreisgruppenKalkulationZuordnung

<a name="dboPreisgruppenKalkulationZuordnung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `PreisgruppenKalkulationsCode` | int | - | ✅ | - |
| `ExcelZielZeile` | int | - | ✅ | - |
| `ExcelZielSpalte` | int | - | ✅ | - |
| `Objekt` | nvarchar | 50 | ✅ | - |
| `Eigenschaft` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Preisstaffel

<a name="dboPreisstaffel"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 50 | ✅ | - |
| `Kalkulatorisch` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 877649326 |
| `Name` | Test |
| `Kalkulatorisch` | 0 |

---

## dbo.Preisstaffeldefinition

<a name="dboPreisstaffeldefinition"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 50 | ✅ | - |
| `PreisstaffelCode` | int | - | ✅ | ((0)) |
| `Grenzwert1` | float | - | ✅ | ((0)) |
| `Grenzwert2` | float | - | ✅ | ((0)) |
| `Index` | int | - | ✅ | ((0)) |
| `Zuschlag` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1265864947 |
| `Name` | 1-50 |
| `PreisstaffelCode` | 877649326 |
| `Grenzwert1` | 0.0 |
| `Grenzwert2` | 50.0 |
| `Index` | 0 |
| `Zuschlag` | 0 |

---

## dbo.PreisstaffelEinstände

<a name="dboPreisstaffelEinstände"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((0)) |
| `ArtikelCode` | int | - | ✅ | - |
| `PreisstaffelCode` | int | - | ✅ | - |
| `Einstand` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Produktionsauftrag

<a name="dboProduktionsauftrag"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Nummer` | int | - | ✅ | - |
| `Status` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `AngelegtdurchBenutzerCode` | int | - | ✅ | - |
| `BearbeiterBenutzerCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `AnsprechpartnerCode` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `Erstelltdatum` | datetime | - | ✅ | - |
| `Produktionsdatum` | datetime | - | ✅ | - |
| `Fertigstellungsdatum` | datetime | - | ✅ | - |
| `KostenstellenCode` | int | - | ✅ | - |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `Name` | nvarchar | 70 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Freigabe` | nvarchar | 250 | ✅ | - |
| `FreigabePrüfauftragCode` | int | - | ✅ | - |
| `AbgeschlossenDurchBenutzerCode` | int | - | ✅ | - |
| `PrioritätLookupCode` | int | - | ✅ | - |
| `Sollmenge` | int | - | ✅ | - |
| `Istmenge` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `PositionenCode` | int | - | ✅ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProduktionsauftragGr

<a name="dboProduktionsauftragGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrName` | nvarchar | 70 | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrIndex` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProduktionsauftragMark

<a name="dboProduktionsauftragMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BenutzerCode` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProduktionsauftragsPositionen

<a name="dboProduktionsauftragsPositionen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `ProduktionsauftragCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `WareneingangCode` | int | - | ✅ | - |
| `SollStückzahl` | int | - | ✅ | - |
| `IstStückzahl` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Produktionsprotokoll

<a name="dboProduktionsprotokoll"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 250 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `AngelegtDurchBenutzerCode` | int | - | ✅ | - |
| `BearbeiterBenutzerCode` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `AnsprechpartnerCode` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `Erstelltdatum` | datetime | - | ✅ | - |
| `Produktionsdatum` | datetime | - | ✅ | - |
| `Fertigstellungsdatum` | datetime | - | ✅ | - |
| `Freigabe` | nvarchar | 250 | ✅ | - |
| `FreigabePrüfauftragCode` | int | - | ✅ | - |
| `AbgeschlossenDurchBenutzerCode` | int | - | ✅ | - |
| `Dateiname` | nvarchar | 250 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `ProduktionsauftragCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjectAccessGroup

<a name="dboProjectAccessGroup"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 255 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjectAccessGroupProject

<a name="dboProjectAccessGroupProject"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `GroupCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `ProjectCode` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjectAccessGroupUser

<a name="dboProjectAccessGroupUser"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `GroupCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjectAccessRights

<a name="dboProjectAccessRights"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `CreateByUserCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `ProjectCode` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjectDirectories

<a name="dboProjectDirectories"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `LocalPathRoot` | nvarchar | 500 | ✅ | - |
| `RemoteUrl` | nvarchar | 500 | ✅ | - |
| `Type` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Projektbewertung

<a name="dboProjektbewertung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `Bewertung` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Projekte

<a name="dboProjekte"></a>

**Anzahl Datensätze:** 2,475

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 100 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `Leiter` | nvarchar | 50 | ✅ | - |
| `Etat` | float | - | ✅ | ((0)) |
| `KundenCode` | int | - | ✅ | - |
| `KundenAPCode` | int | - | ✅ | ((0)) |
| `LieferantenCode` | int | - | ✅ | ((0)) |
| `LieferantenAPCode` | int | - | ✅ | ((0)) |
| `ErstellerCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | - |
| `Nummer` | nvarchar | 30 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Listflag` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Kostenst` | int | - | ✅ | ((0)) |
| `Gesperrt` | int | - | ✅ | ((0)) |
| `Dokumentverzeichnis` | nvarchar | 500 | ✅ | - |
| `BisDatum` | datetime | - | ✅ | - |
| `Prognose` | int | - | ✅ | ((0)) |
| `Bewertung` | int | - | ✅ | ((0)) |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `ProjektStatus` | int | - | ✅ | ((0)) |
| `SperrungFremdleistung` | int | - | ✅ | - |
| `Art` | int | - | ✅ | ((0)) |
| `Gemeinkosten` | int | - | ✅ | - |
| `Kategorie1Code` | int | - | ✅ | ((0)) |
| `Kategorie2Code` | int | - | ✅ | ((0)) |
| `Kategorie3Code` | int | - | ✅ | ((0)) |
| `Priorität` | int | - | ✅ | ((0)) |
| `Lösung` | ntext | 1073741823 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `ParentProjektCode` | int | - | ✅ | ((0)) |
| `FarbenCode` | int | - | ✅ | ((0)) |
| `AnfangDatum` | datetime | - | ✅ | - |
| `EndeDatum` | datetime | - | ✅ | - |
| `Kostenträger` | nvarchar | 50 | ✅ | - |
| `KampagnenCode` | int | - | ✅ | - |
| `tmpNummerKostenst` | int | - | ✅ | - |
| `Preisgruppe` | int | - | ✅ | - |
| `MiteID` | nvarchar | 100 | ✅ | - |
| `ProjektLink0` | nvarchar | 512 | ✅ | - |
| `ProjektLink1` | nvarchar | 512 | ✅ | - |
| `ProjektLink2` | nvarchar | 512 | ✅ | - |
| `VerzeichnisTemplateTitelCode` | int | - | ✅ | - |
| `NebenadresseCode` | int | - | ✅ | - |
| `NebenadresseType` | int | - | ✅ | - |
| `NebenadresseAPCode` | int | - | ✅ | - |
| `Nebenadresse2Code` | int | - | ✅ | ((0)) |
| `Nebenadresse2Type` | int | - | ✅ | ((0)) |
| `Nebenadresse2APCode` | int | - | ✅ | - |
| `LastModificationDate` | datetime | - | ✅ | - |
| `WebTicketText` | ntext | 1073741823 | ✅ | ('') |
| `Tendenz` | int | - | ✅ | ((0)) |
| `ShopFormularDaten` | nvarchar | -1 | ✅ | ('') |
| `TicketID` | uniqueidentifier | - | ✅ | - |
| `Helpdesk` | int | - | ✅ | - |
| `Reservierung` | int | - | ✅ | - |
| `Zusatznotiz` | nvarchar | 50 | ✅ | - |
| `Abschlussdatum` | datetime | - | ✅ | - |
| `AbschlussBenutzerCode` | int | - | ✅ | - |
| `Nebenadresse3Code` | int | - | ✅ | - |
| `Nebenadresse3Type` | int | - | ✅ | - |
| `Nebenadresse3APCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `ERechnung_Auftragsnummer_BT14` | nvarchar | 500 | ✅ | - |
| `ERechnung_Bestellnummer_BT13` | nvarchar | 500 | ✅ | - |
| `ERechnung_Empfangsbestätigung_BT15` | nvarchar | 500 | ✅ | - |
| `ERechnung_Objekt_BT18` | nvarchar | 500 | ✅ | - |
| `ERechnung_Projektreferenz_BT11` | nvarchar | 500 | ✅ | - |
| `ERechnung_ReverseCharge` | int | - | ✅ | - |
| `ERechnung_Tender_BT17` | nvarchar | 500 | ✅ | - |
| `ERechnung_Versandanzeige_BT16` | nvarchar | 500 | ✅ | - |
| `ERechnung_Vertragsnummer_BT12` | nvarchar | 500 | ✅ | - |
| `TrafficLightStatus` | int | - | ✅ | - |
| `Feld1` | varchar | 1000 | ✅ | - |
| `BeneticsId` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 68726897 |
| `Name` | Marienstraße 41, 92224 Amberg |
| `GrCode` | 20212204 |
| `Leiter` |  |
| `Etat` | 0.0 |
| `KundenCode` | 271943659 |
| `KundenAPCode` | 0 |
| `LieferantenCode` | 0 |
| `LieferantenAPCode` | 0 |
| `ErstellerCode` | 581413548 |
| `BenutzerCode` | 581413548 |
| `Nummer` | P220505 |
| `Datum` | 2022-09-30 00:00:00 |
| `Listflag` | 0 |
| `Notiz` | HT | REP |
| `Kostenst` | 0 |
| `Gesperrt` | 1 |
| `Dokumentverzeichnis` | NULL |
| `BisDatum` | 2022-10-25 00:00:00 |
| `Prognose` | 0 |
| `Bewertung` | 0 |
| `LetzteÄnderung` | 2022-10-25 13:40:27.240000 |
| `ProjektStatus` | 45481727 |
| `SperrungFremdleistung` | 0 |
| `Art` | 15174218 |
| `Gemeinkosten` | NULL |
| `Kategorie1Code` | 0 |
| `Kategorie2Code` | 0 |
| `Kategorie3Code` | 0 |
| `Priorität` | 0 |
| `Lösung` | NULL |
| `ArtikelCode` | NULL |
| `ParentProjektCode` | 0 |
| `FarbenCode` | 0 |
| `AnfangDatum` | 2022-10-11 00:00:00 |
| `EndeDatum` | 2022-10-11 00:00:00 |
| `Kostenträger` | NULL |
| `KampagnenCode` | NULL |
| `tmpNummerKostenst` | 0 |
| `Preisgruppe` | 0 |
| `MiteID` | NULL |
| `ProjektLink0` | https://www.google.de/maps/place/Marienstra%C3%9Fe+41,+92224+Amberg/@49.446715,11.8649282,17z/data=!... (total: 184 chars) |
| `ProjektLink1` | NULL |
| `ProjektLink2` | NULL |
| `VerzeichnisTemplateTitelCode` | 0 |
| `NebenadresseCode` | 0 |
| `NebenadresseType` | 0 |
| `NebenadresseAPCode` | 0 |
| `Nebenadresse2Code` | 0 |
| `Nebenadresse2Type` | 0 |
| `Nebenadresse2APCode` | 0 |
| `LastModificationDate` | NULL |
| `WebTicketText` |  |
| `Tendenz` | 0 |
| `ShopFormularDaten` |  |
| `TicketID` | 00000000-0000-0000-0000-000000000000 |
| `Helpdesk` | NULL |
| `Reservierung` | NULL |
| `Zusatznotiz` | NULL |
| `Abschlussdatum` | 2022-10-25 13:40:26.037000 |
| `AbschlussBenutzerCode` | 581413548 |
| `Nebenadresse3Code` | 0 |
| `Nebenadresse3Type` | 0 |
| `Nebenadresse3APCode` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `ERechnung_Auftragsnummer_BT14` | NULL |
| `ERechnung_Bestellnummer_BT13` | NULL |
| `ERechnung_Empfangsbestätigung_BT15` | NULL |
| `ERechnung_Objekt_BT18` | NULL |
| `ERechnung_Projektreferenz_BT11` | NULL |
| `ERechnung_ReverseCharge` | NULL |
| `ERechnung_Tender_BT17` | NULL |
| `ERechnung_Versandanzeige_BT16` | NULL |
| `ERechnung_Vertragsnummer_BT12` | NULL |
| `TrafficLightStatus` | NULL |
| `Feld1` | NULL |
| `BeneticsId` | NULL |

---

## dbo.ProjekteErgebnisMark

<a name="dboProjekteErgebnisMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjektCode` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `AnsprpCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjekteGr

<a name="dboProjekteGr"></a>

**Anzahl Datensätze:** 25

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 40 | ✅ | - |
| `GrPfad` | nvarchar | 500 | ✅ | - |
| `Kostenst` | int | - | ✅ | - |
| `VerzeichnisTemplateTitelCode` | nvarchar | 300 | ✅ | - |
| `ProjektnummerLogik` | nvarchar | 50 | ✅ | - |
| `Info` | nvarchar | 1000 | ✅ | - |
| `LookupCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `GrCode` | 2002513207 |
| `GrIndex` | 0 |
| `GrLevel` | 1 |
| `GrName` | Kunden Projekte |
| `GrPfad` |  |
| `Kostenst` | 0 |
| `VerzeichnisTemplateTitelCode` | 0 |
| `ProjektnummerLogik` |  |
| `Info` | NULL |
| `LookupCode` | 0 |

---

## dbo.ProjekteGrMark

<a name="dboProjekteGrMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjekteKostenplan

<a name="dboProjekteKostenplan"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Summe` | float | - | ✅ | ((0)) |
| `Mwstsumme` | float | - | ✅ | - |
| `Nettosumme` | float | - | ✅ | - |
| `Bemerkung` | ntext | 1073741823 | ✅ | - |
| `BestellungCode` | int | - | ✅ | ((0)) |
| `RECode` | int | - | ✅ | ((0)) |
| `Status` | int | - | ✅ | ((0)) |
| `SachKNummer` | int | - | ✅ | ((0)) |
| `Verrechnet` | int | - | ✅ | - |
| `Mwst` | float | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `PlanKostenstNummer` | int | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjekteKSchema

<a name="dboProjekteKSchema"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `GrCode` | int | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Fremdleistung` | int | - | ✅ | - |
| `Anzahl` | float | - | ✅ | ((0)) |
| `EKPreis` | float | - | ✅ | ((0)) |
| `VKPreis` | float | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Bemerkung` | ntext | 1073741823 | ✅ | - |
| `Rabatt` | float | - | ✅ | ((0)) |
| `Zuschlag` | int | - | ✅ | ((0)) |
| `Stufe` | int | - | ✅ | ((0)) |
| `ProjekteKSchemaNamenCode` | int | - | ✅ | ((0)) |
| `MitarbeiterCode` | int | - | ✅ | ((0)) |
| `ProjektVorgangCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjekteKSchemaNamen

<a name="dboProjekteKSchemaNamen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 50 | ✅ | - |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `Planungswirksam` | int | - | ✅ | - |
| `Gesperrt` | int | - | ✅ | - |
| `StandardSchema` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjekteMark

<a name="dboProjekteMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BenutzerCode` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjektePlanung

<a name="dboProjektePlanung"></a>

**Anzahl Datensätze:** 45

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjectCode` | int | - | ✅ | - |
| `Vorgang` | nvarchar | 50 | ✅ | - |
| `Dauer` | int | - | ✅ | ((0)) |
| `Anfang` | datetime | - | ✅ | - |
| `Ende` | datetime | - | ✅ | - |
| `Ressource` | nvarchar | 50 | ✅ | - |
| `Bewertung` | int | - | ✅ | ((0)) |
| `Nummer` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | 4000 | ✅ | - |
| `VorgangIndex` | int | - | ✅ | - |
| `ParentCode` | int | - | ✅ | - |
| `Art` | int | - | ✅ | - |
| `Angelegt` | datetime | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `Kostenst` | int | - | ✅ | - |
| `MM` | float | - | ✅ | - |
| `MT` | float | - | ✅ | - |
| `SummeErlöse` | float | - | ✅ | - |
| `Monat` | int | - | ✅ | - |
| `Jahr` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `PlanKosten` | float | - | ✅ | - |
| `PlanungsAnzahl` | float | - | ✅ | - |
| `GesprächspunkteCode` | int | - | ✅ | - |
| `PlanEinzKosten` | float | - | ✅ | - |
| `PlanGesKosten` | float | - | ✅ | - |
| `KalkulationPositionCode` | int | - | ✅ | - |
| `VorgangUeberbuchen` | int | - | ✅ | - |
| `Abgeschlossen` | int | - | ✅ | - |
| `PositionenCode` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `LieferantenCode` | int | - | ✅ | - |
| `LieferantenAPCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 182213229 |
| `ProjectCode` | 70055514 |
| `Vorgang` | Sühac: Wohnraumtüren ... |
| `Dauer` | 0 |
| `Anfang` | NULL |
| `Ende` | NULL |
| `Ressource` | NULL |
| `Bewertung` | 0 |
| `Nummer` | 0 |
| `BCode` | 581413548 |
| `Bemerkung` |  |
| `VorgangIndex` | 1 |
| `ParentCode` | 0 |
| `Art` | 2 |
| `Angelegt` | 2022-02-03 14:28:38.977000 |
| `ArtikelCode` | 0 |
| `Kostenst` | 0 |
| `MM` | NULL |
| `MT` | NULL |
| `SummeErlöse` | 0.0 |
| `Monat` | 0 |
| `Jahr` | 0 |
| `LookupCode` | 0 |
| `PlanKosten` | 0.0 |
| `PlanungsAnzahl` | 0.0 |
| `GesprächspunkteCode` | 0 |
| `PlanEinzKosten` | NULL |
| `PlanGesKosten` | NULL |
| `KalkulationPositionCode` | 0 |
| `VorgangUeberbuchen` | 0 |
| `Abgeschlossen` | 0 |
| `PositionenCode` | 504923781 |
| `SDObjMemberCode` | 0 |
| `SDObjType` | 0 |
| `LieferantenCode` | 0 |
| `LieferantenAPCode` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.ProjektePlanungLinks

<a name="dboProjektePlanungLinks"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `VorgangCode1` | int | - | ✅ | - |
| `VorgangCode2` | int | - | ✅ | - |
| `LinkType` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjektePlanungMitarbeiter

<a name="dboProjektePlanungMitarbeiter"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjektCode` | int | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | 4000 | ✅ | - |
| `ErstelltBCode` | int | - | ✅ | - |
| `ErstelltDatum` | datetime | - | ✅ | - |
| `LetzteÄnderungBCode` | int | - | ✅ | - |
| `LetzteÄnderungDatum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjektePlanungMitarbeiterDetail

<a name="dboProjektePlanungMitarbeiterDetail"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjektePlanungMitarbeiterCode` | int | - | ✅ | - |
| `DatumVon` | datetime | - | ✅ | - |
| `DatumBis` | datetime | - | ✅ | - |
| `Monat` | int | - | ✅ | - |
| `Jahr` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Planungswert` | float | - | ✅ | - |
| `Bemerkung` | nvarchar | 4000 | ✅ | - |
| `ErstelltBCode` | int | - | ✅ | - |
| `ErstelltDatum` | datetime | - | ✅ | - |
| `LetzteÄnderungBCode` | int | - | ✅ | - |
| `LetzteÄnderungDatum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjektePlanungRückmeldung

<a name="dboProjektePlanungRückmeldung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `VorgangCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `AbarbeitungsgradProzent` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjektePlanungVorlagen

<a name="dboProjektePlanungVorlagen"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Bezeichnung` | nvarchar | 70 | ✅ | ('') |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 2143998 |
| `Bezeichnung` | Projektplanung |

---

## dbo.ProjektePlanungVorlagenVorgänge

<a name="dboProjektePlanungVorlagenVorgänge"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `VorlagenCode` | int | - | ✅ | ((0)) |
| `Nummer` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 70 | ✅ | ('') |
| `DauerTage` | int | - | ✅ | ((0)) |
| `BezugEnum` | int | - | ✅ | ((0)) |
| `BezugWertTage` | int | - | ✅ | ((0)) |
| `VerantwortlichBCode` | int | - | ✅ | ((0)) |
| `RessourcenklasseLookupCode` | int | - | ✅ | ((0)) |
| `Notiz` | nvarchar | -1 | ✅ | ('') |
| `ProjektStepArt` | int | - | ✅ | ((0)) |
| `DauerTageDecimal` | decimal | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 73042946 |
| `VorlagenCode` | 2143998 |
| `Nummer` | 0 |
| `Bezeichnung` | Neuer Vorgang |
| `DauerTage` | 0 |
| `BezugEnum` | 1 |
| `BezugWertTage` | 5 |
| `VerantwortlichBCode` | 22209630 |
| `RessourcenklasseLookupCode` | 595726194 |
| `Notiz` | NULL |
| `ProjektStepArt` | 0 |
| `DauerTageDecimal` | 0E-8 |

---

## dbo.ProjekteVerknüpfung

<a name="dboProjekteVerknüpfung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjektCode` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `LinkedProjektCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjekteVerteiler

<a name="dboProjekteVerteiler"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BenutzerCode` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |
| `ObjType` | int | - | ✅ | ((0)) |
| `AnsprechpCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `VerteilerCode` | int | - | ✅ | ((0)) |
| `Schlüssel` | int | - | ✅ | ((0)) |
| `Notiz` | nvarchar | 50 | ✅ | - |
| `Nummer` | nvarchar | 50 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `_ProvisionProzent` | float | - | ✅ | - |
| `MM` | float | - | ✅ | - |
| `MT` | float | - | ✅ | - |
| `Jahr` | int | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 14271363 |
| `BenutzerCode` | 888797748 |
| `ObjCode` | 1845661551 |
| `ObjType` | 1 |
| `AnsprechpCode` | 2123463 |
| `ProjektCode` | 233144216 |
| `VerteilerCode` | 100205248 |
| `Schlüssel` | 0 |
| `Notiz` | NULL |
| `Nummer` | NULL |
| `Datum` | 2022-04-07 10:39:55.470000 |
| `LookupCode` | NULL |
| `_ProvisionProzent` | NULL |
| `MM` | 0.0 |
| `MT` | 0.0 |
| `Jahr` | 0 |
| `ProjektePlanungCode` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.ProjekteVerteilernamen

<a name="dboProjekteVerteilernamen"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `VerteilerName` | nvarchar | 50 | ✅ | - |
| `Kunden` | int | - | ✅ | - |
| `Lieferanten` | int | - | ✅ | - |
| `Benutzer` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 100205248 |
| `ProjektCode` | 233144216 |
| `VerteilerName` | Mieter |
| `Kunden` | NULL |
| `Lieferanten` | NULL |
| `Benutzer` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.ProjekteZahlung

<a name="dboProjekteZahlung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Summe` | int | - | ✅ | ((0)) |
| `Bemerkung` | ntext | 1073741823 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Projektkostensätze

<a name="dboProjektkostensätze"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ErstelltBCode` | int | - | ✅ | - |
| `ErstellDatum` | datetime | - | ✅ | - |
| `LetzteÄnderungBCode` | int | - | ✅ | - |
| `LetzteÄnderungDatum` | datetime | - | ✅ | - |
| `KostensatzpaketCode` | int | - | ✅ | - |
| `KostenStCode` | int | - | ✅ | - |
| `RessourcenKlassenCode` | int | - | ✅ | - |
| `Kostensatz` | float | - | ✅ | - |
| `Bemerkung` | nvarchar | 4000 | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProjektMaterial

<a name="dboProjektMaterial"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Name` | nvarchar | 500 | ✅ | - |
| `ErfasserCode` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ProvisionsBerechnung

<a name="dboProvisionsBerechnung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `BZObjType` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `PosCode` | int | - | ✅ | - |
| `ProvisionProzent` | float | - | ✅ | - |
| `ProvisionWert` | float | - | ✅ | - |
| `WaehrungsCode` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | 4000 | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjMemberType` | int | - | ✅ | - |
| `ManualChanged` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Provisionssätze

<a name="dboProvisionssätze"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `LieferantenProvisionsgruppenCode` | int | - | ✅ | - |
| `KundenProvisionsgruppenCode` | int | - | ✅ | - |
| `ArtikelProvisionsgruppenCode` | int | - | ✅ | - |
| `ProvisionsartCode` | int | - | ✅ | - |
| `ProvisionProzent` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Prüfauftrag

<a name="dboPrüfauftrag"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Erstelltdatum` | datetime | - | ✅ | - |
| `Prüfdatum` | datetime | - | ✅ | - |
| `Abschlussdatum` | datetime | - | ✅ | - |
| `AnsprechpartnerCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Charge` | nvarchar | 250 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `AngelegtBenutzerCode` | int | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `KostenStCode` | int | - | ✅ | - |
| `Name` | nvarchar | 70 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `InventarCode` | int | - | ✅ | - |
| `Status` | int | - | ✅ | - |
| `KostenstellenCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.PrüfauftragGr

<a name="dboPrüfauftragGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrName` | nvarchar | 70 | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrIndex` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Prüfschritt

<a name="dboPrüfschritt"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ArtikelCode` | int | - | ✅ | - |
| `Ergebnis` | int | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `PrüfauftragCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Prüfvorgang

<a name="dboPrüfvorgang"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BenutzerCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `PrüfauftragCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.QMDokumente

<a name="dboQMDokumente"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Filename` | nvarchar | 500 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Revisionsnummer` | nvarchar | 50 | ✅ | - |
| `LookupCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | - |
| `Erstelltdatum` | datetime | - | ✅ | - |
| `Prüfdatum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Name` | nvarchar | 70 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `InventarCode` | int | - | ✅ | - |
| `AngelegtBenutzerCode` | int | - | ✅ | - |
| `Status` | int | - | ✅ | - |
| `AbteilungCode` | int | - | ✅ | - |
| `AktuelleRevisionCode` | int | - | ✅ | - |
| `Revisionsdatum` | datetime | - | ✅ | - |
| `Dokumentnummer` | nvarchar | 50 | ✅ | - |
| `GültigBisDatum` | datetime | - | ✅ | - |
| `FreigabeBenutzerCode` | int | - | ✅ | - |
| `ObjektschutzCode` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | -1 | ✅ | ('') |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.QMDokumenteGr

<a name="dboQMDokumenteGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrName` | nvarchar | 70 | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrIndex` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.QMProtokolle

<a name="dboQMProtokolle"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Filename` | nvarchar | 500 | ✅ | - |
| `Bezeichnung` | nvarchar | 200 | ✅ | - |
| `Nummer` | int | - | ✅ | ((0)) |
| `Datei` | image | 2147483647 | ✅ | - |
| `Dateityp` | nvarchar | 20 | ✅ | - |
| `LookupCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | - |
| `PrüfvorgangCode` | int | - | ✅ | - |
| `PrüfauftragCode` | int | - | ✅ | - |
| `GrCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.QMProtokolleGr

<a name="dboQMProtokolleGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrName` | nvarchar | 70 | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrIndex` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.RA

<a name="dboRA"></a>

**Anzahl Datensätze:** 2,968

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RNummer` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `FälligDatum` | datetime | - | ✅ | - |
| `RBetrag` | float | - | ✅ | ((0)) |
| `RMwst` | float | - | ✅ | ((0)) |
| `BezSumme` | float | - | ✅ | ((0)) |
| `StornSumme` | float | - | ✅ | ((0)) |
| `Mahnstuffe` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Skonto` | float | - | ✅ | ((0)) |
| `Kostenst` | int | - | ✅ | ((0)) |
| `Frist` | datetime | - | ✅ | - |
| `ListFlag` | int | - | ✅ | ((0)) |
| `DTANr` | real | - | ✅ | ((0)) |
| `RCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `RASachkGesamt` | float | - | ✅ | ((0)) |
| `RAKostenstGesamt` | float | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `Kurs` | float | - | ✅ | ((0)) |
| `WaehrungCode` | int | - | ✅ | ((0)) |
| `RMwstNeu` | float | - | ✅ | - |
| `WaehrungDatum` | datetime | - | ✅ | - |
| `Provision` | float | - | ✅ | ((0)) |
| `tmpSkonto` | float | - | ✅ | ((0)) |
| `BuchungsDatum` | datetime | - | ✅ | - |
| `tmpLastschrift` | int | - | ✅ | - |
| `LastschriftOK` | int | - | ✅ | - |
| `Summe` | float | - | ✅ | ((0)) |
| `ZahlungCode` | int | - | ✅ | ((0)) |
| `BankkontoCode` | int | - | ✅ | - |
| `Varial` | int | - | ✅ | ((0)) |
| `Buchhaltungssperre` | int | - | ✅ | ((0)) |
| `DMSId` | nvarchar | -1 | ✅ | ('') |
| `MahnungEMailLetztesDatum` | datetime | - | ✅ | - |
| `MahnungEMailAnzahl` | tinyint | - | ✅ | - |
| `FälligDatumVerlängerung` | datetime | - | ✅ | - |
| `OPNotiz` | nvarchar | -1 | ✅ | - |
| `ZahlungslaufFreischalten` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 52775659 |
| `RNummer` | 220245 |
| `Datum` | 2022-05-18 00:00:00 |
| `SDObjMemberCode` | 409597931 |
| `FälligDatum` | 2022-06-01 00:00:00 |
| `RBetrag` | 581.48 |
| `RMwst` | 110.48 |
| `BezSumme` | 691.96 |
| `StornSumme` | 0.0 |
| `Mahnstuffe` | 0 |
| `Notiz` | IT |
| `Skonto` | 0.0 |
| `Kostenst` | 0 |
| `Frist` | NULL |
| `ListFlag` | 0 |
| `DTANr` | 0.0 |
| `RCode` | 46132572 |
| `BenutzerCode` | 888797748 |
| `RASachkGesamt` | 0.0 |
| `RAKostenstGesamt` | 0.0 |
| `Datev` | NULL |
| `Kurs` | 1.0 |
| `WaehrungCode` | 1 |
| `RMwstNeu` | 0.0 |
| `WaehrungDatum` | 2001-10-24 00:00:00 |
| `Provision` | 0.0 |
| `tmpSkonto` | 0.0 |
| `BuchungsDatum` | 2022-05-18 00:00:00 |
| `tmpLastschrift` | 0 |
| `LastschriftOK` | 0 |
| `Summe` | 0.0 |
| `ZahlungCode` | 0 |
| `BankkontoCode` | 0 |
| `Varial` | 0 |
| `Buchhaltungssperre` | 0 |
| `DMSId` | NULL |
| `MahnungEMailLetztesDatum` | NULL |
| `MahnungEMailAnzahl` | 0 |
| `FälligDatumVerlängerung` | NULL |
| `OPNotiz` | NULL |
| `ZahlungslaufFreischalten` | NULL |

---

## dbo.Rabattdefinitionen

<a name="dboRabattdefinitionen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 30 | ✅ | - |
| `Bezeichnung` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Rabattgr

<a name="dboRabattgr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `RabattgrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RabattgrName` | nvarchar | 30 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Rabattwerte

<a name="dboRabattwerte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RabattdefinitionenCode` | int | - | ✅ | ((0)) |
| `RabattWert` | float | - | ✅ | ((0)) |
| `RabattProzent` | float | - | ✅ | ((0)) |
| `RabattMenge` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.RabattZuordnung

<a name="dboRabattZuordnung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KundenCode` | int | - | ✅ | ((0)) |
| `RabattgrCode` | int | - | ✅ | ((0)) |
| `RabattdefinitionenCode` | int | - | ✅ | ((0)) |
| `Basisrabatt` | float | - | ✅ | ((0)) |
| `Basisrabatt2` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.RABezSumme

<a name="dboRABezSumme"></a>

**Anzahl Datensätze:** 3,419

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RACode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Konto` | nvarchar | 30 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Summe` | float | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `SachkNummer` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SachkCode` | int | - | ✅ | - |
| `BuchungsDatum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 157230217 |
| `RACode` | 671648889 |
| `Datum` | 2021-12-10 00:00:00 |
| `Konto` |  |
| `Notiz` |  |
| `Summe` | 536.45 |
| `Datev` | NULL |
| `SachkNummer` | 1200 |
| `BenutzerCode` | 888797748 |
| `SachkCode` | 0 |
| `BuchungsDatum` | 2021-12-10 10:58:36.807000 |

---

## dbo.RAErlöskontenSplit

<a name="dboRAErlöskontenSplit"></a>

**Anzahl Datensätze:** 4,209

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RACode` | int | - | ✅ | ((0)) |
| `Mwst` | float | - | ✅ | ((15)) |
| `AnteilDM` | float | - | ✅ | ((0)) |
| `KostenstNummer` | int | - | ✅ | ((0)) |
| `AnteilProzent` | float | - | ✅ | - |
| `SachkNummer` | int | - | ✅ | ((0)) |
| `Berichtigungsschlüssel` | int | - | ✅ | ((0)) |
| `Steuerschlüssel` | int | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `SachkCode` | int | - | ✅ | - |
| `KostenstCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | 60 | ✅ | - |
| `MwstBetrag` | float | - | ✅ | - |
| `Netto` | float | - | ✅ | - |
| `KostenstNummer2` | int | - | ✅ | ((0)) |
| `Vorlauf` | datetime | - | ✅ | - |
| `Gegenkonto` | int | - | ✅ | ((0)) |
| `VollerMonatswert` | float | - | ✅ | - |
| `TatsaechlicherLiefertermin` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 244245172 |
| `RACode` | 2015058747 |
| `Mwst` | 19.0 |
| `AnteilDM` | 592.62 |
| `KostenstNummer` | 0 |
| `AnteilProzent` | 0.0 |
| `SachkNummer` | 3200 |
| `Berichtigungsschlüssel` | 0 |
| `Steuerschlüssel` | 9 |
| `Datev` | NULL |
| `SachkCode` | NULL |
| `KostenstCode` | 0 |
| `Notiz` |  |
| `MwstBetrag` | 0.0 |
| `Netto` | 498.0 |
| `KostenstNummer2` | 0 |
| `Vorlauf` | 2022-04-06 00:00:00 |
| `Gegenkonto` | 0 |
| `VollerMonatswert` | 0.0 |
| `TatsaechlicherLiefertermin` | 2022-04-06 00:00:00 |

---

## dbo.RAMwst

<a name="dboRAMwst"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RACode` | int | - | ✅ | - |
| `Mwst` | int | - | ✅ | - |
| `Betrag` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.RAStornSumme

<a name="dboRAStornSumme"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RACode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Summe` | float | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `SachkNummer` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.RE

<a name="dboRE"></a>

**Anzahl Datensätze:** 5,650

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RNummer` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `EingangsDatum` | datetime | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `RNummerbeiLieferant` | nvarchar | 20 | ✅ | - |
| `FälligDatum` | datetime | - | ✅ | - |
| `RBetrag` | float | - | ✅ | ((0)) |
| `RMwst` | float | - | ✅ | ((0)) |
| `BezSumme` | float | - | ✅ | ((0)) |
| `StornSumme` | float | - | ✅ | ((0)) |
| `Mahnstuffe` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `DTANr` | real | - | ✅ | - |
| `Skonto` | float | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `RESachkGesamt` | float | - | ✅ | ((0)) |
| `REKostenstGesamt` | float | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `tmpSkonto` | float | - | ✅ | ((0)) |
| `OLE` | image | 2147483647 | ✅ | - |
| `WährungCode` | int | - | ✅ | ((0)) |
| `RBetragFremd` | float | - | ✅ | ((0)) |
| `Kurs` | float | - | ✅ | ((0)) |
| `Berechnen` | int | - | ✅ | ((0)) |
| `Summe` | float | - | ✅ | ((0)) |
| `BuchungsDatum` | datetime | - | ✅ | - |
| `Vorerfasst` | int | - | ✅ | ((0)) |
| `zurück` | int | - | ✅ | ((0)) |
| `BankkontoCode` | int | - | ✅ | ((0)) |
| `Verwendungszweck` | nvarchar | 200 | ✅ | - |
| `EingangslieferscheinCode` | int | - | ✅ | ((0)) |
| `SkontoDatum` | datetime | - | ✅ | - |
| `SkontoTg` | int | - | ✅ | ((0)) |
| `Skonto2` | float | - | ✅ | ((0)) |
| `Skonto2Datum` | datetime | - | ✅ | - |
| `Skonto2Tg` | int | - | ✅ | ((0)) |
| `SkontoProzent` | float | - | ✅ | ((0)) |
| `FreigabeBCode` | int | - | ✅ | ((0)) |
| `FreigabeDatum` | datetime | - | ✅ | - |
| `Belegart` | int | - | ✅ | ((0)) |
| `FreigabeNotiz` | ntext | 1073741823 | ✅ | - |
| `SperrungBcode` | int | - | ✅ | ((0)) |
| `ScanFileName` | nvarchar | 500 | ✅ | - |
| `WhattodoCode` | int | - | ✅ | ((0)) |
| `VerrechnetCode` | int | - | ✅ | ((0)) |
| `Reisekostenabrechnung` | int | - | ✅ | - |
| `UrsprungRBetrag` | float | - | ✅ | ((0)) |
| `UrsprungMwst` | float | - | ✅ | ((0)) |
| `UrsprungBezSumme` | float | - | ✅ | ((0)) |
| `Kassenbeleg` | int | - | ✅ | - |
| `GenehmigungDurchBCode` | int | - | ✅ | ((0)) |
| `StatusCode` | int | - | ✅ | ((0)) |
| `Kassenbelegnummer` | int | - | ✅ | ((0)) |
| `Scandatei` | image | 2147483647 | ✅ | - |
| `RABezSummeCode` | int | - | ✅ | ((0)) |
| `Wiederkehrend` | int | - | ✅ | ((0)) |
| `SachKNummer` | int | - | ✅ | ((0)) |
| `ObjGrCode` | int | - | ✅ | - |
| `CreationDate` | datetime | - | ✅ | - |
| `EditBenutzerCode` | int | - | ✅ | - |
| `EditDate` | datetime | - | ✅ | - |
| `DMSDokumentenID` | nvarchar | 255 | ✅ | - |
| `BankverbindungCode` | int | - | ✅ | - |
| `Templatename` | nvarchar | 250 | ✅ | - |
| `Lieferdatum` | datetime | - | ✅ | - |
| `LieferdatumGeplant` | datetime | - | ✅ | - |
| `ZahlungsCode` | int | - | ✅ | - |
| `Frei1` | int | - | ✅ | - |
| `Positionstext` | nvarchar | 4000 | ✅ | ('') |
| `RBetragErstellt` | float | - | ✅ | - |
| `RMwstErstellt` | float | - | ✅ | - |
| `RNettoErstellt` | float | - | ✅ | - |
| `Referenz` | nvarchar | 200 | ✅ | ('') |
| `Kostenstelle` | int | - | ✅ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `Skonto2Betrag` | float | - | ✅ | - |
| `SkontoBetrag` | float | - | ✅ | - |
| `ZahlungslaufFreischalten` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 184238663 |
| `RNummer` | 220616 |
| `Datum` | 2022-08-11 00:00:00 |
| `EingangsDatum` | 2022-08-11 00:00:00 |
| `SDObjMemberCode` | 395149183 |
| `RNummerbeiLieferant` | 2798 |
| `FälligDatum` | 2022-08-21 00:00:00 |
| `RBetrag` | 250.0 |
| `RMwst` | 47.5 |
| `BezSumme` | 297.5 |
| `StornSumme` | 0.0 |
| `Mahnstuffe` | 0 |
| `Notiz` | Kran | Bäumler | 2798 |
| `DTANr` | 0.0 |
| `Skonto` | 0.0 |
| `ProjektCode` | 54104277 |
| `BenutzerCode` | 581413548 |
| `RESachkGesamt` | 0.0 |
| `REKostenstGesamt` | 0.0 |
| `Datev` | NULL |
| `tmpSkonto` | 0.0 |
| `OLE` | NULL |
| `WährungCode` | 1 |
| `RBetragFremd` | 297.5 |
| `Kurs` | 1.0 |
| `Berechnen` | 0 |
| `Summe` | 0.0 |
| `BuchungsDatum` | 2022-08-11 00:00:00 |
| `Vorerfasst` | 0 |
| `zurück` | 0 |
| `BankkontoCode` | 0 |
| `Verwendungszweck` | NULL |
| `EingangslieferscheinCode` | 0 |
| `SkontoDatum` | NULL |
| `SkontoTg` | 0 |
| `Skonto2` | 0.0 |
| `Skonto2Datum` | NULL |
| `Skonto2Tg` | 0 |
| `SkontoProzent` | 0.0 |
| `FreigabeBCode` | 22209630 |
| `FreigabeDatum` | 2022-08-17 00:00:00 |
| `Belegart` | 0 |
| `FreigabeNotiz` |  |
| `SperrungBcode` | 0 |
| `ScanFileName` |  |
| `WhattodoCode` | 0 |
| `VerrechnetCode` | 0 |
| `Reisekostenabrechnung` | NULL |
| `UrsprungRBetrag` | 0.0 |
| `UrsprungMwst` | 0.0 |
| `UrsprungBezSumme` | 0.0 |
| `Kassenbeleg` | NULL |
| `GenehmigungDurchBCode` | 888797748 |
| `StatusCode` | 0 |
| `Kassenbelegnummer` | 0 |
| `Scandatei` | NULL |
| `RABezSummeCode` | 0 |
| `Wiederkehrend` | 0 |
| `SachKNummer` | 0 |
| `ObjGrCode` | 0 |
| `CreationDate` | 2022-08-12 00:00:00 |
| `EditBenutzerCode` | 22209630 |
| `EditDate` | 2022-08-17 00:00:00 |
| `DMSDokumentenID` |  |
| `BankverbindungCode` | 33176595 |
| `Templatename` | NULL |
| `Lieferdatum` | NULL |
| `LieferdatumGeplant` | NULL |
| `ZahlungsCode` | 0 |
| `Frei1` | 0 |
| `Positionstext` | NULL |
| `RBetragErstellt` | 297.5 |
| `RMwstErstellt` | 47.5 |
| `RNettoErstellt` | 250.0 |
| `Referenz` | NULL |
| `Kostenstelle` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |
| `Skonto2Betrag` | NULL |
| `SkontoBetrag` | NULL |
| `ZahlungslaufFreischalten` | NULL |

---

## dbo.Reactions

<a name="dboReactions"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Emoji` | nvarchar | 100 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `ObjectPrimaryKey` | nvarchar | 50 | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.REBestellung

<a name="dboREBestellung"></a>

**Anzahl Datensätze:** 3,845

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BestellungCode` | int | - | ✅ | ((0)) |
| `RECode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1368341651 |
| `BestellungCode` | 737736929 |
| `RECode` | 577234920 |

---

## dbo.REBezSumme

<a name="dboREBezSumme"></a>

**Anzahl Datensätze:** 8,411

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RECode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Konto` | nvarchar | 30 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Summe` | float | - | ✅ | ((0)) |
| `SachkNummer` | int | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SachkCode` | int | - | ✅ | - |
| `BuchungsDatum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 333245169 |
| `RECode` | 26863705 |
| `Datum` | 2022-02-17 00:00:00 |
| `Konto` |  |
| `Notiz` | Automatisch ausgeziffert |
| `Summe` | 217.78 |
| `SachkNummer` | 0 |
| `Datev` | NULL |
| `BenutzerCode` | 888797748 |
| `SachkCode` | 0 |
| `BuchungsDatum` | 2022-02-17 10:06:35.453000 |

---

## dbo.Rechnung

<a name="dboRechnung"></a>

**Anzahl Datensätze:** 2,972

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Nummer` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Kostenst` | int | - | ✅ | ((0)) |
| `IhrZeichen` | nvarchar | 50 | ✅ | - |
| `UnserZeichen` | nvarchar | 50 | ✅ | - |
| `BestellDatum` | datetime | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `AbteilungCode` | int | - | ✅ | ((0)) |
| `NebenAdrCode1` | int | - | ✅ | ((0)) |
| `NebenAdrCode2` | int | - | ✅ | ((0)) |
| `NebenAdrCode3` | int | - | ✅ | ((0)) |
| `Kopftext` | ntext | 1073741823 | ✅ | - |
| `Schlußtext` | ntext | 1073741823 | ✅ | - |
| `Zahlbarbis` | datetime | - | ✅ | - |
| `Skontobis` | datetime | - | ✅ | - |
| `Skonto` | real | - | ✅ | ((0)) |
| `AutNummer` | int | - | ✅ | ((0)) |
| `RA` | int | - | ✅ | ((0)) |
| `WartungMiete` | int | - | ✅ | ((0)) |
| `NebenAdrText1` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText2` | ntext | 1073741823 | ✅ | - |
| `NebenAdrText3` | ntext | 1073741823 | ✅ | - |
| `NebenAdrType1` | int | - | ✅ | ((0)) |
| `NebenAdrType2` | int | - | ✅ | ((0)) |
| `NebenAdrType3` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAPCode3` | int | - | ✅ | ((0)) |
| `NebenAdrPostfach1` | int | - | ✅ | - |
| `NebenAdrPostfach2` | int | - | ✅ | - |
| `NebenAdrPostfach3` | int | - | ✅ | - |
| `NebenAdrAbteilungCode1` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode2` | int | - | ✅ | ((0)) |
| `NebenAdrAbteilungCode3` | int | - | ✅ | ((0)) |
| `Feld1` | nvarchar | 500 | ✅ | - |
| `Feld2` | nvarchar | 500 | ✅ | - |
| `Feld3` | nvarchar | 500 | ✅ | - |
| `Feld4` | nvarchar | 500 | ✅ | - |
| `Feld5` | nvarchar | 500 | ✅ | - |
| `Feld6` | nvarchar | 500 | ✅ | - |
| `Feld7` | nvarchar | 500 | ✅ | - |
| `Zahlungsfrist` | int | - | ✅ | ((0)) |
| `Skontofrist` | real | - | ✅ | - |
| `KarteiCode` | int | - | ✅ | - |
| `WAVerwaltung` | int | - | ✅ | ((0)) |
| `SachProfEinfrieren` | int | - | ✅ | ((0)) |
| `Status1` | int | - | ✅ | ((0)) |
| `Status2` | int | - | ✅ | ((0)) |
| `Status3` | int | - | ✅ | ((0)) |
| `Status4` | int | - | ✅ | ((0)) |
| `Status5` | int | - | ✅ | ((0)) |
| `Eingefroren` | int | - | ✅ | ((0)) |
| `WaehrungCode` | int | - | ✅ | - |
| `Kurs` | float | - | ✅ | ((1)) |
| `KursDatum` | datetime | - | ✅ | - |
| `AuftragsNummer` | int | - | ✅ | - |
| `AuftragsDatum` | datetime | - | ✅ | - |
| `ListFlag` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SN` | nvarchar | 50 | ✅ | - |
| `Brutto` | int | - | ✅ | ((0)) |
| `Preisgruppe` | int | - | ✅ | ((0)) |
| `ZahlungsCode` | int | - | ✅ | ((0)) |
| `Auftragsbeginn` | datetime | - | ✅ | - |
| `BuchungsDatum` | datetime | - | ✅ | - |
| `KW` | int | - | ✅ | - |
| `RTFKopftext` | ntext | 1073741823 | ✅ | - |
| `RTFSchlußtext` | ntext | 1073741823 | ✅ | - |
| `DB` | float | - | ✅ | ((0)) |
| `Wert` | float | - | ✅ | ((0)) |
| `SprachCode` | int | - | ✅ | ((0)) |
| `LänderCode` | int | - | ✅ | ((0)) |
| `Steuerschlüssel` | int | - | ✅ | ((0)) |
| `Lieferadressegeändert` | int | - | ✅ | - |
| `Postfach` | int | - | ✅ | - |
| `Anzahlung` | int | - | ✅ | - |
| `SchlussrechnungCode` | int | - | ✅ | ((0)) |
| `NichtSteuerbar` | int | - | ✅ | - |
| `ErsatzErlöskonto` | int | - | ✅ | ((0)) |
| `HauptAdresse` | ntext | 1073741823 | ✅ | - |
| `Datei` | nvarchar | 500 | ✅ | - |
| `BenutzerCode2` | int | - | ✅ | ((0)) |
| `LookupCode` | int | - | ✅ | ((0)) |
| `VerteilerCode` | int | - | ✅ | ((0)) |
| `ObjGrCode` | int | - | ✅ | - |
| `BankverbindungCode` | int | - | ✅ | - |
| `Art` | int | - | ✅ | - |
| `WartungsobjektCode` | int | - | ✅ | - |
| `LFCode` | int | - | ✅ | - |
| `LieferungsArtCode` | int | - | ✅ | - |
| `LieferungsArtZiel` | int | - | ✅ | - |
| `ProjektVorgangsCode` | int | - | ✅ | - |
| `Bezugsgroesse` | float | - | ✅ | - |
| `Leistungsort` | nvarchar | 100 | ✅ | - |
| `Skonto2` | float | - | ✅ | - |
| `Skontofrist2` | float | - | ✅ | - |
| `Skontobis2` | datetime | - | ✅ | - |
| `EditDate` | datetime | - | ✅ | - |
| `MobileBearbeitung` | int | - | ✅ | ((0)) |
| `OriginalRechnungCode` | int | - | ✅ | ((0)) |
| `APP_UnterschriebenVon` | nvarchar | 4000 | ✅ | ('') |
| `APP_EmailKopieAn` | nvarchar | 4000 | ✅ | ('') |
| `TourCode` | int | - | ✅ | ((0)) |
| `LieferterminAbgehend` | datetime | - | ✅ | - |
| `Mietdauer` | float | - | ✅ | - |
| `Mietfaktor` | float | - | ✅ | - |
| `NiederlassungsCode` | int | - | ✅ | ((0)) |
| `Leistungsbeginn` | datetime | - | ✅ | - |
| `Leistungsende` | datetime | - | ✅ | - |
| `CreatedByLoginId` | uniqueidentifier | - | ✅ | - |
| `WebShopOrderDefinitionData` | nvarchar | -1 | ✅ | ('') |
| `KasseZahlungsArt` | int | - | ✅ | - |
| `KasseBetragGegeben` | decimal | - | ✅ | - |
| `KasseBetragZurück` | decimal | - | ✅ | - |
| `Nebenadresse3Geändert` | int | - | ✅ | - |
| `Bruttowert` | decimal | - | ✅ | - |
| `KasseId` | nvarchar | 50 | ✅ | - |
| `CreationDate` | datetime | - | ✅ | - |
| `TseTransactionSignature` | nvarchar | -1 | ✅ | - |
| `TseTransactionNumber` | int | - | ✅ | - |
| `TseSerialNumber` | nvarchar | 200 | ✅ | - |
| `TseSignatureCount` | int | - | ✅ | - |
| `TseStart` | datetime | - | ✅ | - |
| `TseEnd` | datetime | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `HallenCode` | int | - | ✅ | - |
| `ERechnung_Auftragsnummer_BT14` | nvarchar | 500 | ✅ | - |
| `ERechnung_Bestellnummer_BT13` | nvarchar | 500 | ✅ | - |
| `ERechnung_Empfangsbestätigung_BT15` | nvarchar | 500 | ✅ | - |
| `ERechnung_Objekt_BT18` | nvarchar | 500 | ✅ | - |
| `ERechnung_Projektreferenz_BT11` | nvarchar | 500 | ✅ | - |
| `ERechnung_ReverseCharge` | int | - | ✅ | - |
| `ERechnung_Tender_BT17` | nvarchar | 500 | ✅ | - |
| `ERechnung_Versandanzeige_BT16` | nvarchar | 500 | ✅ | - |
| `ERechnung_Vertragsnummer_BT12` | nvarchar | 500 | ✅ | - |
| `ERechnung_Gutschrift_BT25` | nvarchar | 500 | ✅ | - |
| `ERechnung_Gutschrift_BT26` | datetime | - | ✅ | - |
| `ERechnungsart_BT3` | int | - | ✅ | - |
| `BankAccountCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 126150 |
| `Nummer` | 240282 |
| `SDObjMemberCode` | 1175127942 |
| `SDObjType` | 1 |
| `Datum` | 2024-04-30 00:00:00 |
| `Notiz` | DKF |
| `Kostenst` | 0 |
| `IhrZeichen` |  |
| `UnserZeichen` | RH |
| `BestellDatum` | NULL |
| `ProjektCode` | 12579111 |
| `AnsprpCode` | 0 |
| `AbteilungCode` | 0 |
| `NebenAdrCode1` | 1175127942 |
| `NebenAdrCode2` | 1175127942 |
| `NebenAdrCode3` | 1175127942 |
| `Kopftext` | Sehr geehrte Damen und Herren,



wir bedanken uns für das entgegengebrachte Vertrauen und hoffen di... (total: 204 chars) |
| `Schlußtext` | Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.



Wir weisen Sie darauf hin, dass f... (total: 177 chars) |
| `Zahlbarbis` | 2024-05-14 00:00:00 |
| `Skontobis` | 2024-04-30 00:00:00 |
| `Skonto` | 0.0 |
| `AutNummer` | -1 |
| `RA` | -1 |
| `WartungMiete` | 0 |
| `NebenAdrText1` | Amelie Beutner und Fabian Beutner-Zeitler

Pflanzbergweg 2

92263 Ebermannsdorf - Pittersberg

 |
| `NebenAdrText2` | Amelie Beutner und Fabian Beutner-Zeitler

Pflanzbergweg 2

92263 Ebermannsdorf - Pittersberg

 |
| `NebenAdrText3` | Amelie Beutner und Fabian Beutner-Zeitler

Pflanzbergweg 2

92263 Ebermannsdorf - Pittersberg

 |
| `NebenAdrType1` | 1 |
| `NebenAdrType2` | 1 |
| `NebenAdrType3` | 1 |
| `NebenAdrAPCode1` | 0 |
| `NebenAdrAPCode2` | 0 |
| `NebenAdrAPCode3` | 0 |
| `NebenAdrPostfach1` | 0 |
| `NebenAdrPostfach2` | 0 |
| `NebenAdrPostfach3` | 0 |
| `NebenAdrAbteilungCode1` | 0 |
| `NebenAdrAbteilungCode2` | 0 |
| `NebenAdrAbteilungCode3` | 0 |
| `Feld1` | NULL |
| `Feld2` | NULL |
| `Feld3` | NULL |
| `Feld4` | NULL |
| `Feld5` | NULL |
| `Feld6` | NULL |
| `Feld7` | NULL |
| `Zahlungsfrist` | 14 |
| `Skontofrist` | 0.0 |
| `KarteiCode` | 0 |
| `WAVerwaltung` | 0 |
| `SachProfEinfrieren` | 0 |
| `Status1` | 0 |
| `Status2` | 0 |
| `Status3` | 0 |
| `Status4` | 0 |
| `Status5` | 0 |
| `Eingefroren` | 0 |
| `WaehrungCode` | 1 |
| `Kurs` | 1.0 |
| `KursDatum` | 2001-10-24 00:00:00 |
| `AuftragsNummer` | 240063 |
| `AuftragsDatum` | 2024-03-07 00:00:00 |
| `ListFlag` | 0 |
| `BenutzerCode` | 581413548 |
| `SN` | NULL |
| `Brutto` | 0 |
| `Preisgruppe` | 0 |
| `ZahlungsCode` | 0 |
| `Auftragsbeginn` | 2024-04-22 00:00:00 |
| `BuchungsDatum` | 2024-04-30 00:00:00 |
| `KW` | 0 |
| `RTFKopftext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat{\fonttbl{\f0\fnil Arial;}{\f1\fnil\fcharset0 Arial;}}

{\*\... (total: 406 chars) |
| `RTFSchlußtext` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat{\fonttbl{\f0\fnil Arial;}{\f1\fnil\fcharset0 Arial;}}

{\*\... (total: 383 chars) |
| `DB` | 0.0 |
| `Wert` | 2877.76 |
| `SprachCode` | 0 |
| `LänderCode` | 0 |
| `Steuerschlüssel` | 0 |
| `Lieferadressegeändert` | 0 |
| `Postfach` | 0 |
| `Anzahlung` | 0 |
| `SchlussrechnungCode` | NULL |
| `NichtSteuerbar` | NULL |
| `ErsatzErlöskonto` | 0 |
| `HauptAdresse` | Amelie Beutner und Fabian Beutner-Zeitler

Pflanzbergweg 2

92263 Ebermannsdorf - Pittersberg

 |
| `Datei` | NULL |
| `BenutzerCode2` | 888797748 |
| `LookupCode` | 0 |
| `VerteilerCode` | 0 |
| `ObjGrCode` | NULL |
| `BankverbindungCode` | 0 |
| `Art` | 0 |
| `WartungsobjektCode` | 0 |
| `LFCode` | NULL |
| `LieferungsArtCode` | 0 |
| `LieferungsArtZiel` | 0 |
| `ProjektVorgangsCode` | 0 |
| `Bezugsgroesse` | NULL |
| `Leistungsort` |  |
| `Skonto2` | 0.0 |
| `Skontofrist2` | 0.0 |
| `Skontobis2` | 2024-04-30 00:00:00 |
| `EditDate` | 2024-05-02 11:21:51.800000 |
| `MobileBearbeitung` | 0 |
| `OriginalRechnungCode` | 0 |
| `APP_UnterschriebenVon` |  |
| `APP_EmailKopieAn` |  |
| `TourCode` | 0 |
| `LieferterminAbgehend` | 2024-04-22 00:00:00 |
| `Mietdauer` | 0.0 |
| `Mietfaktor` | 1.0 |
| `NiederlassungsCode` | 0 |
| `Leistungsbeginn` | NULL |
| `Leistungsende` | NULL |
| `CreatedByLoginId` | 00000000-0000-0000-0000-000000000000 |
| `WebShopOrderDefinitionData` |  |
| `KasseZahlungsArt` | NULL |
| `KasseBetragGegeben` | NULL |
| `KasseBetragZurück` | NULL |
| `Nebenadresse3Geändert` | 0 |
| `Bruttowert` | 3424.53 |
| `KasseId` | NULL |
| `CreationDate` | NULL |
| `TseTransactionSignature` | NULL |
| `TseTransactionNumber` | NULL |
| `TseSerialNumber` | NULL |
| `TseSignatureCount` | NULL |
| `TseStart` | NULL |
| `TseEnd` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |
| `HallenCode` | NULL |
| `ERechnung_Auftragsnummer_BT14` | NULL |
| `ERechnung_Bestellnummer_BT13` | NULL |
| `ERechnung_Empfangsbestätigung_BT15` | NULL |
| `ERechnung_Objekt_BT18` | NULL |
| `ERechnung_Projektreferenz_BT11` | NULL |
| `ERechnung_ReverseCharge` | NULL |
| `ERechnung_Tender_BT17` | NULL |
| `ERechnung_Versandanzeige_BT16` | NULL |
| `ERechnung_Vertragsnummer_BT12` | NULL |
| `ERechnung_Gutschrift_BT25` | NULL |
| `ERechnung_Gutschrift_BT26` | NULL |
| `ERechnungsart_BT3` | NULL |
| `BankAccountCode` | NULL |

---

## dbo.RecycleBin

<a name="dboRecycleBin"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Data` | nvarchar | -1 | ✅ | - |
| `ItemCode` | int | - | ✅ | - |
| `ItemId` | uniqueidentifier | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `RecycleDate` | datetime | - | ✅ | - |
| `SdObjMemberCode` | int | - | ✅ | - |
| `SdObjType` | int | - | ✅ | - |
| `EntityType` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.RefreshLockedSdObjectsLogs

<a name="dboRefreshLockedSdObjectsLogs"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Runtime` | int | - | ✅ | - |
| `Timestamp` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.REImport

<a name="dboREImport"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Belegdatum` | datetime | - | ✅ | - |
| `Belegnummer` | nvarchar | 50 | ✅ | - |
| `Benutzercode` | int | - | ✅ | - |
| `Bruttosumme` | float | - | ✅ | - |
| `Importdatum` | datetime | - | ✅ | - |
| `SDObjMembercode` | int | - | ✅ | - |
| `RECode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 573026369 |
| `Belegdatum` | NULL |
| `Belegnummer` | sbetrag |
| `Benutzercode` | 581413548 |
| `Bruttosumme` | 0.0 |
| `Importdatum` | 2023-07-11 12:39:03.357000 |
| `SDObjMembercode` | 0 |
| `RECode` | 18124573 |

---

## dbo.Reisekostenabrechnung

<a name="dboReisekostenabrechnung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ProjektCode` | int | - | ✅ | - |
| `MitarbeiterCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Kostenstelle` | int | - | ✅ | - |
| `BestellungCode` | int | - | ✅ | - |
| `BedarfCode` | int | - | ✅ | - |
| `DienstreiseauftragsNummer` | int | - | ✅ | - |
| `Stunden` | int | - | ✅ | - |
| `Tage` | int | - | ✅ | - |
| `AnzahlÜbernachtungen` | int | - | ✅ | - |
| `EURjeNacht` | float | - | ✅ | - |
| `AnzahlFrühstück` | int | - | ✅ | - |
| `EURjeFrühstück` | float | - | ✅ | - |
| `FahrtkostenEisenbahn` | float | - | ✅ | - |
| `FahrtkostenFlug` | float | - | ✅ | - |
| `FahrtkostenMietwagen` | float | - | ✅ | - |
| `Fahrtkostenkm` | int | - | ✅ | - |
| `FahrtkostenEURjekm` | float | - | ✅ | - |
| `FahrtkostenkmEUR` | float | - | ✅ | - |
| `FahrtkostenMitfahrerkm` | int | - | ✅ | - |
| `FahrtkostenMitfahrerEURjekm` | float | - | ✅ | - |
| `FahrtkostenMitfahrerkmEUR` | float | - | ✅ | - |
| `FahrtkostenSonstiges` | float | - | ✅ | - |
| `VerpflegungsmehraufwendungenÜber24h` | int | - | ✅ | - |
| `VerpflegungsmehraufwendungenÜber24hEURjeh` | float | - | ✅ | - |
| `VerpflegungsmehraufwendungenÜber24hEUR` | float | - | ✅ | - |
| `Verpflegungsmehraufwendungen14bis24h` | int | - | ✅ | - |
| `Verpflegungsmehraufwendungen14bis24hEURjeh` | float | - | ✅ | - |
| `Verpflegungsmehraufwendungen14bis24hEUR` | float | - | ✅ | - |
| `Verpflegungsmehraufwendungen8bis14h` | int | - | ✅ | - |
| `Verpflegungsmehraufwendungen8bis14hEURjeh` | float | - | ✅ | - |
| `Verpflegungsmehraufwendungen8bis14hEUR` | float | - | ✅ | - |
| `Vorschuss` | float | - | ✅ | - |
| `ÜbernahmeREDatum` | datetime | - | ✅ | - |
| `ÜbernahmeREBCode` | int | - | ✅ | - |
| `ÜbernahmeRERECode` | int | - | ✅ | - |
| `AbschlussDatum` | datetime | - | ✅ | - |
| `AbschlussBCode` | int | - | ✅ | - |
| `Nebenkosten1Text` | nvarchar | 50 | ✅ | - |
| `Nebenkosten1Summe` | float | - | ✅ | - |
| `Nebenkosten2Text` | nvarchar | 50 | ✅ | - |
| `Nebenkosten2Summe` | float | - | ✅ | - |
| `Nebenkosten3Text` | nvarchar | 50 | ✅ | - |
| `Nebenkosten3Summe` | float | - | ✅ | - |
| `SDObjmemberCode` | int | - | ✅ | - |
| `Auszahlungsbetrag` | float | - | ✅ | - |
| `KontaktberichtCode` | int | - | ✅ | - |
| `KontaktberichtManuell` | nvarchar | 4000 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Land` | nvarchar | 250 | ✅ | - |
| `Ort` | nvarchar | 250 | ✅ | - |
| `Reisezweck` | nvarchar | 250 | ✅ | - |
| `Reisebeginn` | datetime | - | ✅ | - |
| `Reiseende` | datetime | - | ✅ | - |
| `LandCode` | int | - | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | - |
| `Genehmigt` | int | - | ✅ | - |
| `KundenCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `AbzugFrühstückAnzahl` | int | - | ✅ | - |
| `AbzugFrühstückEUR` | float | - | ✅ | - |
| `SachbezugEUR` | float | - | ✅ | - |
| `AnsprpCode` | int | - | ✅ | - |
| `SachbezugText` | nvarchar | 100 | ✅ | - |
| `ProjektvorgangsCode` | int | - | ✅ | - |
| `BelegSumme` | float | - | ✅ | - |
| `Art` | int | - | ✅ | - |
| `VerpflegungsmehraufwendungenUnter24h` | int | - | ✅ | - |
| `VerpflegungsmehraufwendungenUnter24hEURjeh` | float | - | ✅ | - |
| `VerpflegungsmehraufwendungenUnter24hEUR` | float | - | ✅ | - |
| `Abzug20ProzentAnzahlAuf12EUR` | float | - | ✅ | - |
| `Abzug40ProzentAnzahlAuf12EUR` | float | - | ✅ | - |
| `Abzug20ProzentAnzahlAuf24EUR` | float | - | ✅ | - |
| `Abzug40ProzentAnzahlAuf24EUR` | float | - | ✅ | - |
| `Arbeitsbeginn` | datetime | - | ✅ | - |
| `Arbeitsende` | datetime | - | ✅ | - |
| `SDObjmemberCodeBesuchterGeschäftspartner` | int | - | ✅ | ((0)) |
| `SDObjTypeBesuchterGeschäftspartner` | int | - | ✅ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ReisekostenabrechnungBeleg

<a name="dboReisekostenabrechnungBeleg"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Reisekostenabrechnungcode` | int | - | ❌ | - |
| `Benutzercode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | nvarchar | 200 | ✅ | - |
| `Bezeichnung` | nvarchar | 200 | ✅ | - |
| `Belegnummer` | int | - | ✅ | - |
| `Belegart` | int | - | ✅ | - |
| `Mwst` | float | - | ✅ | - |
| `Waehrungscode` | int | - | ✅ | - |
| `Einnahme` | float | - | ✅ | - |
| `Ausgabe` | float | - | ✅ | - |
| `Sachkonto` | int | - | ✅ | - |
| `Kategorie1` | nvarchar | 80 | ✅ | - |
| `Kategorie2` | nvarchar | 80 | ✅ | - |
| `Kostenst` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `EnumBelegart` | int | - | ✅ | ((0)) |
| `EnumBelegartFahrtkosten` | int | - | ✅ | ((0)) |
| `BelegartFahrtkosten` | int | - | ✅ | ((0)) |
| `BetragBrutto1` | float | - | ✅ | - |
| `BetragBrutto2` | float | - | ✅ | - |
| `Mwst1` | float | - | ✅ | - |
| `Mwst2` | float | - | ✅ | - |
| `Sachkonto1` | int | - | ✅ | ((0)) |
| `Sachkonto2` | int | - | ✅ | ((0)) |
| `Steuerschlüssel1` | int | - | ✅ | ((0)) |
| `Steuerschlüssel2` | int | - | ✅ | ((0)) |
| `Anzahl` | float | - | ✅ | - |
| `EPreis` | float | - | ✅ | - |
| `EnumZahlungsart` | int | - | ✅ | ((0)) |
| `Zahlungsart` | int | - | ✅ | ((0)) |
| `AbrechnungKundeGeplant` | int | - | ✅ | ((0)) |
| `AbrechnungBZObjMemberCode` | int | - | ✅ | ((0)) |
| `AbrechnungKundeErfolgt` | int | - | ✅ | ((0)) |
| `Kurs` | float | - | ✅ | - |
| `Lohnkonto1` | int | - | ✅ | - |
| `Lohnkonto2` | int | - | ✅ | - |
| `BetragBrutto3` | float | - | ✅ | - |
| `Mwst3` | float | - | ✅ | - |
| `Sachkonto3` | int | - | ✅ | - |
| `Steuerschlüssel3` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ReisekostenabrechnungVerpflegungsmehraufwand

<a name="dboReisekostenabrechnungVerpflegungsmehraufwand"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ReisekostenabrechnungCode` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 500 | ✅ | ('') |
| `Datum` | datetime | - | ✅ | - |
| `Belegnummer` | int | - | ✅ | ((0)) |
| `VerpflegungsmehraufwandArt` | int | - | ✅ | ((0)) |
| `Betrag` | float | - | ✅ | - |
| `Sachkonto` | int | - | ✅ | ((0)) |
| `Kostenst` | int | - | ✅ | ((0)) |
| `Stunden` | float | - | ✅ | - |
| `AbzugFrühstück` | int | - | ✅ | ((0)) |
| `AbzugAbendessen` | int | - | ✅ | ((0)) |
| `AbzugFrühstückBetrag` | float | - | ✅ | - |
| `AbzugAbendessenBetrag` | float | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `SDObjmembercode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `Notiz` | nvarchar | -1 | ✅ | ('') |
| `AbzugMittagessenBetrag` | float | - | ✅ | - |
| `AbzugMittagessen` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ReisekostenBelegarten

<a name="dboReisekostenBelegarten"></a>

**Anzahl Datensätze:** 7

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `EnumBelegart` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 500 | ✅ | ('') |
| `Sachkonto1` | int | - | ✅ | ((0)) |
| `Steuerschlüssel1` | int | - | ✅ | ((0)) |
| `Mwst1` | float | - | ✅ | - |
| `Mwst2` | float | - | ✅ | - |
| `Sachkonto2` | int | - | ✅ | ((0)) |
| `Steuerschlüssel2` | int | - | ✅ | ((0)) |
| `Lohnkonto1` | int | - | ✅ | - |
| `Lohnkonto2` | int | - | ✅ | - |
| `Mwst3` | float | - | ✅ | - |
| `Sachkonto3` | int | - | ✅ | - |
| `Steuerschlüssel3` | int | - | ✅ | - |
| `Lohnkonto` | int | - | ✅ | - |
| `Sachkonto` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `EnumBelegart` | 1 |
| `Bezeichnung` | Ohne |
| `Sachkonto1` | 0 |
| `Steuerschlüssel1` | 0 |
| `Mwst1` | 19.0 |
| `Mwst2` | 0.0 |
| `Sachkonto2` | 0 |
| `Steuerschlüssel2` | 0 |
| `Lohnkonto1` | NULL |
| `Lohnkonto2` | NULL |
| `Mwst3` | NULL |
| `Sachkonto3` | NULL |
| `Steuerschlüssel3` | NULL |
| `Lohnkonto` | NULL |
| `Sachkonto` | NULL |

---

## dbo.ReisekostenBelegartenFahrtkosten

<a name="dboReisekostenBelegartenFahrtkosten"></a>

**Anzahl Datensätze:** 10

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `EnumBelegartFahrtkosten` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 500 | ✅ | ('') |
| `Sachkonto1` | int | - | ✅ | ((0)) |
| `Steuerschlüssel1` | int | - | ✅ | ((0)) |
| `Mwst1` | float | - | ✅ | - |
| `Mwst2` | float | - | ✅ | - |
| `Sachkonto2` | int | - | ✅ | ((0)) |
| `Steuerschlüssel2` | int | - | ✅ | ((0)) |
| `Lohnkonto1` | int | - | ✅ | - |
| `Lohnkonto2` | int | - | ✅ | - |
| `Mwst3` | float | - | ✅ | - |
| `Sachkonto3` | int | - | ✅ | - |
| `Steuerschlüssel3` | int | - | ✅ | - |
| `Lohnkonto` | int | - | ✅ | - |
| `Sachkonto` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `EnumBelegartFahrtkosten` | 1 |
| `Bezeichnung` | Taxi |
| `Sachkonto1` | 0 |
| `Steuerschlüssel1` | 0 |
| `Mwst1` | 7.0 |
| `Mwst2` | NULL |
| `Sachkonto2` | 0 |
| `Steuerschlüssel2` | 0 |
| `Lohnkonto1` | NULL |
| `Lohnkonto2` | NULL |
| `Mwst3` | NULL |
| `Sachkonto3` | NULL |
| `Steuerschlüssel3` | NULL |
| `Lohnkonto` | NULL |
| `Sachkonto` | NULL |

---

## dbo.ReisekostenZahlungsarten

<a name="dboReisekostenZahlungsarten"></a>

**Anzahl Datensätze:** 5

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `EnumZahlungsart` | int | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 500 | ✅ | ('') |
| `Sachkonto` | int | - | ✅ | ((0)) |
| `Lohnkonto` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `EnumZahlungsart` | 1 |
| `Bezeichnung` | Aus eigener Tasche |
| `Sachkonto` | 0 |
| `Lohnkonto` | 0 |

---

## dbo.REMuster

<a name="dboREMuster"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RNummer` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `EingangsDatum` | datetime | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `RNummerbeiLieferant` | nvarchar | 20 | ✅ | - |
| `FälligDatum` | datetime | - | ✅ | - |
| `RBetrag` | float | - | ✅ | ((0)) |
| `RMwst` | float | - | ✅ | ((0)) |
| `BezSumme` | float | - | ✅ | ((0)) |
| `StornSumme` | float | - | ✅ | ((0)) |
| `Mahnstuffe` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `DTANr` | real | - | ✅ | - |
| `Skonto` | float | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `RESachkGesamt` | float | - | ✅ | ((0)) |
| `REKostenstGesamt` | float | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `tmpSkonto` | float | - | ✅ | ((0)) |
| `OLE` | image | 2147483647 | ✅ | - |
| `WährungCode` | int | - | ✅ | ((0)) |
| `RBetragFremd` | float | - | ✅ | ((0)) |
| `Kurs` | float | - | ✅ | ((0)) |
| `Berechnen` | int | - | ✅ | ((0)) |
| `Summe` | float | - | ✅ | ((0)) |
| `BuchungsDatum` | datetime | - | ✅ | - |
| `Vorerfasst` | int | - | ✅ | ((0)) |
| `zurück` | int | - | ✅ | ((0)) |
| `BankkontoCode` | int | - | ✅ | ((0)) |
| `Verwendungszweck` | nvarchar | 200 | ✅ | - |
| `EingangslieferscheinCode` | int | - | ✅ | ((0)) |
| `SkontoDatum` | datetime | - | ✅ | - |
| `SkontoTg` | int | - | ✅ | ((0)) |
| `Skonto2` | float | - | ✅ | ((0)) |
| `Skonto2Datum` | datetime | - | ✅ | - |
| `Skonto2Tg` | int | - | ✅ | ((0)) |
| `SkontoProzent` | float | - | ✅ | ((0)) |
| `FreigabeBCode` | int | - | ✅ | ((0)) |
| `FreigabeDatum` | datetime | - | ✅ | - |
| `Belegart` | int | - | ✅ | ((0)) |
| `FreigabeNotiz` | ntext | 1073741823 | ✅ | - |
| `SperrungBcode` | int | - | ✅ | ((0)) |
| `ScanFileName` | nvarchar | 100 | ✅ | - |
| `WhattodoCode` | int | - | ✅ | ((0)) |
| `VerrechnetCode` | int | - | ✅ | ((0)) |
| `Reisekostenabrechnung` | int | - | ✅ | - |
| `UrsprungRBetrag` | float | - | ✅ | ((0)) |
| `UrsprungMwst` | float | - | ✅ | ((0)) |
| `UrsprungBezSumme` | float | - | ✅ | ((0)) |
| `Kassenbeleg` | int | - | ✅ | - |
| `GenehmigungDurchBCode` | int | - | ✅ | ((0)) |
| `StatusCode` | int | - | ✅ | ((0)) |
| `Kassenbelegnummer` | int | - | ✅ | ((0)) |
| `Scandatei` | image | 2147483647 | ✅ | - |
| `RABezSummeCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ReportAnzahlKopien

<a name="dboReportAnzahlKopien"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `BZObjType` | int | - | ✅ | ((0)) |
| `AnzahlKopien` | int | - | ✅ | ((0)) |
| `ReportCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Reports2

<a name="dboReports2"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Location` | nvarchar | -1 | ✅ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `ReportMode` | int | - | ✅ | - |
| `ReportType` | int | - | ✅ | - |
| `SourceDetails` | nvarchar | -1 | ✅ | - |
| `TypeOfSource` | int | - | ✅ | - |
| `DeploymentId` | uniqueidentifier | - | ✅ | - |
| `SpecialSourceType` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `ReportOptions` | nvarchar | -1 | ✅ | - |
| `DeploymentUpdateTime` | datetime | - | ✅ | - |
| `DefaultReport` | int | - | ✅ | - |
| `DisableDeployment` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.REProjektkostenSplit

<a name="dboREProjektkostenSplit"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RECode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `AnteilProzent` | float | - | ✅ | ((0)) |
| `AnteilDM` | float | - | ✅ | ((0)) |
| `PositionCode` | int | - | ✅ | ((0)) |
| `Mwst` | float | - | ✅ | ((16)) |
| `Notiz` | nvarchar | 50 | ✅ | - |
| `RechnungCode` | int | - | ✅ | ((0)) |
| `Kostengruppe` | int | - | ✅ | ((0)) |
| `Umbuchung` | int | - | ✅ | - |
| `UmbuchungDatum` | datetime | - | ✅ | - |
| `UmbuchungBCode` | int | - | ✅ | ((0)) |
| `UmbuchungSchlüssel` | int | - | ✅ | ((0)) |
| `UmbuchungZielProjektCode` | int | - | ✅ | ((0)) |
| `UmbuchungUrsprungProjektCode` | int | - | ✅ | ((0)) |
| `UmbuchungRESachkontensplitCode` | int | - | ✅ | ((0)) |
| `SachkNummer` | int | - | ✅ | ((0)) |
| `Abrechenbar` | int | - | ✅ | - |
| `NichtVerrechenbar` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.RESachkontenSplit

<a name="dboRESachkontenSplit"></a>

**Anzahl Datensätze:** 6,550

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RECode` | int | - | ✅ | ((0)) |
| `SachkCode` | int | - | ✅ | - |
| `Mwst` | float | - | ✅ | ((15)) |
| `AnteilDM` | float | - | ✅ | ((0)) |
| `AnteilProzent` | float | - | ✅ | - |
| `KostenstCode` | int | - | ✅ | - |
| `KostenstNummer` | int | - | ✅ | ((0)) |
| `Berichtigungsschlüssel` | int | - | ✅ | ((0)) |
| `Steuerschlüssel` | int | - | ✅ | ((0)) |
| `SachkNummer` | int | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `Notiz` | nvarchar | 60 | ✅ | - |
| `BestellCode` | int | - | ✅ | ((0)) |
| `Kostengruppe` | int | - | ✅ | ((0)) |
| `MwstBetrag` | float | - | ✅ | ((0)) |
| `Umbuchung` | int | - | ✅ | - |
| `RechnungCode` | int | - | ✅ | - |
| `Aufmaß` | nvarchar | 4000 | ✅ | ('') |
| `Vorlauf` | datetime | - | ✅ | - |
| `Gegenkonto` | int | - | ✅ | ((0)) |
| `ReisekostenabrechnungBelegCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 255108255 |
| `RECode` | 87995764 |
| `SachkCode` | NULL |
| `Mwst` | 19.0 |
| `AnteilDM` | 53.49 |
| `AnteilProzent` | 0.0 |
| `KostenstCode` | 0 |
| `KostenstNummer` | 0 |
| `Berichtigungsschlüssel` | 0 |
| `Steuerschlüssel` | 9 |
| `SachkNummer` | 3400 |
| `Datev` | NULL |
| `ProjektCode` | 65701934 |
| `Notiz` |  |
| `BestellCode` | 0 |
| `Kostengruppe` | 0 |
| `MwstBetrag` | 8.54 |
| `Umbuchung` | 0 |
| `RechnungCode` | NULL |
| `Aufmaß` |  |
| `Vorlauf` | NULL |
| `Gegenkonto` | 0 |
| `ReisekostenabrechnungBelegCode` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.RESachkontenSplitMuster

<a name="dboRESachkontenSplitMuster"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RECode` | int | - | ✅ | ((0)) |
| `SachkCode` | int | - | ✅ | - |
| `Mwst` | float | - | ✅ | ((15)) |
| `AnteilDM` | float | - | ✅ | ((0)) |
| `AnteilProzent` | float | - | ✅ | - |
| `KostenstCode` | int | - | ✅ | - |
| `KostenstNummer` | int | - | ✅ | ((0)) |
| `Berichtigungsschlüssel` | int | - | ✅ | ((0)) |
| `Steuerschlüssel` | int | - | ✅ | ((0)) |
| `SachkNummer` | int | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `Notiz` | nvarchar | 30 | ✅ | - |
| `BestellCode` | int | - | ✅ | ((0)) |
| `Kostengruppe` | int | - | ✅ | ((0)) |
| `MwstBetrag` | float | - | ✅ | ((0)) |
| `Umbuchung` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Reservierungen

<a name="dboReservierungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ArtikelCode` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `PositionenCode` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `Seriennummer` | nvarchar | 100 | ✅ | - |
| `Anzahl` | float | - | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | - |
| `SeriennummerverwaltungCode` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `LagerortCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.REStornSumme

<a name="dboREStornSumme"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RECode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Summe` | float | - | ✅ | ((0)) |
| `Datev` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SachkNummer` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Rücknahme

<a name="dboRücknahme"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Nummer` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `Typ` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SN` | nvarchar | 50 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Gebucht` | int | - | ✅ | ((0)) |
| `LagerortCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Sachkonten

<a name="dboSachkonten"></a>

**Anzahl Datensätze:** 104

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `SachkCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SachkNummer` | int | - | ✅ | - |
| `SachkKürzel` | nvarchar | 50 | ✅ | - |
| `SachkName` | nvarchar | 150 | ✅ | - |
| `Art` | int | - | ✅ | ((0)) |
| `KostenStCode` | int | - | ✅ | ((0)) |
| `KostenStNummer` | int | - | ✅ | - |
| `Steuerschlüssel` | int | - | ✅ | - |
| `Deaktiviert` | int | - | ✅ | - |
| `Gemeinkosten` | int | - | ✅ | - |
| `KostengruppenCode` | int | - | ✅ | ((0)) |
| `Automatikkonto` | int | - | ✅ | ((0)) |
| `Anzahlungskonto` | int | - | ✅ | - |
| `Bankkonto` | nvarchar | 100 | ✅ | - |
| `NurFixkosten` | int | - | ✅ | ((0)) |
| `NichtUmsatzschmälernd` | int | - | ✅ | ((0)) |
| `Abgrenzungskonto` | int | - | ✅ | ((0)) |
| `Abgrenzungsform` | int | - | ✅ | - |
| `Kontengruppe` | nvarchar | 50 | ✅ | - |
| `ErsatzKontoMwstUmstellung` | int | - | ✅ | - |
| `AbgrenzungsSteuerschlüssel` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `WithoutTaxKey` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `SachkCode` | 283529 |
| `SachkNummer` | 4919 |
| `SachkKürzel` |  |
| `SachkName` | Porto 19% Vorsteuer |
| `Art` | 4 |
| `KostenStCode` | 0 |
| `KostenStNummer` | 0 |
| `Steuerschlüssel` | 9 |
| `Deaktiviert` | 0 |
| `Gemeinkosten` | 0 |
| `KostengruppenCode` | 0 |
| `Automatikkonto` | 0 |
| `Anzahlungskonto` | 0 |
| `Bankkonto` | 0 |
| `NurFixkosten` | 0 |
| `NichtUmsatzschmälernd` | 0 |
| `Abgrenzungskonto` | 0 |
| `Abgrenzungsform` | 0 |
| `Kontengruppe` | NULL |
| `ErsatzKontoMwstUmstellung` | NULL |
| `AbgrenzungsSteuerschlüssel` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `WithoutTaxKey` | NULL |

---

## dbo.SachkontoBanking

<a name="dboSachkontoBanking"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ✅ | - |
| `Kontonummer` | int | - | ✅ | - |
| `SachKNummer` | int | - | ✅ | - |
| `KontonummerString` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 95600901 |
| `Kontonummer` | 79561 |
| `SachKNummer` | 1200 |
| `KontonummerString` | 79561 |

---

## dbo.SalesOpportunityAttachements

<a name="dboSalesOpportunityAttachements"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `FileDisplayname` | nvarchar | 300 | ✅ | - |
| `FileKey` | nvarchar | 300 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `SalesOpportunityCode` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SalesOpportunityRatingTemplate

<a name="dboSalesOpportunityRatingTemplate"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 100 | ✅ | - |
| `RatingValue` | decimal | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `Comment` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Sammelmappe

<a name="dboSammelmappe"></a>

**Anzahl Datensätze:** 16

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BCode` | int | - | ✅ | ((0)) |
| `Betreff` | nvarchar | 255 | ✅ | - |
| `Datei` | ntext | 1073741823 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1647743772 |
| `BCode` | 888797748 |
| `Betreff` | HT | RK | Konfiguration |
| `Datei` | \\APPSERVER\Work4all\B001\bff9d8be-6f8d-48fd-823e-fd2becc2b53b.pdf |
| `Datum` | 2022-06-07 11:10:57.143000 |

---

## dbo.SavedListFilter

<a name="dboSavedListFilter"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Filter` | nvarchar | -1 | ✅ | - |
| `Global` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `Version` | nvarchar | 200 | ✅ | - |
| `ListMode` | nvarchar | 256 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SaveSendMailJob

<a name="dboSaveSendMailJob"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `ErrorMessages` | nvarchar | -1 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `JobAction` | int | - | ✅ | - |
| `JobState` | int | - | ✅ | - |
| `JobStateDateTime` | datetime | - | ✅ | - |
| `MailData` | nvarchar | -1 | ✅ | - |
| `MailServiceId` | uniqueidentifier | - | ✅ | - |
| `SenderMailAddress` | nvarchar | 200 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `AttachEntityCode` | int | - | ✅ | - |
| `AttachEntityId` | uniqueidentifier | - | ✅ | - |
| `AttachEntityType` | int | - | ✅ | - |
| `ApiInstance` | nvarchar | 200 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Schriftarten

<a name="dboSchriftarten"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SchriftartName` | nvarchar | 120 | ✅ | - |
| `BCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Selektionen

<a name="dboSelektionen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Object` | int | - | ✅ | ((0)) |
| `Select` | ntext | 1073741823 | ✅ | - |
| `Name` | nvarchar | 70 | ✅ | - |
| `BCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Serienbriefdaten

<a name="dboSerienbriefdaten"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Briefcode` | int | - | ✅ | - |
| `APCode` | int | - | ✅ | - |
| `SDObjTyp` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `Firma1` | varchar | 70 | ✅ | - |
| `Firma2` | varchar | 70 | ✅ | - |
| `Firma3` | varchar | 70 | ✅ | - |
| `Abteilung` | varchar | 70 | ✅ | - |
| `Ansprechpartner` | varchar | 70 | ✅ | - |
| `APVorname` | varchar | 70 | ✅ | - |
| `APNachname` | varchar | 70 | ✅ | - |
| `Strasse` | varchar | 70 | ✅ | - |
| `PLZ` | varchar | 10 | ✅ | - |
| `Ort` | varchar | 70 | ✅ | - |
| `Notiz` | varchar | 70 | ✅ | - |
| `Anrede` | varchar | 70 | ✅ | - |
| `Telefax` | varchar | 30 | ✅ | - |
| `Adresserweiterung` | varchar | 70 | ✅ | - |
| `Feld1` | varchar | 70 | ✅ | - |
| `Feld2` | varchar | 70 | ✅ | - |
| `Feld3` | varchar | 70 | ✅ | - |
| `Feld4` | varchar | 70 | ✅ | - |
| `Feld5` | varchar | 70 | ✅ | - |
| `Feld6` | varchar | 70 | ✅ | - |
| `Feld7` | varchar | 70 | ✅ | - |
| `Feld8` | varchar | 70 | ✅ | - |
| `Feld9` | varchar | 70 | ✅ | - |
| `Feld10` | varchar | 70 | ✅ | - |
| `Funktion` | varchar | 70 | ✅ | - |
| `Email` | varchar | 70 | ✅ | - |
| `Sprachcode` | int | - | ✅ | - |
| `APTitel` | varchar | 70 | ✅ | - |
| `EmailPrivat` | varchar | 70 | ✅ | - |
| `Adresszeile1` | varchar | 70 | ✅ | - |
| `Adresszeile2` | varchar | 70 | ✅ | - |
| `Adresszeile3` | varchar | 70 | ✅ | - |
| `Adresszeile4` | varchar | 70 | ✅ | - |
| `Adresszeile5` | varchar | 70 | ✅ | - |
| `Adresszeile6` | varchar | 70 | ✅ | - |
| `Adresszeile7` | varchar | 70 | ✅ | - |
| `Adresszeile8` | varchar | 70 | ✅ | - |
| `Adresszeile9` | varchar | 70 | ✅ | - |
| `Postfach` | varchar | 70 | ✅ | - |
| `PostfachPLZ` | varchar | 70 | ✅ | - |
| `PostfachOrt` | varchar | 70 | ✅ | - |
| `Mobil` | varchar | -1 | ✅ | - |
| `Datumersterkontakt` | datetime | - | ✅ | - |
| `Datumletzterkontakt` | datetime | - | ✅ | - |
| `Internetadresse` | varchar | 70 | ✅ | - |
| `Kundennummer` | varchar | 70 | ✅ | - |
| `UstIDNr` | varchar | 50 | ✅ | - |
| `APEmail` | varchar | 70 | ✅ | - |
| `APTelefax` | varchar | 70 | ✅ | - |
| `Lieferantennummer` | varchar | 70 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Serienbriefe

<a name="dboSerienbriefe"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ✅ | - |
| `Briefcode` | int | - | ✅ | - |
| `APCode` | int | - | ✅ | - |
| `SDObjTyp` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `Firma1` | nvarchar | 400 | ✅ | - |
| `Firma2` | nvarchar | 400 | ✅ | - |
| `Firma3` | nvarchar | 400 | ✅ | - |
| `Abteilung` | nvarchar | 400 | ✅ | - |
| `Ansprechpartner` | nvarchar | 400 | ✅ | - |
| `APVorname` | nvarchar | 400 | ✅ | - |
| `APNachname` | nvarchar | 400 | ✅ | - |
| `Strasse` | nvarchar | 400 | ✅ | - |
| `PLZ` | nvarchar | 100 | ✅ | - |
| `Ort` | nvarchar | 400 | ✅ | - |
| `Notiz` | nvarchar | 800 | ✅ | - |
| `Anrede` | nvarchar | 400 | ✅ | - |
| `Telefax` | nvarchar | 400 | ✅ | - |
| `Adresserweiterung` | nvarchar | 400 | ✅ | - |
| `Feld1` | nvarchar | 400 | ✅ | - |
| `Feld2` | nvarchar | 400 | ✅ | - |
| `Feld3` | nvarchar | 400 | ✅ | - |
| `Feld4` | nvarchar | 400 | ✅ | - |
| `Feld5` | nvarchar | 400 | ✅ | - |
| `Feld6` | nvarchar | 400 | ✅ | - |
| `Feld7` | nvarchar | 400 | ✅ | - |
| `Feld8` | nvarchar | 400 | ✅ | - |
| `Feld9` | nvarchar | 400 | ✅ | - |
| `Feld10` | nvarchar | 400 | ✅ | - |
| `Funktion` | nvarchar | 400 | ✅ | - |
| `Email` | nvarchar | 400 | ✅ | - |
| `Sprachcode` | int | - | ✅ | - |
| `APTitel` | nvarchar | 400 | ✅ | - |
| `EmailPrivat` | nvarchar | 400 | ✅ | - |
| `Adresszeile1` | nvarchar | 400 | ✅ | - |
| `Adresszeile2` | nvarchar | 400 | ✅ | - |
| `Adresszeile3` | nvarchar | 400 | ✅ | - |
| `Adresszeile4` | nvarchar | 400 | ✅ | - |
| `Adresszeile5` | nvarchar | 400 | ✅ | - |
| `Adresszeile6` | nvarchar | 400 | ✅ | - |
| `Adresszeile7` | nvarchar | 400 | ✅ | - |
| `Adresszeile8` | nvarchar | 400 | ✅ | - |
| `Adresszeile9` | nvarchar | 400 | ✅ | - |
| `Postfach` | nvarchar | 400 | ✅ | - |
| `PostfachPLZ` | nvarchar | 100 | ✅ | - |
| `PostfachOrt` | nvarchar | 400 | ✅ | - |
| `Mobil` | nvarchar | 400 | ✅ | - |
| `Datumersterkontakt` | datetime | - | ✅ | - |
| `Datumletzterkontakt` | datetime | - | ✅ | - |
| `Internetadresse` | nvarchar | 400 | ✅ | - |
| `Kundennummer` | nvarchar | 400 | ✅ | - |
| `UstIDNr` | nvarchar | 400 | ✅ | - |
| `APEmail` | nvarchar | 400 | ✅ | - |
| `APTelefax` | nvarchar | 400 | ✅ | - |
| `Lieferantennummer` | nvarchar | 400 | ✅ | - |
| `APTelefon` | nvarchar | 400 | ✅ | - |
| `StaatKurz` | nvarchar | 20 | ✅ | - |
| `StaatLang` | nvarchar | 400 | ✅ | - |
| `Telefon` | nvarchar | 400 | ✅ | - |
| `Index2` | int | - | ✅ | - |
| `Versendet` | int | - | ✅ | - |
| `Kurzbezeichnung` | nvarchar | 500 | ✅ | ('') |
| `Fehlerbeschreibung` | nvarchar | 4000 | ✅ | ('') |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SeriennummerAnhänge

<a name="dboSeriennummerAnhänge"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Seriennummer` | nvarchar | -1 | ✅ | ('') |
| `Pfad` | nvarchar | -1 | ✅ | ('') |
| `Dateiname` | nvarchar | -1 | ✅ | ('') |
| `OriginalDateiname` | nvarchar | -1 | ✅ | ('') |
| `DateiErweiterung` | nvarchar | 10 | ✅ | ('') |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Seriennummerverwaltung

<a name="dboSeriennummerverwaltung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Seriennummer` | nvarchar | 100 | ✅ | - |
| `BZType` | int | - | ✅ | ((0)) |
| `RCode` | int | - | ✅ | ((0)) |
| `KCode` | int | - | ✅ | ((0)) |
| `ArtCode` | int | - | ✅ | ((0)) |
| `PosCode` | int | - | ✅ | - |
| `WareneingangCode` | int | - | ✅ | - |
| `LagerortCode` | int | - | ✅ | - |
| `Verfallsdatum` | datetime | - | ✅ | - |
| `Menge` | float | - | ✅ | ((0)) |
| `tmpMenge` | float | - | ✅ | ((0)) |
| `Notiz` | nvarchar | 100 | ✅ | - |
| `Index` | int | - | ✅ | ((0)) |
| `Notiz2` | nvarchar | 200 | ✅ | - |
| `Barcode` | nvarchar | 50 | ✅ | - |
| `GarantieBis` | datetime | - | ✅ | - |
| `ReparaturauftragCode` | int | - | ✅ | ((0)) |
| `SNausStückliste` | int | - | ✅ | ((0)) |
| `Gebucht` | int | - | ✅ | - |
| `Frei1` | nvarchar | 50 | ✅ | - |
| `FreigabeStatusCode` | int | - | ✅ | - |
| `Rücknahme` | datetime | - | ✅ | - |
| `ReparaturgarantieBis` | datetime | - | ✅ | - |
| `DatumLetzteAktion` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SeriennummerverwaltungHistorie

<a name="dboSeriennummerverwaltungHistorie"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `SNCode` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | 500 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `UrsprungsSN` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ServerManager

<a name="dboServerManager"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 60 | ✅ | ('') |
| `Value1` | int | - | ✅ | ((0)) |
| `Value2` | nvarchar | 100 | ✅ | ('') |
| `UserCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ServerManagerActions

<a name="dboServerManagerActions"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `RecordCode` | int | - | ✅ | - |
| `TableName` | nvarchar | 70 | ✅ | - |
| `CreationDate` | datetime | - | ✅ | - |
| `Action` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Description` | nvarchar | 100 | ✅ | - |
| `RecordArt` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1915996964 |
| `RecordCode` | 0 |
| `TableName` | OutlookAdressen |
| `CreationDate` | 2022-02-17 14:39:16.727000 |
| `Action` | 1 |
| `BenutzerCode` | 581413548 |
| `Description` | NULL |
| `RecordArt` | 1 |

---

## dbo.ShadowCopyBzObject

<a name="dboShadowCopyBzObject"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `BzObjType` | int | - | ✅ | - |
| `Data` | nvarchar | -1 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 2000 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `BzObjMemberCode` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `SdObjMemberCode` | int | - | ✅ | - |
| `SdObjType` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ShadowRE

<a name="dboShadowRE"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Data` | nvarchar | -1 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 500 | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `SdObjMemberCode` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ShadowServiceContract

<a name="dboShadowServiceContract"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Data` | nvarchar | -1 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 2000 | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `SdObjMemberCode` | int | - | ✅ | - |
| `SdObjType` | int | - | ✅ | - |
| `ServiceContractCode` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ShopAnsichtGruppen

<a name="dboShopAnsichtGruppen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Name` | nvarchar | 300 | ✅ | ('') |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ShopAnsichtRechte

<a name="dboShopAnsichtRechte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `GruppeId` | uniqueidentifier | - | ✅ | - |
| `GrCode` | int | - | ✅ | ((0)) |
| `Art` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SLModes

<a name="dboSLModes"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ArtikelCode` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `SLMode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SpaltenDefinition

<a name="dboSpaltenDefinition"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SpreadName` | nvarchar | 250 | ✅ | - |
| `ColumnName` | nvarchar | 250 | ✅ | - |
| `Nachkommastellen` | int | - | ✅ | - |
| `FormName` | nvarchar | 250 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SperrungArtikelbuchungen

<a name="dboSperrungArtikelbuchungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | uniqueidentifier | - | ✅ | (newid()) |
| `BenutzerCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Sperrzeiten

<a name="dboSperrzeiten"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Bezeichnung` | nvarchar | 500 | ✅ | ('') |
| `Beginn` | datetime | - | ✅ | - |
| `Art` | int | - | ✅ | ((0)) |
| `Ende` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Staffelpreise

<a name="dboStaffelpreise"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Art` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `PreisstaffeldefinitionenCode` | int | - | ✅ | ((0)) |
| `Preis` | float | - | ✅ | ((0)) |
| `SDObjMemberType` | int | - | ✅ | - |
| `Einstand` | float | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Staffelpreise_EK

<a name="dboStaffelpreise_EK"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Art` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `PreisstaffeldefinitionenCode` | int | - | ✅ | ((0)) |
| `Preis` | float | - | ✅ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.StaffelpreisZuschläge

<a name="dboStaffelpreisZuschläge"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((0)) |
| `PreisgruppenCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `Zuschlag` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Stammdatenmuster

<a name="dboStammdatenmuster"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ActSemObj` | int | - | ✅ | ((0)) |
| `ObjCode` | int | - | ✅ | ((0)) |
| `UrsprungObjCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.StammdatenSprachen

<a name="dboStammdatenSprachen"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Name` | nvarchar | 50 | ✅ | - |
| `CultureInfo` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 0 |
| `Name` | Deutsch |
| `CultureInfo` | NULL |

---

## dbo.Standardartikel

<a name="dboStandardartikel"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `SDObjMemberType` | int | - | ✅ | ((0)) |
| `Anzahl` | float | - | ✅ | ((0)) |
| `Preis` | float | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Abfragetext` | ntext | 1073741823 | ✅ | - |
| `Auftrag` | int | - | ✅ | - |
| `Angebot` | int | - | ✅ | - |
| `Lieferschein` | int | - | ✅ | - |
| `Rechnung` | int | - | ✅ | - |
| `Bestellung` | int | - | ✅ | - |
| `Projekt` | int | - | ✅ | - |
| `Bedarfsanforderung` | int | - | ✅ | - |
| `Kalkulation` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Standardtexte

<a name="dboStandardtexte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `SDObjMemberType` | int | - | ✅ | ((0)) |
| `BZObjMemberType` | int | - | ✅ | ((0)) |
| `Text` | ntext | 1073741823 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Standorte

<a name="dboStandorte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 100 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.StandorteEntfernung

<a name="dboStandorteEntfernung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `StandortCode` | int | - | ✅ | ((0)) |
| `SDObjMembercode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `PLZ` | nvarchar | 10 | ✅ | - |
| `Strasse` | nvarchar | 50 | ✅ | - |
| `EntfernungEinfach` | int | - | ✅ | ((0)) |
| `FahrtzeitEinfach` | float | - | ✅ | ((0)) |
| `Notiz` | nvarchar | 4000 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Steuergruppen

<a name="dboSteuergruppen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Name` | nvarchar | -1 | ✅ | ('') |
| `Art` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Intrastat` | int | - | ✅ | - |
| `BeiZahlungslaufBeruecksichtigen` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Steuerschlüssel

<a name="dboSteuerschlüssel"></a>

**Anzahl Datensätze:** 5

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Steuerschlüssel` | int | - | ✅ | ((0)) |
| `Mwst` | float | - | ✅ | ((0)) |
| `Notiz` | nvarchar | 50 | ✅ | - |
| `Kreditor` | int | - | ✅ | ((0)) |
| `Konto` | int | - | ✅ | ((0)) |
| `SteuerschlüsselAlphanumerisch` | nvarchar | 50 | ✅ | - |
| `MwstReversedCharge` | float | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `Steuerschlüssel` | 9 |
| `Mwst` | 19.0 |
| `Notiz` | NULL |
| `Kreditor` | 0 |
| `Konto` | 0 |
| `SteuerschlüsselAlphanumerisch` | NULL |
| `MwstReversedCharge` | NULL |

---

## dbo.Stopwatch

<a name="dboStopwatch"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `ArticleWorkItemCode` | int | - | ✅ | - |
| `CustomerCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Note` | nvarchar | 2000 | ✅ | - |
| `OrderConfirmationCode` | int | - | ✅ | - |
| `OrderConfirmationPositionCode` | int | - | ✅ | - |
| `ProjectCode` | int | - | ✅ | - |
| `ProjectStepCode` | int | - | ✅ | - |
| `StartTime` | datetime | - | ✅ | - |
| `StopTime` | datetime | - | ✅ | - |
| `TicketId` | uniqueidentifier | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |
| `CustomFieldsStore` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Stückliste

<a name="dboStückliste"></a>

**Anzahl Datensätze:** 660

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SLArtCode` | int | - | ✅ | ((0)) |
| `KompArtCode` | int | - | ✅ | ((0)) |
| `Index` | int | - | ✅ | ((0)) |
| `Anzahl` | real | - | ✅ | ((0)) |
| `Bezeichnung` | nvarchar | 150 | ✅ | - |
| `SL` | int | - | ✅ | ((0)) |
| `SLCode` | int | - | ✅ | ((0)) |
| `NurEinkauf` | int | - | ✅ | ((0)) |
| `Frei1` | int | - | ✅ | - |
| `Frei2` | int | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Nichtberechnen` | int | - | ✅ | - |
| `ProduktionschargenCode` | int | - | ✅ | - |
| `Länge` | float | - | ✅ | - |
| `Breite` | float | - | ✅ | - |
| `Menge` | float | - | ✅ | - |
| `Kalkulationslogik` | int | - | ✅ | - |
| `KalkulationslogikFaktor` | float | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 3888136 |
| `SLArtCode` | 0 |
| `KompArtCode` | 952546150 |
| `Index` | 1 |
| `Anzahl` | 1.0 |
| `Bezeichnung` | Werzalit IFB Exclusiv, bis 150 mm |
| `SL` | 0 |
| `SLCode` | 1300809757 |
| `NurEinkauf` | 0 |
| `Frei1` | NULL |
| `Frei2` | NULL |
| `Notiz` |  |
| `Nichtberechnen` | 0 |
| `ProduktionschargenCode` | 0 |
| `Länge` | 0.0 |
| `Breite` | 0.0 |
| `Menge` | 0.0 |
| `Kalkulationslogik` | 0 |
| `KalkulationslogikFaktor` | 1.0 |

---

## dbo.Stücklistenauflösung

<a name="dboStücklistenauflösung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ✅ | - |
| `BZType` | int | - | ✅ | - |
| `Auflösung` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Support

<a name="dboSupport"></a>

**Anzahl Datensätze:** 242

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | uniqueidentifier | - | ❌ | - |
| `TicketNumber` | int | - | ❌ | - |
| `Type` | int | - | ✅ | - |
| `Theme` | int | - | ✅ | - |
| `Title` | nvarchar | -1 | ✅ | - |
| `Description` | nvarchar | -1 | ✅ | - |
| `Comments` | nvarchar | -1 | ✅ | - |
| `ContactPerson` | nvarchar | 100 | ✅ | - |
| `CompanyName` | nvarchar | 100 | ✅ | - |
| `Date` | datetime | - | ✅ | - |
| `Status` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `CommentsFromSupporter` | nvarchar | -1 | ✅ | - |
| `HandlingDate` | datetime | - | ✅ | - |
| `SourceClass` | nvarchar | 250 | ✅ | - |
| `ScreenShot` | image | 2147483647 | ✅ | - |
| `SupportClassID` | int | - | ✅ | - |
| `SupportKategorieID` | int | - | ✅ | - |
| `Solution` | nvarchar | -1 | ✅ | - |
| `Priority` | int | - | ✅ | - |
| `ReleaseNo` | nvarchar | 50 | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `AnsprechpCode` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `Supporter` | nvarchar | 50 | ✅ | - |
| `CompanyM` | int | - | ✅ | - |
| `CompanyID` | int | - | ✅ | - |
| `SupporterID` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `Seriennummer` | nvarchar | 100 | ✅ | - |
| `Abschlussdatum` | datetime | - | ✅ | - |
| `SupportKategorie2ID` | int | - | ✅ | - |
| `SupporterID2` | int | - | ✅ | - |
| `Status2` | int | - | ✅ | - |
| `Abschlussdatum2` | datetime | - | ✅ | - |
| `EskalationsStufe` | int | - | ✅ | - |
| `Wiedervorlage` | datetime | - | ✅ | - |
| `PosCode` | int | - | ✅ | ((0)) |
| `BZObjType` | int | - | ✅ | ((0)) |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `WartungsobjektCode` | int | - | ✅ | ((0)) |
| `PosCodeWartung` | int | - | ✅ | ((0)) |
| `DatumUtc` | datetime | - | ✅ | - |
| `ZeitbedarfTicket` | float | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `ErinnernDate` | datetime | - | ✅ | - |
| `FolderSubKey` | nvarchar | 200 | ✅ | - |
| `LookupCodeProzessAbschnitt` | int | - | ✅ | - |
| `Ertrag` | float | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `Sprint` | uniqueidentifier | - | ✅ | - |
| `LieferscheinCode` | int | - | ✅ | - |
| `LieferscheinPositionenCode` | int | - | ✅ | - |
| `ChecklistPosCode` | int | - | ✅ | - |
| `Feld1` | float | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `ID` | F345BAE5-92C2-46EF-ACE6-007190A49E99 |
| `TicketNumber` | 40 |
| `Type` | 1 |
| `Theme` | NULL |
| `Title` | Terminvereinbarung | Beratung | Renovierung | DKF |
| `Description` | NULL |
| `Comments` | <div>Terminvereinbarung zwecks Beratungsgespräch im Büro für Renovierung von Objekt in Weiden</div>
... (total: 860 chars) |
| `ContactPerson` | rh@js-fenster.de |
| `CompanyName` | J. S. Fenster & Türen GmbH, Hoffmann |
| `Date` | 2022-01-28 15:11:43.573000 |
| `Status` | 3 |
| `BenutzerCode` | 581413548 |
| `CommentsFromSupporter` |  |
| `HandlingDate` | 2022-03-04 10:42:28.453000 |
| `SourceClass` | NULL |
| `ScreenShot` | NULL |
| `SupportClassID` | 245313181 |
| `SupportKategorieID` | 4021722 |
| `Solution` | <div></div> |
| `Priority` | 0 |
| `ReleaseNo` |  |
| `SDObjType` | 1 |
| `SDObjMemberCode` | 1584901781 |
| `AnsprechpCode` | 0 |
| `ProjektCode` | 0 |
| `Supporter` | Andreas Stolarczyk |
| `CompanyM` | 0 |
| `CompanyID` | NULL |
| `SupporterID` | 888797748 |
| `ArtikelCode` | 0 |
| `Seriennummer` | NULL |
| `Abschlussdatum` | NULL |
| `SupportKategorie2ID` | 0 |
| `SupporterID2` | 0 |
| `Status2` | 0 |
| `Abschlussdatum2` | NULL |
| `EskalationsStufe` | 0 |
| `Wiedervorlage` | 2022-04-30 00:00:00 |
| `PosCode` | 0 |
| `BZObjType` | 5 |
| `BZObjMemberCode` | 0 |
| `WartungsobjektCode` | 0 |
| `PosCodeWartung` | 0 |
| `DatumUtc` | NULL |
| `ZeitbedarfTicket` | 0.0 |
| `ProjektePlanungCode` | 0 |
| `ErinnernDate` | NULL |
| `FolderSubKey` | 2022/03/04 |
| `LookupCodeProzessAbschnitt` | NULL |
| `Ertrag` | 0.0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `Sprint` | NULL |
| `LieferscheinCode` | NULL |
| `LieferscheinPositionenCode` | NULL |
| `ChecklistPosCode` | NULL |
| `Feld1` | NULL |

---

## dbo.SupportAnhang

<a name="dboSupportAnhang"></a>

**Anzahl Datensätze:** 130

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | uniqueidentifier | - | ❌ | - |
| `SupportID` | uniqueidentifier | - | ✅ | - |
| `Name` | nvarchar | 500 | ✅ | - |
| `Datei` | image | 2147483647 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `LastModificationDate` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Code` | int | - | ❌ | ((0)) |
| `LieferterminAbgehend` | datetime | - | ✅ | - |
| `Filename` | nvarchar | 500 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `Anzeigename` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `ID` | 75F2E3B5-FB96-4995-8E61-EE4473C8CC54 |
| `SupportID` | 7720CF06-95EC-4A32-9EB4-101024ED6A56 |
| `Name` | Formular Datensatz empfangen.msg |
| `Datei` | NULL |
| `Notiz` |  |
| `LastModificationDate` | 2022-01-19 13:34:37.867000 |
| `BenutzerCode` | 22209630 |
| `Code` | 0 |
| `LieferterminAbgehend` | NULL |
| `Filename` | 2022\01\19 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `Anzeigename` | NULL |

---

## dbo.SupportArtikel

<a name="dboSupportArtikel"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SupportID` | uniqueidentifier | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `Seriennummer` | nvarchar | 100 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SupportChecklistenpunktMark

<a name="dboSupportChecklistenpunktMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ChecklistenpunktCode` | int | - | ✅ | - |
| `SupportID` | uniqueidentifier | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `LastModificationDate` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SupportClasses

<a name="dboSupportClasses"></a>

**Anzahl Datensätze:** 16

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | int | - | ❌ | - |
| `Name` | nvarchar | 250 | ✅ | - |
| `Kontext` | nvarchar | 250 | ✅ | - |
| `Form` | nvarchar | 250 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `ID` | 951752 |
| `Name` | Verglasung |
| `Kontext` | NULL |
| `Form` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.SupportKategorien

<a name="dboSupportKategorien"></a>

**Anzahl Datensätze:** 10

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | int | - | ❌ | - |
| `Name` | nvarchar | 250 | ✅ | - |
| `Code` | int | - | ❌ | ((0)) |
| `minJeTicket` | int | - | ✅ | - |
| `Farbe` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `ID` | 4021722 |
| `Name` | 01 Vertrieb/Anfragen |
| `Code` | 0 |
| `minJeTicket` | 0 |
| `Farbe` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.SupportMark

<a name="dboSupportMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `NewTicketNo` | int | - | ✅ | - |
| `OldTicketNo` | int | - | ✅ | - |
| `SupporterCode` | int | - | ✅ | - |
| `CompanyCode` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |
| `ObjID` | nvarchar | 4000 | ✅ | - |
| `SupportID` | uniqueidentifier | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.SupportPositionen

<a name="dboSupportPositionen"></a>

**Anzahl Datensätze:** 1,156

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SupportID` | uniqueidentifier | - | ✅ | - |
| `Name` | nvarchar | 50 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Supporter` | nvarchar | 100 | ✅ | - |
| `Art` | int | - | ✅ | ((0)) |
| `DatumUtc` | datetime | - | ✅ | - |
| `Aenderungen` | ntext | 1073741823 | ✅ | - |
| `Veroeffentlichen` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 951752 |
| `SupportID` | 3C961849-5C15-486A-A7BC-8522C52C10AE |
| `Name` | NULL |
| `Datum` | 2022-02-14 08:44:49.793000 |
| `Notiz` | [S1 IN BEARBEITUNG] |
| `BCode` | 39819682 |
| `Supporter` | Ehbauer Tanja |
| `Art` | 0 |
| `DatumUtc` | NULL |
| `Aenderungen` | NULL |
| `Veroeffentlichen` | NULL |

---

## dbo.SupportSupporter

<a name="dboSupportSupporter"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Name` | nvarchar | 100 | ✅ | - |
| `Photo` | varbinary | 8000 | ✅ | - |
| `Mail` | nvarchar | 50 | ✅ | - |
| `Telefon` | nvarchar | 50 | ✅ | - |
| `Spezialgebiete` | nvarchar | 250 | ✅ | - |
| `Vorname` | nvarchar | 50 | ✅ | - |
| `Nachname` | nvarchar | 50 | ✅ | - |
| `IsGroup` | int | - | ✅ | - |
| `Anrede` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.TapiCalls

<a name="dboTapiCalls"></a>

**Anzahl Datensätze:** 23,272

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `CallerIDNumber` | nvarchar | 100 | ✅ | - |
| `CallDate` | datetime | - | ✅ | - |
| `LineBCode` | int | - | ✅ | - |
| `LineNumber` | nvarchar | 50 | ✅ | - |
| `IsIncoming` | int | - | ✅ | - |
| `ContactName` | nvarchar | 250 | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `IncomingBCode` | int | - | ✅ | - |
| `AnsprechpCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1103961714 |
| `CallerIDNumber` | 23 |
| `CallDate` | 2021-12-02 10:28:00 |
| `LineBCode` | 95299245 |
| `LineNumber` |  |
| `IsIncoming` | -1 |
| `ContactName` |  |
| `SDObjMemberCode` | 0 |
| `SDObjType` | 0 |
| `BZObjType` | 0 |
| `BZObjMemberCode` | 0 |
| `IncomingBCode` | 0 |
| `AnsprechpCode` | 0 |

---

## dbo.Teilnehmer

<a name="dboTeilnehmer"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `KNBerichtCode` | int | - | ✅ | - |
| `TeilnehmerType` | int | - | ✅ | ((0)) |
| `Name` | nvarchar | 35 | ✅ | - |
| `MitarbeiterCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `Kontaktcode` | int | - | ✅ | - |
| `KontaktType` | int | - | ✅ | - |
| `Code` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Teilrechnungslogik

<a name="dboTeilrechnungslogik"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | -1 | ✅ | - |
| `Langtext` | nvarchar | -1 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 83341688 |
| `Name` | Anzahlung 30% |
| `Langtext` | 0 |

---

## dbo.TeilrechnungslogikDetails

<a name="dboTeilrechnungslogikDetails"></a>

**Anzahl Datensätze:** 7

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `TeilrechnungslogikCode` | int | - | ✅ | - |
| `Tage` | nvarchar | -1 | ✅ | ('""') |
| `Prozent` | float | - | ✅ | - |
| `Reihenfolge` | int | - | ✅ | - |
| `Notiz` | nvarchar | 4000 | ✅ | ('') |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 2017330151 |
| `TeilrechnungslogikCode` | 83341688 |
| `Tage` | 7 |
| `Prozent` | 30.0 |
| `Reihenfolge` | 1 |
| `Notiz` | 30% Anzahlung nach Auftragserteilung |

---

## dbo.Telefonate

<a name="dboTelefonate"></a>

**Anzahl Datensätze:** 2,046

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `KNBerichtCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | - |
| `SN` | nvarchar | 50 | ✅ | - |
| `ParentCode` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `BErstellt` | datetime | - | ✅ | - |
| `ModificationDate` | datetime | - | ✅ | - |
| `ErinnernDate` | datetime | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `KostenerfassungCode` | int | - | ✅ | ((0)) |
| `Status` | int | - | ✅ | - |
| `BeginTime` | datetime | - | ✅ | - |
| `EndTime` | datetime | - | ✅ | - |
| `Titel` | nvarchar | 100 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `CreatedByUserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 23208050 |
| `BenutzerCode` | 22209630 |
| `SDObjType` | 0 |
| `SDObjMemberCode` | 256239204 |
| `Datum` | 2022-03-18 11:35:11.777000 |
| `AnsprpCode` | 550247937 |
| `Notiz` |  |
| `KNBerichtCode` | 0 |
| `ProjektCode` | 0 |
| `SN` | NULL |
| `ParentCode` | 0 |
| `BCode` | 22209630 |
| `BErstellt` | 2022-03-18 11:35:24.373000 |
| `ModificationDate` | 2022-03-18 11:35:24.373000 |
| `ErinnernDate` | NULL |
| `ObjGrCode` | 0 |
| `KostenerfassungCode` | 0 |
| `Status` | NULL |
| `BeginTime` | 2022-03-18 11:35:11.777000 |
| `EndTime` | 2022-03-18 11:35:11.777000 |
| `Titel` |  |
| `ArtikelCode` | 0 |
| `ProjektePlanungCode` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `CreatedByUserCode` | NULL |

---

## dbo.TelefonateAnhang

<a name="dboTelefonateAnhang"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `ObjCode` | int | - | ✅ | ((0)) |
| `Datei` | nvarchar | 255 | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |
| `OriginalFileName` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 835192656 |
| `Notiz` |  |
| `Datum` | 2019-11-11 14:46:25.180000 |
| `BenutzerCode` | 0 |
| `ObjCode` | 33176595 |
| `Datei` | R19606 - P19324 - Jokiel - BS - 2019.11.11.rtf |
| `Briefdatei` | <binary data, 82865 bytes> |
| `OriginalFileName` | NULL |

---

## dbo.TelefonatHistorie

<a name="dboTelefonatHistorie"></a>

**Anzahl Datensätze:** 6,599

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `KNCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Aktion` | nvarchar | 4000 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Person` | nvarchar | 4000 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 142116 |
| `KNCode` | 126228238 |
| `BCode` | 59088549 |
| `Aktion` | Neu angelegt von Susann Zielinski |
| `Datum` | 2023-06-22 11:11:54.463000 |
| `Person` | Susann Zielinski |

---

## dbo.TempDatei

<a name="dboTempDatei"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Dateiname` | nvarchar | 100 | ✅ | ('') |
| `Datum` | datetime | - | ✅ | - |
| `Data` | varbinary | -1 | ✅ | - |
| `ObjectIdentificationHash` | nvarchar | 64 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Termine

<a name="dboTermine"></a>

**Anzahl Datensätze:** 9,906

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `KNBerichtCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | - |
| `Erinnern` | int | - | ✅ | ((0)) |
| `Privat` | int | - | ✅ | ((0)) |
| `Anfangsdatum` | datetime | - | ✅ | - |
| `Enddatum` | datetime | - | ✅ | - |
| `ErledigtAm` | datetime | - | ✅ | - |
| `ErledigtVon` | int | - | ✅ | - |
| `Ganztägig` | int | - | ✅ | ((0)) |
| `ImHaus` | int | - | ✅ | ((0)) |
| `Text` | ntext | 1073741823 | ✅ | - |
| `Wegbeschreibung` | ntext | 1073741823 | ✅ | - |
| `Entfernung` | nvarchar | 10 | ✅ | - |
| `Treffpunkt` | nvarchar | 500 | ✅ | - |
| `SN` | nvarchar | 50 | ✅ | - |
| `ParentCode` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `BErstellt` | datetime | - | ✅ | - |
| `ModificationDate` | datetime | - | ✅ | - |
| `ErinnernDate` | datetime | - | ✅ | - |
| `FarbenCode` | int | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `Löschvormerkung` | int | - | ✅ | - |
| `Outlook_EntryID` | nvarchar | 250 | ✅ | - |
| `PositionsCode` | int | - | ✅ | ((0)) |
| `UrlaubCode` | int | - | ✅ | ((0)) |
| `BZObjType` | int | - | ✅ | ((0)) |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `StornoDatum` | datetime | - | ✅ | - |
| `StornoGrund` | nvarchar | 50 | ✅ | - |
| `AnzahlTageProjektplanung` | float | - | ✅ | ((0)) |
| `KostenerfassungCode` | int | - | ✅ | ((0)) |
| `Priorität` | int | - | ✅ | - |
| `Titel` | nvarchar | 100 | ✅ | - |
| `Color` | nvarchar | 50 | ✅ | - |
| `Transfer` | int | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `ProjektePlanungDauer` | float | - | ✅ | - |
| `ProjektePlanungArt` | int | - | ✅ | - |
| `Serientermin` | int | - | ✅ | - |
| `SerienterminDefinitionCode` | int | - | ✅ | - |
| `ExchangeUID` | nvarchar | 200 | ✅ | - |
| `ExchangeSerientermin` | int | - | ✅ | - |
| `OutlookID` | nvarchar | 200 | ✅ | - |
| `ReisekostenabrechnungCode` | int | - | ✅ | - |
| `ExchangeConversationUid` | nvarchar | 200 | ✅ | ('') |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `EchterTermin` | int | - | ✅ | ((0)) |
| `TicketID` | uniqueidentifier | - | ✅ | - |
| `AuftragCode` | int | - | ✅ | - |
| `RechnungCode` | int | - | ✅ | - |
| `TerminAbrechenbar` | int | - | ✅ | - |
| `Unsichtbar` | int | - | ✅ | - |
| `LieferscheinCode` | int | - | ✅ | - |
| `ExchangeMeeting` | int | - | ✅ | - |
| `ExchangeTeilnehmer` | nvarchar | -1 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `MeetingUrl` | nvarchar | 1000 | ✅ | - |
| `IcsUid` | uniqueidentifier | - | ✅ | - |
| `LieferscheinPositionenCode` | int | - | ✅ | - |
| `HtmlNotiz` | nvarchar | -1 | ✅ | - |
| `InvitationSent` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 11911075 |
| `BenutzerCode` | 888797748 |
| `SDObjType` | 1 |
| `SDObjMemberCode` | 228241155 |
| `Datum` | 2023-11-02 14:30:00 |
| `AnsprpCode` | 0 |
| `Notiz` | Türblätter und Zargen --> Bestellaufmaß nehmen Angebot 230582 |
| `KNBerichtCode` | 0 |
| `ProjektCode` | 878757116 |
| `Erinnern` | 0 |
| `Privat` | 0 |
| `Anfangsdatum` | NULL |
| `Enddatum` | 2023-11-02 16:00:00 |
| `ErledigtAm` | NULL |
| `ErledigtVon` | NULL |
| `Ganztägig` | 0 |
| `ImHaus` | 0 |
| `Text` | NULL |
| `Wegbeschreibung` | NULL |
| `Entfernung` | NULL |
| `Treffpunkt` | Fallweg 37, 92224 Amberg |
| `SN` | NULL |
| `ParentCode` | 0 |
| `BCode` | 59088549 |
| `BErstellt` | 2023-10-31 09:28:09.910000 |
| `ModificationDate` | 2023-11-14 08:52:12.960000 |
| `ErinnernDate` | 2023-11-02 14:30:00 |
| `FarbenCode` | 6 |
| `ObjGrCode` | 0 |
| `Löschvormerkung` | 0 |
| `Outlook_EntryID` | NULL |
| `PositionsCode` | 0 |
| `UrlaubCode` | 0 |
| `BZObjType` | 0 |
| `BZObjMemberCode` | 0 |
| `StornoDatum` | NULL |
| `StornoGrund` | NULL |
| `AnzahlTageProjektplanung` | 0.0 |
| `KostenerfassungCode` | 0 |
| `Priorität` | 0 |
| `Titel` | Lehmann Bernd | Amberg | Bestellaufmaß |
| `Color` | NULL |
| `Transfer` | -1 |
| `ProjektePlanungCode` | 0 |
| `ProjektePlanungDauer` | 0.0 |
| `ProjektePlanungArt` | 0 |
| `Serientermin` | 0 |
| `SerienterminDefinitionCode` | 0 |
| `ExchangeUID` | AAMkADBhOGYyNDRkLTZkNDAtNGFlNy04YjNkLTQ5NDc5NzQ1OGVmYQBGAAAAAAC4E00hqf2URpP+YtY9DS/1BwDCj/hLTgN6Sp1I... (total: 152 chars) |
| `ExchangeSerientermin` | 0 |
| `OutlookID` |  |
| `ReisekostenabrechnungCode` | 0 |
| `ExchangeConversationUid` |  |
| `ArtikelCode` | 0 |
| `EchterTermin` | -1 |
| `TicketID` | 00000000-0000-0000-0000-000000000000 |
| `AuftragCode` | 0 |
| `RechnungCode` | 0 |
| `TerminAbrechenbar` | 0 |
| `Unsichtbar` | 0 |
| `LieferscheinCode` | 0 |
| `ExchangeMeeting` | 0 |
| `ExchangeTeilnehmer` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `MeetingUrl` |  |
| `IcsUid` | 00000000-0000-0000-0000-000000000000 |
| `LieferscheinPositionenCode` | 0 |
| `HtmlNotiz` | NULL |
| `InvitationSent` | NULL |

---

## dbo.Termine_BAK20221012

<a name="dboTermine_BAK20221012"></a>

**Anzahl Datensätze:** 2,505

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `AnsprpCode` | int | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `KNBerichtCode` | int | - | ✅ | - |
| `ProjektCode` | int | - | ✅ | - |
| `Erinnern` | int | - | ✅ | - |
| `Privat` | int | - | ✅ | - |
| `Anfangsdatum` | datetime | - | ✅ | - |
| `Enddatum` | datetime | - | ✅ | - |
| `ErledigtAm` | datetime | - | ✅ | - |
| `ErledigtVon` | int | - | ✅ | - |
| `Ganztägig` | int | - | ✅ | - |
| `ImHaus` | int | - | ✅ | - |
| `Text` | ntext | 1073741823 | ✅ | - |
| `Wegbeschreibung` | ntext | 1073741823 | ✅ | - |
| `Entfernung` | nvarchar | 10 | ✅ | - |
| `Treffpunkt` | nvarchar | 500 | ✅ | - |
| `SN` | nvarchar | 50 | ✅ | - |
| `ParentCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `BErstellt` | datetime | - | ✅ | - |
| `ModificationDate` | datetime | - | ✅ | - |
| `ErinnernDate` | datetime | - | ✅ | - |
| `FarbenCode` | int | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `Löschvormerkung` | int | - | ✅ | - |
| `Outlook_EntryID` | nvarchar | 250 | ✅ | - |
| `PositionsCode` | int | - | ✅ | - |
| `UrlaubCode` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `StornoDatum` | datetime | - | ✅ | - |
| `StornoGrund` | nvarchar | 50 | ✅ | - |
| `AnzahlTageProjektplanung` | float | - | ✅ | - |
| `KostenerfassungCode` | int | - | ✅ | - |
| `Priorität` | int | - | ✅ | - |
| `Titel` | nvarchar | 100 | ✅ | - |
| `Color` | nvarchar | 50 | ✅ | - |
| `Transfer` | int | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `ProjektePlanungDauer` | float | - | ✅ | - |
| `ProjektePlanungArt` | int | - | ✅ | - |
| `Serientermin` | int | - | ✅ | - |
| `SerienterminDefinitionCode` | int | - | ✅ | - |
| `ExchangeUID` | nvarchar | 200 | ✅ | - |
| `ExchangeSerientermin` | int | - | ✅ | - |
| `OutlookID` | nvarchar | 200 | ✅ | - |
| `ReisekostenabrechnungCode` | int | - | ✅ | - |
| `ExchangeConversationUid` | nvarchar | 200 | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `EchterTermin` | int | - | ✅ | - |
| `TicketID` | uniqueidentifier | - | ✅ | - |
| `AuftragCode` | int | - | ✅ | - |
| `RechnungCode` | int | - | ✅ | - |
| `TerminAbrechenbar` | int | - | ✅ | - |
| `Unsichtbar` | int | - | ✅ | - |
| `LieferscheinCode` | int | - | ✅ | - |
| `ExchangeMeeting` | int | - | ✅ | - |
| `ExchangeTeilnehmer` | nvarchar | -1 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `MeetingUrl` | nvarchar | 1000 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 90252245 |
| `BenutzerCode` | 39819682 |
| `SDObjType` | 1 |
| `SDObjMemberCode` | 0 |
| `Datum` | 2021-12-22 00:00:00 |
| `AnsprpCode` | 0 |
| `Notiz` |  |
| `KNBerichtCode` | 0 |
| `ProjektCode` | 0 |
| `Erinnern` | 0 |
| `Privat` | 0 |
| `Anfangsdatum` | NULL |
| `Enddatum` | 2021-12-22 23:59:00 |
| `ErledigtAm` | NULL |
| `ErledigtVon` | NULL |
| `Ganztägig` | -1 |
| `ImHaus` | 0 |
| `Text` | NULL |
| `Wegbeschreibung` | NULL |
| `Entfernung` | NULL |
| `Treffpunkt` | NULL |
| `SN` | NULL |
| `ParentCode` | 0 |
| `BCode` | 39819682 |
| `BErstellt` | 2021-12-01 13:23:01.480000 |
| `ModificationDate` | 2021-12-21 14:28:53.070000 |
| `ErinnernDate` | NULL |
| `FarbenCode` | 5 |
| `ObjGrCode` | 0 |
| `Löschvormerkung` | 0 |
| `Outlook_EntryID` | NULL |
| `PositionsCode` | 0 |
| `UrlaubCode` | 0 |
| `BZObjType` | 0 |
| `BZObjMemberCode` | 0 |
| `StornoDatum` | NULL |
| `StornoGrund` | NULL |
| `AnzahlTageProjektplanung` | 0.0 |
| `KostenerfassungCode` | 0 |
| `Priorität` | 0 |
| `Titel` | Urlaub |
| `Color` | NULL |
| `Transfer` | -1 |
| `ProjektePlanungCode` | 0 |
| `ProjektePlanungDauer` | 0.0 |
| `ProjektePlanungArt` | 0 |
| `Serientermin` | 0 |
| `SerienterminDefinitionCode` | 0 |
| `ExchangeUID` | NULL |
| `ExchangeSerientermin` | NULL |
| `OutlookID` |  |
| `ReisekostenabrechnungCode` | 0 |
| `ExchangeConversationUid` |  |
| `ArtikelCode` | 0 |
| `EchterTermin` | -1 |
| `TicketID` | 00000000-0000-0000-0000-000000000000 |
| `AuftragCode` | 0 |
| `RechnungCode` | 0 |
| `TerminAbrechenbar` | 0 |
| `Unsichtbar` | 0 |
| `LieferscheinCode` | 0 |
| `ExchangeMeeting` | 0 |
| `ExchangeTeilnehmer` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `MeetingUrl` | NULL |

---

## dbo.TermineAnhang

<a name="dboTermineAnhang"></a>

**Anzahl Datensätze:** 108

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `ObjCode` | int | - | ✅ | ((0)) |
| `Datei` | nvarchar | 500 | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |
| `OriginalFileName` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 18221570 |
| `Notiz` |  |
| `Datum` | 2021-12-07 16:36:04.677000 |
| `BenutzerCode` | 0 |
| `ObjCode` | 391146716 |
| `Datei` | Anschreiben.pdf |
| `Briefdatei` | <binary data, 143175 bytes> |
| `OriginalFileName` | NULL |

---

## dbo.TermineFarben

<a name="dboTermineFarben"></a>

**Anzahl Datensätze:** 21

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 50 | ✅ | - |
| `Farbe` | nvarchar | 50 | ✅ | - |
| `LieferantenCode` | int | - | ✅ | ((0)) |
| `Color` | nvarchar | 50 | ✅ | - |
| `AusserHaus` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 5 |
| `Name` | Urlaub |
| `Farbe` | 65280,0 |
| `LieferantenCode` | 0 |
| `Color` | -3584,0 |
| `AusserHaus` | 0 |

---

## dbo.TermineTeilnehmer

<a name="dboTermineTeilnehmer"></a>

**Anzahl Datensätze:** 11,830

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `TerminCode` | int | - | ✅ | ((0)) |
| `Anzeigename` | nvarchar | 50 | ✅ | - |
| `BenutzerTeilnehmerCode` | int | - | ✅ | ((0)) |
| `SDObjmembercode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `AnsprechpCode` | int | - | ✅ | ((0)) |
| `Benachrichtigung` | datetime | - | ✅ | - |
| `Besprechungsanfrage` | datetime | - | ✅ | - |
| `Zusage` | datetime | - | ✅ | - |
| `Absage` | datetime | - | ✅ | - |
| `Terminbestätigung` | datetime | - | ✅ | - |
| `BCode` | int | - | ✅ | ((0)) |
| `Angelegt` | datetime | - | ✅ | - |
| `Entfernt` | datetime | - | ✅ | - |
| `Notiz` | nvarchar | 255 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 6311153 |
| `TerminCode` | 240250121 |
| `Anzeigename` | Mariusz Prokopiak |
| `BenutzerTeilnehmerCode` | 18817655 |
| `SDObjmembercode` | 0 |
| `SDObjType` | 0 |
| `AnsprechpCode` | 0 |
| `Benachrichtigung` | NULL |
| `Besprechungsanfrage` | NULL |
| `Zusage` | NULL |
| `Absage` | NULL |
| `Terminbestätigung` | NULL |
| `BCode` | 888797748 |
| `Angelegt` | 2021-12-03 14:53:33.970000 |
| `Entfernt` | NULL |
| `Notiz` | NULL |

---

## dbo.TerminHistorie

<a name="dboTerminHistorie"></a>

**Anzahl Datensätze:** 24,355

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KNCode` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `Aktion` | nvarchar | 250 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Person` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 88656158 |
| `KNCode` | 528636125 |
| `BCode` | 888797748 |
| `Aktion` | Neu angelegt von Andreas Stolarczyk |
| `Datum` | 2021-12-03 14:52:01.310000 |
| `Person` | Andreas Stolarczyk |

---

## dbo.Textbausteine

<a name="dboTextbausteine"></a>

**Anzahl Datensätze:** 142

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 50 | ✅ | - |
| `GrCode` | int | - | ✅ | - |
| `Text` | ntext | 1073741823 | ✅ | - |
| `TextK` | ntext | 1073741823 | ✅ | - |
| `ListFlag` | int | - | ✅ | ((0)) |
| `Mark` | nvarchar | 1 | ✅ | - |
| `RTFText` | ntext | 1073741823 | ✅ | - |
| `LetzteÄnderung` | datetime | - | ✅ | - |
| `Dokument` | int | - | ✅ | - |
| `Datei` | image | 2147483647 | ✅ | - |
| `Shortcut` | nvarchar | 10 | ✅ | ('') |
| `ERPStandardTextbausteinType` | int | - | ✅ | ((0)) |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `Name` | 2.1 Kopftext Angebot |
| `GrCode` | 1498868221 |
| `Text` | ? a ????``???
?????????????????????????????4(?   ?  ?????7??n        ?5(?   ?  ????n    ... (total: 346 chars) |
| `TextK` | (anrede)



wir danken für Ihre Anfrage und unterbreiten Ihnen unser unverbindliches Angebot gemäß u... (total: 174 chars) |
| `ListFlag` | 0 |
| `Mark` | NULL |
| `RTFText` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat{\fonttbl{\f0\fswiss\fprq2\fcharset0 Arial;}{\f1\fnil Arial;... (total: 439 chars) |
| `LetzteÄnderung` | NULL |
| `Dokument` | 0 |
| `Datei` | NULL |
| `Shortcut` | NULL |
| `ERPStandardTextbausteinType` | 600 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.TextbausteineGr

<a name="dboTextbausteineGr"></a>

**Anzahl Datensätze:** 20

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 40 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `GrCode` | 1915238 |
| `GrIndex` | 5 |
| `GrLevel` | 2 |
| `GrName` | Funktionstür |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.TextbausteineMark

<a name="dboTextbausteineMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BenutzerCode` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.TextbausteineÜbersetzung

<a name="dboTextbausteineÜbersetzung"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `TBSCode` | int | - | ✅ | ((0)) |
| `Text` | ntext | 1073741823 | ✅ | - |
| `SprachCode` | int | - | ✅ | ((0)) |
| `RTFText` | ntext | 1073741823 | ✅ | ('') |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1098521357 |
| `TBSCode` | 128082591 |
| `Text` |  |
| `SprachCode` | 13 |
| `RTFText` | {\rtf1\ansi\ansicpg1252\deff0\nouicompat\deflang1031{\fonttbl{\f0\fnil Arial;}}

{\*\generator Riche... (total: 154 chars) |

---

## dbo.Textvorgaben

<a name="dboTextvorgaben"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ObjType` | int | - | ✅ | - |
| `Originaltext` | nvarchar | 4000 | ✅ | - |
| `Uebersetzung` | nvarchar | 4000 | ✅ | - |
| `Sprachcode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ThemenGr

<a name="dboThemenGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrName` | nvarchar | 70 | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrIndex` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ThemenGrMark

<a name="dboThemenGrMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `ObjCode` | int | - | ✅ | - |
| `ObjType` | int | - | ✅ | - |
| `ThemenCode` | int | - | ✅ | - |
| `SDObjMemberCode` | int | - | ✅ | - |
| `SDObjType` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ThemenMark

<a name="dboThemenMark"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ThemenCode` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |
| `ObjArt` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Thumbnails

<a name="dboThumbnails"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Filename` | nvarchar | 200 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `ObjectCode` | int | - | ✅ | - |
| `ObjectId` | uniqueidentifier | - | ✅ | - |
| `ObjectType` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.TicketFilter

<a name="dboTicketFilter"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Filter` | nvarchar | -1 | ✅ | - |
| `Global` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 255 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.TicketListeFilter

<a name="dboTicketListeFilter"></a>

**Anzahl Datensätze:** 4

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Name` | nvarchar | 200 | ✅ | ('') |
| `Data` | nvarchar | -1 | ✅ | ('') |
| `LastModification` | datetime | - | ✅ | - |
| `OnlineTicketListe` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Id` | 9D170908-3C8A-4917-BAEB-21C13AB8F821 |
| `BenutzerCode` | 0 |
| `Name` | 02 Reklamationen Komplett |
| `Data` | [TicketArtCode] = 1171234537 |
| `LastModification` | 2022-01-25 10:46:34.430000 |
| `OnlineTicketListe` | 0 |

---

## dbo.Tour

<a name="dboTour"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Bezeichnung` | nvarchar | 500 | ✅ | ('') |
| `Wochentag` | int | - | ✅ | ((0)) |
| `Nummer` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.UeberstundenAuszahlung

<a name="dboUeberstundenAuszahlung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((0)) |
| `BenutzerCode` | int | - | ✅ | - |
| `Jahr` | int | - | ✅ | - |
| `Anzahl` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.UeberstundenUebertrag

<a name="dboUeberstundenUebertrag"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((0)) |
| `BenutzerCode` | int | - | ✅ | - |
| `Jahr` | int | - | ✅ | - |
| `Anzahl` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Umbuchungen

<a name="dboUmbuchungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `ArtCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Art` | int | - | ✅ | ((0)) |
| `Beschreibung` | nvarchar | 100 | ✅ | - |
| `Anzahl` | float | - | ✅ | ((0)) |
| `QuellLagerCode` | int | - | ✅ | - |
| `ZielLagerCode` | int | - | ✅ | - |
| `Seriennummer` | nvarchar | 100 | ✅ | - |
| `BzObjType` | int | - | ✅ | ((0)) |
| `BzObjMemberCode` | int | - | ✅ | ((0)) |
| `PositionCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.UmsatzKostenplanHeader

<a name="dboUmsatzKostenplanHeader"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `DatumLetzteÄnderung` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |
| `Ratenzahlungsplan` | int | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `VerteilenAufIndex` | int | - | ✅ | - |
| `BeginnenAb` | datetime | - | ✅ | - |
| `Anzahl` | int | - | ✅ | - |
| `Splitten1Prozent` | int | - | ✅ | - |
| `Splitten2Prozent` | int | - | ✅ | - |
| `Splitten3Prozent` | int | - | ✅ | - |
| `Splitten4Prozent` | int | - | ✅ | - |
| `Splitten5Prozent` | int | - | ✅ | - |
| `Splitten6Prozent` | int | - | ✅ | - |
| `Splitten7Prozent` | int | - | ✅ | - |
| `Splitten8Prozent` | int | - | ✅ | - |
| `Splitten9Prozent` | int | - | ✅ | - |
| `MwstInErsteZeile` | int | - | ✅ | - |
| `ZeilenberechnungenAus` | int | - | ✅ | - |
| `VorgabeMwst` | float | - | ✅ | - |
| `VorgabeKostenstelle` | int | - | ✅ | - |
| `VorgabeKonto` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Umsatzplan

<a name="dboUmsatzplan"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Rechnungsdatum` | datetime | - | ✅ | - |
| `Summe` | float | - | ✅ | ((0)) |
| `Nettosumme` | float | - | ✅ | - |
| `Mwstsumme` | float | - | ✅ | - |
| `Mwst` | float | - | ✅ | - |
| `Bemerkung` | ntext | 1073741823 | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `BZObjType` | int | - | ✅ | ((0)) |
| `RechnungCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Verrechnet` | int | - | ✅ | - |
| `Projektcode` | int | - | ✅ | ((0)) |
| `Status` | int | - | ✅ | ((0)) |
| `SachKNummer` | int | - | ✅ | ((0)) |
| `PosCode` | int | - | ✅ | - |
| `Nummer` | int | - | ✅ | - |
| `Prozent` | int | - | ✅ | - |
| `PlanKostenstNummer` | int | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 132206178 |
| `Rechnungsdatum` | 2022-04-29 00:00:00 |
| `Summe` | 0.0 |
| `Nettosumme` | 2786.66 |
| `Mwstsumme` | 0.0 |
| `Mwst` | 0.0 |
| `Bemerkung` | AS 08.04.2022 |
| `BZObjMemberCode` | 30113146 |
| `BZObjType` | 255 |
| `RechnungCode` | 0 |
| `BenutzerCode` | 0 |
| `Verrechnet` | 0 |
| `Projektcode` | 0 |
| `Status` | 0 |
| `SachKNummer` | 0 |
| `PosCode` | 0 |
| `Nummer` | 0 |
| `Prozent` | 0 |
| `PlanKostenstNummer` | 0 |
| `ProjektePlanungCode` | 0 |
| `ArtikelCode` | 0 |

---

## dbo.UnreadNotifications

<a name="dboUnreadNotifications"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `NotificationEntityId` | uniqueidentifier | - | ✅ | - |
| `NotificationType` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Urlaub

<a name="dboUrlaub"></a>

**Anzahl Datensätze:** 2,227

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `MitarbeiterCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Menge` | real | - | ✅ | ((0)) |
| `Notiz` | nvarchar | 50 | ✅ | - |
| `DatevArtLookUpCode` | int | - | ✅ | - |
| `UrlaubsArt` | int | - | ✅ | - |
| `DatumAntrag` | datetime | - | ✅ | - |
| `DatumGenehmigung` | datetime | - | ✅ | - |
| `BCodeGenehmigung` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `VacationDayPosition` | int | - | ✅ | - |
| `VacationRequestId` | uniqueidentifier | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 21331218 |
| `MitarbeiterCode` | 22526179 |
| `Datum` | 2025-08-22 00:00:00 |
| `Menge` | 1.0 |
| `Notiz` | NULL |
| `DatevArtLookUpCode` | 0 |
| `UrlaubsArt` | 0 |
| `DatumAntrag` | NULL |
| `DatumGenehmigung` | NULL |
| `BCodeGenehmigung` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `VacationDayPosition` | NULL |
| `VacationRequestId` | NULL |

---

## dbo.UrlaubsAnsprüche

<a name="dboUrlaubsAnsprüche"></a>

**Anzahl Datensätze:** 77

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `MitarbeiterCode` | int | - | ✅ | ((0)) |
| `Jahr` | int | - | ✅ | ((0)) |
| `Anspruch` | real | - | ✅ | ((0)) |
| `Vorjahr` | real | - | ✅ | ((0)) |
| `BisJetzt` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 175559725 |
| `MitarbeiterCode` | 888797748 |
| `Jahr` | 2021 |
| `Anspruch` | 30.0 |
| `Vorjahr` | 1.0 |
| `BisJetzt` | 0 |

---

## dbo.UserCollection

<a name="dboUserCollection"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Name` | nvarchar | 70 | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.UserCollectionMember

<a name="dboUserCollectionMember"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `UserCode` | int | - | ✅ | - |
| `UserCollectionId` | uniqueidentifier | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.UserExit

<a name="dboUserExit"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ObjType` | int | - | ✅ | ((0)) |
| `Datei` | nvarchar | 200 | ✅ | - |
| `Parameter` | nvarchar | 200 | ✅ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `Synchron` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.VacationRequest

<a name="dboVacationRequest"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `CreatedByUserCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `Status` | int | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `UserCode` | int | - | ✅ | - |
| `ApprovalUserCode` | int | - | ✅ | - |
| `DateFrom` | datetime | - | ✅ | - |
| `DateTo` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Verkaufschancen

<a name="dboVerkaufschancen"></a>

**Anzahl Datensätze:** 336

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `BCode2` | int | - | ✅ | ((0)) |
| `GrCode` | int | - | ✅ | ((0)) |
| `DatumErstellt` | datetime | - | ✅ | - |
| `DatumEntscheidung` | datetime | - | ✅ | - |
| `DatumNächsteBewertung` | datetime | - | ✅ | - |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `BZObjType` | int | - | ✅ | ((0)) |
| `Wert` | float | - | ✅ | ((0)) |
| `Name` | nvarchar | 70 | ✅ | - |
| `Beschreibung` | ntext | 1073741823 | ✅ | - |
| `Mitbewerber` | nvarchar | 255 | ✅ | - |
| `StatusCode` | int | - | ✅ | ((0)) |
| `Art` | int | - | ✅ | ((0)) |
| `WahrscheinlichkeitProzent` | int | - | ✅ | ((0)) |
| `Tendenz` | int | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `AnsprechpCode` | int | - | ✅ | ((0)) |
| `Zuordnungsart` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | ((0)) |
| `Info` | nvarchar | 255 | ✅ | - |
| `Status` | int | - | ✅ | ((0)) |
| `WährungCode` | int | - | ✅ | ((0)) |
| `NaechsterKontakt` | datetime | - | ✅ | - |
| `ErstellerBenutzerCode` | int | - | ✅ | - |
| `KostenStCode` | int | - | ✅ | - |
| `WertAuftrag` | float | - | ✅ | - |
| `Eingefroren` | int | - | ✅ | ((0)) |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `ErwarteteKosten` | float | - | ✅ | - |
| `CurrentRatingId` | uniqueidentifier | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1282879801 |
| `SDObjMemberCode` | 1549107844 |
| `BCode` | 22209630 |
| `BCode2` | 22209630 |
| `GrCode` | 0 |
| `DatumErstellt` | 2022-02-11 00:00:00 |
| `DatumEntscheidung` | NULL |
| `DatumNächsteBewertung` | 2022-02-18 00:00:00 |
| `BZObjMemberCode` | 0 |
| `BZObjType` | 6 |
| `Wert` | 3706.17 |
| `Name` | VG17 | Senkrechtmarkise |
| `Beschreibung` | NULL |
| `Mitbewerber` | NULL |
| `StatusCode` | 0 |
| `Art` | 0 |
| `WahrscheinlichkeitProzent` | 100 |
| `Tendenz` | 1 |
| `Notiz` | NULL |
| `AnsprechpCode` | 0 |
| `Zuordnungsart` | 0 |
| `ProjektCode` | 0 |
| `Info` | NULL |
| `Status` | 1 |
| `WährungCode` | 1 |
| `NaechsterKontakt` | NULL |
| `ErstellerBenutzerCode` | 22209630 |
| `KostenStCode` | 0 |
| `WertAuftrag` | 3550.86 |
| `Eingefroren` | 0 |
| `ProjektePlanungCode` | 0 |
| `ErwarteteKosten` | 0.0 |
| `CurrentRatingId` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.VerkaufschancenAngebot

<a name="dboVerkaufschancenAngebot"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `VerkaufschancenCode` | int | - | ✅ | - |
| `AngebotsCode` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.VerkaufschancenBewertung

<a name="dboVerkaufschancenBewertung"></a>

**Anzahl Datensätze:** 803

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `VerkaufschancenCode` | int | - | ✅ | ((0)) |
| `DatumBewertung` | datetime | - | ✅ | - |
| `BCode` | int | - | ✅ | ((0)) |
| `WahrscheinlichkeitProzent` | int | - | ✅ | ((0)) |
| `Kommentar` | ntext | 1073741823 | ✅ | - |
| `Umsatz` | float | - | ✅ | - |
| `Status` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 24230149 |
| `VerkaufschancenCode` | 1282879801 |
| `DatumBewertung` | 2022-02-11 15:49:34.057000 |
| `BCode` | 22209630 |
| `WahrscheinlichkeitProzent` | 0 |
| `Kommentar` | NULL |
| `Umsatz` | 3706.17 |
| `Status` | 0 |

---

## dbo.VerkaufschancenGr

<a name="dboVerkaufschancenGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | ((0)) |
| `GrLevel` | int | - | ✅ | ((0)) |
| `GrName` | nvarchar | 100 | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.VerkaufschancenMark

<a name="dboVerkaufschancenMark"></a>

**Anzahl Datensätze:** 16

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `ObjCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `BenutzerCode` | 59088549 |
| `ObjCode` | 1671703069 |

---

## dbo.VerkaufschancenStandardthemen

<a name="dboVerkaufschancenStandardthemen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 255 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.VerkaufschancenUmsatzplan

<a name="dboVerkaufschancenUmsatzplan"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Datum` | datetime | - | ✅ | - |
| `Summe` | float | - | ✅ | ((0)) |
| `Bemerkung` | ntext | 1073741823 | ✅ | - |
| `VerkaufschancenCode` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Projektcode` | int | - | ✅ | ((0)) |
| `SachKNummer` | int | - | ✅ | ((0)) |
| `Nettosumme` | float | - | ✅ | - |
| `Mwst` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Versandart

<a name="dboVersandart"></a>

**Anzahl Datensätze:** 3

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Schlüssel` | float | - | ✅ | ((0)) |
| `Versandtext` | ntext | 1073741823 | ✅ | - |
| `Text` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `Schlüssel` | 1.0 |
| `Versandtext` | NULL |
| `Text` | UPS |

---

## dbo.Verteiler

<a name="dboVerteiler"></a>

**Anzahl Datensätze:** 109

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `VerteilerCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `VerteilerName` | nvarchar | 50 | ✅ | - |
| `Hide` | int | - | ✅ | ((0)) |
| `Position` | int | - | ✅ | ((0)) |
| `VerteilerKlassenCode` | int | - | ✅ | ((0)) |
| `GrCode` | int | - | ✅ | ((0)) |
| `VerteilerNummer` | int | - | ✅ | ((0)) |
| `Personenverteiler` | int | - | ✅ | ((0)) |
| `Firmenverteiler` | int | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `Artikelverteiler` | int | - | ✅ | - |
| `Auftragsverteiler` | int | - | ✅ | - |
| `LookupCode` | int | - | ✅ | - |
| `StandardKunde` | int | - | ✅ | - |
| `StandardLieferant` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `VerteilerCode` | 85998923 |
| `VerteilerName` | Fenster |
| `Hide` | 0 |
| `Position` | 0 |
| `VerteilerKlassenCode` | 1451363379 |
| `GrCode` | 0 |
| `VerteilerNummer` | 0 |
| `Personenverteiler` | -1 |
| `Firmenverteiler` | -1 |
| `BenutzerCode` | 0 |
| `Artikelverteiler` | NULL |
| `Auftragsverteiler` | NULL |
| `LookupCode` | NULL |
| `StandardKunde` | 0 |
| `StandardLieferant` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.VerteilerGr

<a name="dboVerteilerGr"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `GrCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `GrIndex` | int | - | ✅ | - |
| `GrLevel` | int | - | ✅ | - |
| `GrName` | nvarchar | 40 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.VerteilerKlassen

<a name="dboVerteilerKlassen"></a>

**Anzahl Datensätze:** 10

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `VerteilerKlassenCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `VerteilerKlassenName` | nvarchar | 30 | ✅ | - |
| `Hide` | int | - | ✅ | ((0)) |
| `Personenverteiler` | int | - | ✅ | ((0)) |
| `Firmenverteiler` | int | - | ✅ | ((0)) |
| `PflichtKunden` | int | - | ✅ | ((0)) |
| `PflichtLieferanten` | int | - | ✅ | ((0)) |
| `Sortierung` | int | - | ✅ | ((0)) |
| `Artikelverteiler` | int | - | ✅ | - |
| `Maximum` | int | - | ✅ | ((0)) |
| `Kundenverteiler` | int | - | ✅ | - |
| `Lieferantenverteiler` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `VerteilerKlassenCode` | 1451363379 |
| `VerteilerKlassenName` | 01 Produktgruppen |
| `Hide` | 0 |
| `Personenverteiler` | -1 |
| `Firmenverteiler` | -1 |
| `PflichtKunden` | 0 |
| `PflichtLieferanten` | 0 |
| `Sortierung` | 0 |
| `Artikelverteiler` | 0 |
| `Maximum` | 0 |
| `Kundenverteiler` | -1 |
| `Lieferantenverteiler` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.VerteilerKlassenProjekte

<a name="dboVerteilerKlassenProjekte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `VerteilerKlassenCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `VerteilerKlassenName` | nvarchar | 30 | ✅ | - |
| `Hide` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.VerteilerMark

<a name="dboVerteilerMark"></a>

**Anzahl Datensätze:** 5,879

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ObjArt` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |
| `VerteilerCode` | int | - | ✅ | - |
| `AbteilungCode` | int | - | ✅ | ((0)) |
| `KAnsprechpCode` | int | - | ✅ | ((0)) |
| `LAnsprechpCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `BCode` | int | - | ✅ | ((0)) |
| `ObjektVerteilerPflege` | int | - | ✅ | ((0)) |
| `LookupCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1746523312 |
| `ObjArt` | 1 |
| `ObjCode` | 2176781 |
| `VerteilerCode` | 22417799 |
| `AbteilungCode` | 0 |
| `KAnsprechpCode` | 0 |
| `LAnsprechpCode` | 0 |
| `Datum` | 2021-12-01 00:00:00 |
| `Notiz` |  |
| `BCode` | 581413548 |
| `ObjektVerteilerPflege` | 0 |
| `LookupCode` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.VerteilerMarkProjekte

<a name="dboVerteilerMarkProjekte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ObjArt` | int | - | ✅ | - |
| `ObjCode` | int | - | ✅ | - |
| `VerteilerCode` | int | - | ✅ | - |
| `AbteilungCode` | int | - | ✅ | ((0)) |
| `KAnsprechpCode` | int | - | ✅ | ((0)) |
| `LAnsprechpCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `VerteilerDatum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | ('') |
| `BCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.VerteilerProjekte

<a name="dboVerteilerProjekte"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `VerteilerCode` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `VerteilerName` | nvarchar | 30 | ✅ | - |
| `Hide` | int | - | ✅ | ((0)) |
| `Position` | int | - | ✅ | ((0)) |
| `VerteilerKlassenCode` | int | - | ✅ | ((0)) |
| `GrCode` | int | - | ✅ | ((0)) |
| `VerteilerNummer` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `SQL` | ntext | 1073741823 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Verzeichnisse

<a name="dboVerzeichnisse"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Verzeichnis` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.VerzeichnisTemplate

<a name="dboVerzeichnisTemplate"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Name` | nvarchar | 200 | ✅ | - |
| `TitelCode` | int | - | ❌ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.VKPreise

<a name="dboVKPreise"></a>

**Anzahl Datensätze:** 2

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KundenCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | - |
| `NettoPreis` | float | - | ✅ | - |
| `ArtikelNummer` | nvarchar | 20 | ✅ | - |
| `KundenGrCode` | int | - | ✅ | - |
| `AktionAnfang` | datetime | - | ✅ | - |
| `AktionEnde` | datetime | - | ✅ | - |
| `EinheitCode` | int | - | ✅ | - |
| `Bemerkung` | nvarchar | 100 | ✅ | - |
| `Verrechnungspreis` | float | - | ✅ | ((0)) |
| `Rabattfähig` | int | - | ✅ | ((0)) |
| `WährungCode` | int | - | ✅ | ((0)) |
| `PreisstaffelCode` | int | - | ✅ | - |
| `StaffelpreisZuschlag` | float | - | ✅ | - |
| `Rabattstaffelpreis` | int | - | ✅ | ((0)) |
| `Rabatt` | decimal | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1174207008 |
| `KundenCode` | 325846684 |
| `ArtikelCode` | 4937604 |
| `NettoPreis` | 54.62 |
| `ArtikelNummer` | NULL |
| `KundenGrCode` | NULL |
| `AktionAnfang` | NULL |
| `AktionEnde` | NULL |
| `EinheitCode` | NULL |
| `Bemerkung` | Sondervereinbarung |
| `Verrechnungspreis` | 0.0 |
| `Rabattfähig` | 0 |
| `WährungCode` | 1 |
| `PreisstaffelCode` | 0 |
| `StaffelpreisZuschlag` | 0.0 |
| `Rabattstaffelpreis` | 0 |
| `Rabatt` | 0E-8 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.VorgangsNachverfolgung

<a name="dboVorgangsNachverfolgung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Vorgangsnummer` | nvarchar | 200 | ✅ | ('') |
| `Notiz` | nvarchar | 4000 | ✅ | ('') |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Vorlagen

<a name="dboVorlagen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Dateiname` | nvarchar | 500 | ✅ | - |
| `Verzeichnis` | nvarchar | 500 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Vornamen

<a name="dboVornamen"></a>

**Anzahl Datensätze:** 179

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Vorname` | nvarchar | 30 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Vorname` | Andrea |

---

## dbo.w4aa_InfofensterDef

<a name="dbow4aa_InfofensterDef"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Type` | nvarchar | 300 | ❌ | - |
| `PropertiesToShow` | nvarchar | -1 | ❌ | - |
| `UserCode` | int | - | ✅ | - |
| `WindowTitle` | nvarchar | 150 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.w4aa_InfofensterGroup

<a name="dbow4aa_InfofensterGroup"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `UserCode` | int | - | ❌ | - |
| `Typen` | nvarchar | -1 | ❌ | - |
| `Bezeichnung` | nvarchar | 250 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.W4ASprint

<a name="dboW4ASprint"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `ID` | uniqueidentifier | - | ❌ | - |
| `Abgeschlossen` | int | - | ✅ | - |
| `Enddatum` | datetime | - | ✅ | - |
| `Name` | nvarchar | 500 | ✅ | - |
| `Startdatum` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Waehrung

<a name="dboWaehrung"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Waehrung` | nvarchar | 30 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1 |
| `Waehrung` | EUR |

---

## dbo.Wareneingang

<a name="dboWareneingang"></a>

**Anzahl Datensätze:** 19,497

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Menge` | real | - | ✅ | ((0)) |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `LagerortCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | - |
| `LieferscheinNr` | nvarchar | 50 | ✅ | - |
| `Retoure` | int | - | ✅ | ((0)) |
| `WaehrungCode` | int | - | ✅ | ((0)) |
| `WertEinzelDM` | float | - | ✅ | ((0)) |
| `WertGesamtDM` | float | - | ✅ | ((0)) |
| `WertEinzelFremd` | float | - | ✅ | ((0)) |
| `WertGesamtFremd` | float | - | ✅ | ((0)) |
| `Kurs` | float | - | ✅ | ((0)) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Name` | ntext | 1073741823 | ✅ | - |
| `Gebucht` | int | - | ✅ | ((0)) |
| `Rabatt` | float | - | ✅ | ((0)) |
| `LiefArtNummer` | nvarchar | 30 | ✅ | - |
| `Bemerkung` | ntext | 1073741823 | ✅ | - |
| `OriginalPosCode` | int | - | ✅ | ((0)) |
| `Kostenkonto` | int | - | ✅ | ((0)) |
| `Mwst` | float | - | ✅ | ((0)) |
| `Mengenfaktor` | float | - | ✅ | ((0)) |
| `Index` | int | - | ✅ | ((0)) |
| `PozNr` | nvarchar | 20 | ✅ | - |
| `Bestellmenge` | float | - | ✅ | - |
| `Frei1` | int | - | ✅ | - |
| `Frei2` | nvarchar | 50 | ✅ | - |
| `Einheit` | nvarchar | 20 | ✅ | - |
| `ArtikelArt` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `EigeneArtikelnummer` | nvarchar | 200 | ✅ | - |
| `Kurztext` | nvarchar | 150 | ✅ | - |
| `Rabatt2` | float | - | ✅ | - |
| `KostenstNummer` | int | - | ✅ | - |
| `Vorgang` | nvarchar | 250 | ✅ | ('') |
| `PalettenFaktor` | float | - | ✅ | - |
| `KartonFaktor` | float | - | ✅ | - |
| `VEFaktor` | float | - | ✅ | - |
| `PalettenFaktorMultiplikator` | float | - | ✅ | - |
| `KartonFaktorMultiplikator` | float | - | ✅ | - |
| `VEFaktorMultiplikator` | float | - | ✅ | - |
| `XMLImport` | int | - | ✅ | ((0)) |
| `Gewicht` | float | - | ✅ | - |
| `Einzelgewicht` | float | - | ✅ | - |
| `KostenstNummer2` | int | - | ✅ | ((0)) |
| `AnteiligeBezugskosten` | decimal | - | ✅ | - |
| `Aufmaß` | nvarchar | -1 | ✅ | ('') |
| `LagerMobilFertig` | int | - | ✅ | - |
| `Frei4` | nvarchar | -1 | ✅ | - |
| `KundenMaterial` | nvarchar | 500 | ✅ | - |
| `KundenMaterialCode` | int | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |
| `Wareneingang` | nvarchar | 200 | ✅ | - |
| `Herstellernummer` | nvarchar | 200 | ✅ | - |
| `Feld1` | bit | - | ✅ | - |
| `OldBZObjMemberCode` | int | - | ✅ | - |
| `OldBZObjType` | int | - | ✅ | - |
| `Lagerort` | nvarchar | -1 | ✅ | - |
| `Zolltarifnummer` | nvarchar | 50 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 36894 |
| `ArtikelCode` | 0 |
| `Datum` | 2025-09-01 00:00:00 |
| `Menge` | 0.0 |
| `BZObjMemberCode` | 1418863540 |
| `SDObjMemberCode` | 0 |
| `LagerortCode` | 0 |
| `ProjektCode` | 711729299 |
| `LieferscheinNr` | NULL |
| `Retoure` | 0 |
| `WaehrungCode` | 0 |
| `WertEinzelDM` | 0.0 |
| `WertGesamtDM` | 0.0 |
| `WertEinzelFremd` | 0.0 |
| `WertGesamtFremd` | 0.0 |
| `Kurs` | 0.0 |
| `Notiz` | NULL |
| `Name` | Angebot 250372, 11.06.2025 |
| `Gebucht` | -1 |
| `Rabatt` | 0.0 |
| `LiefArtNummer` | NULL |
| `Bemerkung` | NULL |
| `OriginalPosCode` | 1125700587 |
| `Kostenkonto` | 8400 |
| `Mwst` | 0.0 |
| `Mengenfaktor` | 1.0 |
| `Index` | 2 |
| `PozNr` | NULL |
| `Bestellmenge` | 0.0 |
| `Frei1` | 0 |
| `Frei2` | NULL |
| `Einheit` | NULL |
| `ArtikelArt` | -9 |
| `BZObjType` | 13 |
| `EigeneArtikelnummer` | NULL |
| `Kurztext` | NULL |
| `Rabatt2` | 0.0 |
| `KostenstNummer` | 0 |
| `Vorgang` |  |
| `PalettenFaktor` | 0.0 |
| `KartonFaktor` | 0.0 |
| `VEFaktor` | 0.0 |
| `PalettenFaktorMultiplikator` | 1.0 |
| `KartonFaktorMultiplikator` | 1.0 |
| `VEFaktorMultiplikator` | 1.0 |
| `XMLImport` | 0 |
| `Gewicht` | 0.0 |
| `Einzelgewicht` | 0.0 |
| `KostenstNummer2` | 0 |
| `AnteiligeBezugskosten` | 0E-8 |
| `Aufmaß` | NULL |
| `LagerMobilFertig` | 0 |
| `Frei4` | NULL |
| `KundenMaterial` | NULL |
| `KundenMaterialCode` | 0 |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |
| `Wareneingang` | NULL |
| `Herstellernummer` | NULL |
| `Feld1` | NULL |
| `OldBZObjMemberCode` | 0 |
| `OldBZObjType` | 0 |
| `Lagerort` | NULL |
| `Zolltarifnummer` | NULL |

---

## dbo.WartungsIntervalle

<a name="dboWartungsIntervalle"></a>

**Anzahl Datensätze:** 8

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Bezeichnung` | nvarchar | 50 | ✅ | ('""') |
| `IntervallCode` | nvarchar | 10 | ✅ | ('""') |
| `Dauer` | int | - | ✅ | ((0)) |
| `Intervall` | nvarchar | 50 | ✅ | - |
| `Nummer` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 4 |
| `Bezeichnung` | Monatlich |
| `IntervallCode` | m |
| `Dauer` | 1 |
| `Intervall` | Monat |
| `Nummer` | 1 |

---

## dbo.Wartungsleistungen

<a name="dboWartungsleistungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KundenCode` | int | - | ✅ | ((0)) |
| `KKarteiCode` | int | - | ✅ | ((0)) |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Beschreibung` | nvarchar | 50 | ✅ | - |
| `Rhytmus` | int | - | ✅ | - |
| `ErsterTermin` | datetime | - | ✅ | - |
| `LetzterTermin` | datetime | - | ✅ | - |
| `NächsterTermin` | datetime | - | ✅ | - |
| `Preis` | float | - | ✅ | ((0)) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `WhattodoCode` | int | - | ✅ | ((0)) |
| `EndetAm` | datetime | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Werte

<a name="dboWerte"></a>

**Anzahl Datensätze:** 106

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Variable` | nvarchar | 1000 | ✅ | - |
| `Wert` | float | - | ✅ | ((0)) |
| `TextWert` | ntext | 1073741823 | ✅ | - |
| `NichtSichtbar` | int | - | ✅ | - |
| `VersionNet` | int | - | ✅ | - |
| `Beschreibung` | nvarchar | -1 | ✅ | ('') |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 57 |
| `Variable` | Anruferkennung Konfiguration |
| `Wert` | 1.0 |
| `TextWert` | NULL |
| `NichtSichtbar` | 0 |
| `VersionNet` | 0 |
| `Beschreibung` | NULL |
| `InsertTime` | NULL |
| `UpdateTime` | NULL |

---

## dbo.WhattodoHistorie

<a name="dboWhattodoHistorie"></a>

**Anzahl Datensätze:** 2,864

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KNCode` | int | - | ✅ | ((0)) |
| `BCode` | int | - | ✅ | ((0)) |
| `Aktion` | nvarchar | 100 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Person` | nvarchar | 50 | ✅ | - |
| `AnBCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 236135224 |
| `KNCode` | 5597998 |
| `BCode` | 888797748 |
| `Aktion` | Änderung Offen] |
| `Datum` | 2022-01-04 16:42:34.187000 |
| `Person` | Andreas Stolarczyk |
| `AnBCode` | 0 |

---

## dbo.Whattodos

<a name="dboWhattodos"></a>

**Anzahl Datensätze:** 359

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `SDObjType` | int | - | ✅ | ((0)) |
| `SDObjMemberCode` | int | - | ✅ | ((0)) |
| `Datum` | datetime | - | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Erledigt` | int | - | ✅ | ((0)) |
| `AnsprpCode` | int | - | ✅ | ((0)) |
| `ProjektCode` | int | - | ✅ | - |
| `KNBerichtCode` | int | - | ✅ | - |
| `SN` | nvarchar | 50 | ✅ | - |
| `ParentCode` | int | - | ✅ | ((0)) |
| `ErledigtNotiz` | nvarchar | 50 | ✅ | - |
| `BCode` | int | - | ✅ | ((0)) |
| `BErstellt` | datetime | - | ✅ | - |
| `ModificationDate` | datetime | - | ✅ | - |
| `Status` | int | - | ✅ | ((0)) |
| `ErinnernDate` | datetime | - | ✅ | - |
| `Priorität` | int | - | ✅ | ((1)) |
| `Wartungslauf` | int | - | ✅ | - |
| `ObjGrCode` | int | - | ✅ | - |
| `AutoWeiterleiten` | int | - | ✅ | - |
| `WeiterleitenAnBCode` | int | - | ✅ | ((0)) |
| `WeiterleitenStatusCode` | int | - | ✅ | ((0)) |
| `WeiterleitenGrCode` | int | - | ✅ | ((0)) |
| `WeiterleitenDatum` | datetime | - | ✅ | - |
| `Löschvormerkung` | int | - | ✅ | - |
| `Outlook_EntryID` | nvarchar | 250 | ✅ | - |
| `BZObjType` | int | - | ✅ | ((0)) |
| `BZObjMemberCode` | int | - | ✅ | ((0)) |
| `Stunden` | float | - | ✅ | ((0)) |
| `Enddatum` | datetime | - | ✅ | - |
| `Titel` | nvarchar | 100 | ✅ | - |
| `GesprächspunkteCode` | int | - | ✅ | - |
| `TicketID` | uniqueidentifier | - | ✅ | - |
| `ProjektePlanungCode` | int | - | ✅ | - |
| `ChecklistePositionenCode` | int | - | ✅ | - |
| `ChecklisteCode` | int | - | ✅ | - |
| `ArtikelCode` | int | - | ✅ | ((0)) |
| `Zeitbedarf` | float | - | ✅ | - |
| `InsertTime` | datetime | - | ✅ | - |
| `UpdateTime` | datetime | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 1738171449 |
| `BenutzerCode` | 22209630 |
| `SDObjType` | 1 |
| `SDObjMemberCode` | 1412684179 |
| `Datum` | 2022-02-01 00:00:00 |
| `Notiz` | Anruf von Herr Donutio am 24.01.2022 um ca. 11:30 Uhr 



kleine Fenster sollen 1-flügelig werden

g... (total: 228 chars) |
| `Erledigt` | -1 |
| `AnsprpCode` | 0 |
| `ProjektCode` | 0 |
| `KNBerichtCode` | 0 |
| `SN` | NULL |
| `ParentCode` | 0 |
| `ErledigtNotiz` | NULL |
| `BCode` | 39819682 |
| `BErstellt` | 2022-01-24 16:53:20.120000 |
| `ModificationDate` | 2022-02-02 14:36:20.023000 |
| `Status` | 2 |
| `ErinnernDate` | NULL |
| `Priorität` | 1 |
| `Wartungslauf` | NULL |
| `ObjGrCode` | 0 |
| `AutoWeiterleiten` | NULL |
| `WeiterleitenAnBCode` | 0 |
| `WeiterleitenStatusCode` | 0 |
| `WeiterleitenGrCode` | 0 |
| `WeiterleitenDatum` | NULL |
| `Löschvormerkung` | NULL |
| `Outlook_EntryID` | NULL |
| `BZObjType` | 0 |
| `BZObjMemberCode` | 0 |
| `Stunden` | 0.0 |
| `Enddatum` | 2022-01-24 00:00:00 |
| `Titel` | Bestellaufmaß - erweiterte Angaben für BV: Jörgis |
| `GesprächspunkteCode` | 0 |
| `TicketID` | 00000000-0000-0000-0000-000000000000 |
| `ProjektePlanungCode` | 0 |
| `ChecklistePositionenCode` | 0 |
| `ChecklisteCode` | 0 |
| `ArtikelCode` | 0 |
| `Zeitbedarf` | 0.0 |
| `InsertTime` | 2022-01-24 16:53:20.120000 |
| `UpdateTime` | NULL |

---

## dbo.WhattodosAnhang

<a name="dboWhattodosAnhang"></a>

**Anzahl Datensätze:** 7

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | ((0)) |
| `ObjCode` | int | - | ✅ | ((0)) |
| `Datei` | nvarchar | 500 | ✅ | - |
| `Briefdatei` | image | 2147483647 | ✅ | - |
| `OriginalFileName` | nvarchar | 500 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 32508372 |
| `Notiz` |  |
| `Datum` | 2020-02-14 09:54:49.073000 |
| `BenutzerCode` | 0 |
| `ObjCode` | 14906149 |
| `Datei` | P19329 - RE - Steinau - 522175 - 2020.02.14.pdf |
| `Briefdatei` | <binary data, 36117 bytes> |
| `OriginalFileName` | NULL |

---

## dbo.WhattodosStandardthemen

<a name="dboWhattodosStandardthemen"></a>

**Anzahl Datensätze:** 1

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Name` | nvarchar | 50 | ✅ | - |
| `BCode` | int | - | ✅ | ((0)) |
| `Langtext` | ntext | 1073741823 | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 311057659 |
| `Name` | Montage-Auftrag |
| `BCode` | 59088549 |
| `Langtext` | Geplante Montagezeit

Monteure:                | Stunden              | Tage



Notiz: Termin ist fe... (total: 221 chars) |

---

## dbo.Widget

<a name="dboWidget"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Definition` | nvarchar | -1 | ✅ | - |
| `IsPredefined` | int | - | ✅ | - |
| `INSERT_TIME` | datetime | - | ✅ | - |
| `UPDATE_TIME` | datetime | - | ✅ | - |
| `Name` | nvarchar | 200 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.WidgetField

<a name="dboWidgetField"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Id` | uniqueidentifier | - | ❌ | - |
| `Entity` | int | - | ✅ | - |
| `FieldPurpose` | int | - | ✅ | - |
| `INSERT_TIME` | datetime | - | ✅ | - |
| `UPDATE_TIME` | datetime | - | ✅ | - |
| `FieldType` | int | - | ✅ | - |
| `FieldName` | nvarchar | 200 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Z_Test_Schemaaktualisierung

<a name="dboZ_Test_Schemaaktualisierung"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `Name` | varchar | 50 | ✅ | - |
| `Notiz` | ntext | 1073741823 | ✅ | - |
| `Prozentwert` | decimal | - | ✅ | - |
| `Notiz2` | ntext | 1073741823 | ✅ | - |
| `Test2` | varchar | 50 | ✅ | - |
| `Test3` | varchar | 50 | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Zahlungsart

<a name="dboZahlungsart"></a>

**Anzahl Datensätze:** 9

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `Schlüssel` | float | - | ✅ | - |
| `Text` | nvarchar | 50 | ✅ | - |
| `Langtext` | ntext | 1073741823 | ✅ | - |
| `Stufe` | int | - | ✅ | ((0)) |
| `Zahlungsziel` | int | - | ✅ | ((0)) |
| `SkontoTage` | int | - | ✅ | ((0)) |
| `SkontoProzent` | float | - | ✅ | ((0)) |
| `Skonto2Tage` | int | - | ✅ | ((0)) |
| `Skonto2Prozent` | float | - | ✅ | ((0)) |
| `Vorlage` | nvarchar | 200 | ✅ | - |
| `FibuRefNr` | nvarchar | 4000 | ✅ | ('') |
| `Test_Schemaaktualisierung` | int | - | ✅ | - |
| `AusziffernAutomatisch` | int | - | ✅ | - |
| `AusziffernAutomatischKonto` | int | - | ✅ | - |
| `Bankeinzug` | int | - | ✅ | - |

### Beispiel-Datensatz

| Spalte | Wert |
|--------|------|
| `Code` | 387647939 |
| `Schlüssel` | 0.0 |
| `Text` | Barzahlung |
| `Langtext` | Barzahlung |
| `Stufe` | 0 |
| `Zahlungsziel` | 0 |
| `SkontoTage` | 0 |
| `SkontoProzent` | 0.0 |
| `Skonto2Tage` | 0 |
| `Skonto2Prozent` | 0.0 |
| `Vorlage` | NULL |
| `FibuRefNr` |  |
| `Test_Schemaaktualisierung` | NULL |
| `AusziffernAutomatisch` | 0 |
| `AusziffernAutomatischKonto` | 1000 |
| `Bankeinzug` | NULL |

---

## dbo.ZeiterfassungTimer

<a name="dboZeiterfassungTimer"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `StopwatchStart` | datetime | - | ✅ | - |
| `EmployeeCode` | int | - | ✅ | - |
| `EmployeeName` | nvarchar | 100 | ✅ | - |
| `CustomerCode` | int | - | ✅ | - |
| `OrderConfirmationCode` | int | - | ✅ | - |
| `ProjectCode` | int | - | ✅ | - |
| `PositionCode` | int | - | ✅ | - |
| `ActivityCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.Zugriffsfilter

<a name="dboZugriffsfilter"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `ObjCode` | int | - | ✅ | - |
| `ObjArt` | int | - | ✅ | - |
| `BenutzerCode` | int | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ZuordnungFremdleistungen

<a name="dboZuordnungFremdleistungen"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | - |
| `BZObjmemberCode` | int | - | ✅ | - |
| `BZObjType` | int | - | ✅ | - |
| `BCode` | int | - | ✅ | - |
| `PosCode` | int | - | ✅ | - |
| `Datum` | datetime | - | ✅ | - |
| `Summe` | float | - | ✅ | - |
| `RECode` | int | - | ✅ | - |
| `Kommentar` | varchar | 512 | ✅ | - |
| `RESachkontenSplitCode` | int | - | ✅ | ((0)) |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

## dbo.ZuordnungProvisionär

<a name="dboZuordnungProvisionär"></a>

**Anzahl Datensätze:** 0

### Spalten-Schema

| Spaltenname | Datentyp | Max. Länge | NULL erlaubt | Default |
|-------------|----------|------------|--------------|----------|
| `Code` | int | - | ❌ | ((1000000000)*rand((datepart(month,getdate())*(100000)+datepart(second,getdate())*(1000))+datepart(millisecond,getdate()))) |
| `KundenCode` | int | - | ✅ | ((0)) |
| `KostenstCode` | int | - | ✅ | ((0)) |
| `ProvisionärsCode` | int | - | ✅ | ((0)) |
| `Provisionssatz` | float | - | ✅ | - |

### Beispiel-Datensatz

ℹ️ *Keine Daten in dieser Tabelle vorhanden*

---

