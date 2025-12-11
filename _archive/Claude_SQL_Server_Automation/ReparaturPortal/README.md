# 🔧 Reparatur-Portal - Fenster & Türen Service

Modernes Web-Portal für die Verwaltung von Reparaturaufträgen mit Anbindung an SQL Server ERP-System.

## 📋 Features

### ✅ Implementiert (MVP)
- 👥 **Kundenverwaltung** - Anzeige, Suche und Verwaltung aller Kunden aus SQL-Datenbank
- 🔧 **Reparaturverwaltung** - Übersicht aller Reparaturaufträge mit Status-Tracking
- 📊 **Dashboard** - Statistiken und Übersicht anstehender Reparaturen
- 📅 **Termine** - Anzeige anstehender Termine (Platzhalter für Outlook-Integration)
- 🗺️ **Routenplanung** - Geografische Übersicht (Platzhalter für Routenoptimierung)
- 🔄 **Live SQL-Datenbank-Anbindung** - Echtzeitdaten aus ERP-System

### 🚧 Platzhalter für zukünftige Features
- 📧 **Outlook-Integration** - Automatische Termin-Synchronisation
- 🗺️ **Routenoptimierung** - Google Maps API / GraphHopper
- 🤖 **Voice Bot** - Automatische Terminkoordination
- 👤 **Multi-User-System** - Login & Berechtigungen
- 📱 **Mobile App** - Progressive Web App (PWA)

---

## 🏗️ Architektur

```
ReparaturPortal/
├── backend/              # Node.js + Express API
│   ├── config/          # Datenbank-Konfiguration
│   ├── routes/          # API-Endpunkte
│   │   ├── customers.js # Kunden-API
│   │   └── repairs.js   # Reparatur-API
│   ├── server.js        # Express Server
│   ├── package.json
│   └── .env            # Umgebungsvariablen (erstellen!)
│
└── frontend/            # React + Vite + Tailwind CSS
    ├── src/
    │   ├── pages/       # Seiten-Komponenten
    │   │   ├── Dashboard.jsx
    │   │   ├── Customers.jsx
    │   │   ├── Repairs.jsx
    │   │   ├── Appointments.jsx
    │   │   └── RouteOptimization.jsx
    │   ├── App.jsx      # Haupt-App mit Routing
    │   ├── main.jsx     # Entry Point
    │   └── index.css    # Tailwind Styles
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Installation & Start

### Voraussetzungen
- **Node.js** (v18 oder höher)
- **npm** oder **yarn**
- **SQL Server** Zugriff (192.168.16.202\SQLEXPRESS)

### Schritt 1: Backend Setup

```bash
cd backend

# Dependencies installieren
npm install

# .env Datei erstellen (aus .env.example kopieren)
copy .env.example .env

# .env Datei mit deinen SQL-Credentials bearbeiten:
# DB_SERVER=192.168.16.202\SQLEXPRESS
# DB_DATABASE=WorkM001
# DB_USER=dein_username
# DB_PASSWORD=dein_passwort

# Server starten
npm start
```

Der Backend-Server läuft nun auf: **http://localhost:3001**

### Schritt 2: Frontend Setup

**In einem NEUEN Terminal-Fenster:**

```bash
cd frontend

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Das Frontend läuft nun auf: **http://localhost:3000**

---

## 📡 API-Dokumentation

### Backend-Endpunkte

#### Health Check
```
GET /api/health
Response: { status: 'OK', version: '1.0.0' }
```

#### Kunden-API (`/api/customers`)
```
GET    /api/customers              # Alle Kunden abrufen
GET    /api/customers/:code        # Einzelnen Kunden abrufen
GET    /api/customers/search/:term # Kunden suchen
POST   /api/customers              # Neuen Kunden anlegen
PATCH  /api/customers/:code        # Kunden aktualisieren
```

#### Reparatur-API (`/api/repairs`)
```
GET    /api/repairs                        # Alle Reparaturen
GET    /api/repairs/:code                  # Einzelne Reparatur
GET    /api/repairs?timeframe=future       # Filter: Zukünftige
GET    /api/repairs?timeframe=past         # Filter: Vergangene
POST   /api/repairs                        # Neue Reparatur anlegen
PATCH  /api/repairs/:code                  # Reparatur aktualisieren
GET    /api/repairs/stats/overview         # Statistiken
GET    /api/repairs/appointments/upcoming  # Anstehende Termine
GET    /api/repairs/route/optimize?date=   # Routenoptimierung (Platzhalter)
```

---

## 🗄️ Datenbank-Schema

Die Anwendung nutzt folgende Tabellen aus der **WorkM001** Datenbank:

