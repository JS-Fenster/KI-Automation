# 🚀 Schnellstart-Anleitung - Reparatur-Portal

## 1. SQL-Credentials vorbereiten

Ihr benötigt folgende Informationen:
- **Server:** 192.168.16.202\SQLEXPRESS
- **Datenbank:** WorkM001
- **Username:** [Euer SQL Server Login]
- **Passwort:** [Euer SQL Server Passwort]

---

## 2. Backend starten

### CMD-Fenster 1 öffnen:

```cmd
cd Z:\IT-Sammlung\KI_Automation\Claude_SQL_Server_Automation\ReparaturPortal\backend

npm install

copy .env.example .env
notepad .env
```

**In .env diese Werte eintragen:**
```
DB_SERVER=192.168.16.202\SQLEXPRESS
DB_DATABASE=WorkM001
DB_USER=your_username_here
DB_PASSWORD=your_password_here
PORT=3001
NODE_ENV=development
JWT_SECRET=test_secret_123
```

**Speichern & Server starten:**
```cmd
npm start
```

✅ Backend sollte jetzt laufen auf http://localhost:3001

---

## 3. Frontend starten

### CMD-Fenster 2 öffnen:

```cmd
cd Z:\IT-Sammlung\KI_Automation\Claude_SQL_Server_Automation\ReparaturPortal\frontend

npm install

npm run dev
```

✅ Frontend sollte jetzt laufen auf http://localhost:3000

---

## 4. Testen

1. Browser öffnen: http://localhost:3000
2. Dashboard sollte sichtbar sein
3. Navigiere zu "Kunden" → Sollte Kundenliste anzeigen
4. Navigiere zu "Reparaturen" → Sollte Reparaturliste anzeigen

---

## ⚠️ Troubleshooting

### "Cannot connect to SQL Server"
→ Prüfe .env Datei, Username/Passwort korrekt?
→ Ist SQL Server erreichbar? (Test mit: Test-NetConnection 192.168.16.202 -Port 1433)

### "EADDRINUSE: Port already in use"
→ Port 3001 oder 3000 bereits belegt
→ Lösung: Ports in .env (Backend) oder vite.config.js (Frontend) ändern

### "Module not found"
→ npm install nochmal ausführen
→ node_modules Ordner löschen und neu installieren

---

## 📞 Bei Fragen

Siehe README.md für detaillierte Dokumentation!