### Relevante Tabellen
- **dbo.KAnsprechp** - Kundenstammdaten
- **dbo.Auftrag** - Reparaturaufträge
- **dbo.Auftragsstatus** - Status-Definitionen
- **dbo.Artikel** - Ersatzteile

Detaillierte Tabellen-Schemas siehe: `SQL_Server_Wissensdatenbank.md`

---

## 🎨 Frontend-Technologien

- **React 18** - UI Framework
- **Vite** - Build Tool (schneller als Create React App)
- **Tailwind CSS** - Utility-First CSS Framework
- **React Router** - Client-Side Routing
- **Axios** - HTTP Client für API-Calls
- **Lucide Icons** - Icon-Library

---

## 🔧 Troubleshooting

### Backend startet nicht
```bash
# Prüfe .env Datei
# Stelle sicher, dass SQL Server erreichbar ist:
Test-NetConnection -ComputerName 192.168.16.202 -Port 1433
```

### Frontend zeigt keine Daten
```bash
# Prüfe ob Backend läuft (http://localhost:3001/api/health)
# Prüfe Browser-Konsole auf Fehler
# Prüfe Network-Tab in DevTools
```

### CORS-Fehler
```
Backend verwendet cors() Middleware.
Wenn Probleme auftreten, prüfe CORS-Konfiguration in server.js
```

---

## 📝 Entwicklungs-Roadmap

### Phase 1: MVP (✅ FERTIG)
- [x] Backend mit SQL Server Anbindung
- [x] Kunden-Verwaltung
- [x] Reparatur-Verwaltung
- [x] Dashboard
- [x] Platzhalter für Outlook & Routenoptimierung

### Phase 2: Authentifizierung
- [ ] Login-System
- [ ] Benutzer-Verwaltung
- [ ] Rollen & Berechtigungen

### Phase 3: Outlook-Integration
- [ ] Outlook Calendar API Anbindung
- [ ] Bidirektionale Termin-Synchronisation
- [ ] Automatische Status-Updates

### Phase 4: Routenoptimierung
- [ ] Google Maps API Integration
- [ ] Geografische Routenberechnung
- [ ] Fahrtzeit-Schätzung
- [ ] Verkehrslage (live)

### Phase 5: Voice Bot
- [ ] Voice Bot Service Integration (Bland AI / Vapi.ai)
- [ ] Automatische Terminkoordinierung
- [ ] Intelligente Terminvorschläge basierend auf Route

### Phase 6: Advanced Features
- [ ] Mobile App (PWA)
- [ ] Dokumenten-Upload
- [ ] E-Mail-Integration
- [ ] Reporting & Analytics
- [ ] n8n Workflow-Integration

---

## 👤 Benutzerhandbuch

### Dashboard
- Zeigt Übersicht aller Reparaturen
- Statistiken: Gesamt, Geplant, Abgeschlossen, Überfällig
- Anstehende Reparaturen in Tabellenansicht

### Kunden
- Liste aller Kunden aus SQL-Datenbank
- Suchfunktion (Name, Ort, Telefon)
- Anzeige: Name, Kontaktdaten, Adresse

### Reparaturen
- Liste aller Reparaturaufträge
- Filter: Alle / Zukünftig / Vergangen
- Status-Badges mit Farbkodierung
- Kartenansicht mit Details

### Termine
- Anstehende Reparaturtermine
- Outlook-Sync-Button (Platzhalter)
- Heute-Markierung für aktuelle Termine

### Routenplanung
- Datum auswählen
- Routen laden und anzeigen
- Optimierungs-Button (Platzhalter)
- Geografische Reihenfolge

---

## 🔒 Sicherheit

### Aktuelle Implementierung
- CORS aktiviert für localhost
- SQL-Injection-Schutz durch parameterisierte Queries

### Für Produktion noch umzusetzen
- [ ] HTTPS/SSL
- [ ] JWT-Authentifizierung
- [ ] Rate Limiting
- [ ] Input-Validierung erweitern
- [ ] Logging & Monitoring

---

## 📞 Support & Kontakt

**Entwickelt für:** Andreas Stolarczyk
**Projekt:** Fenster & Türen Reparaturservice
**Erstellt:** 2025-12-05

---

## 🎉 Next Steps

1. **Backend starten** → SQL-Credentials in .env eintragen
2. **Frontend starten** → npm run dev
3. **Im Browser öffnen** → http://localhost:3000
4. **Testen** → Kunden & Reparaturen ansehen
5. **Planen** → Nächste Features aus Roadmap umsetzen

**Viel Erfolg mit dem Reparatur-Portal! 🚀**
