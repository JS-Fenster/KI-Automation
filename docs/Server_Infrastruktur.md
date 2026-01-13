# Server-Infrastruktur

> **Stand:** 2025-12-29 | **Netzwerk:** 192.168.16.x

---

## Hyper-V Host (HYPERV)

| Eigenschaft | Wert |
|-------------|------|
| **IP** | 192.168.16.200 |
| **OS** | Windows Server 2019 Standard |
| **Hardware** | Supermicro X11SCL-F |
| **CPU** | Intel Xeon E-2176G @ 3.70GHz (6 Kerne, 12 Threads) |
| **RAM** | 64 GB |
| **Rolle** | Hyper-V Virtualisierungshost |

---

## Virtuelle Maschinen

| Name | OS | RAM | CPU | Zweck |
|------|----|----|-----|-------|
| **DC** | Windows Server 2019 | 5 GB | 1 Kern | Domain Controller, Dateiserver (Z: Laufwerk) |
| **AppServer** | Windows Server 2019 | 18 GB | ? | Anwendungsserver, SQL Server Host |
| **scaleflexx** | ? | 4 GB | ? | Guacamole Remoteserver |

---

## Aktive VMs (neu)

| Name | IP | OS | RAM | Zweck |
|------|----|----|-----|-------|
| **n8n-server** | 192.168.16.83 | Debian 13 | 4 GB | Docker, n8n (Port 5678) |

---

## Netzwerk-Uebersicht

| IP | Hostname | Dienst |
|----|----------|--------|
| 192.168.16.200 | HYPERV | Hyper-V Host |
| 192.168.16.202 | AppServer (?) | SQL Server (WorkM001), Port 1433 |
| 192.168.16.83 | n8n-server | n8n Workflow Automation, Port 5678 |
| 192.168.16.201 | DC | Domain Controller, Dateiserver |

---

## Dateiablage (Netzlaufwerke)

> Hinweis: Nur im Firmennetz erreichbar (work-only).

| Laufwerk/Pfad | Server | Inhalt |
|---------------|--------|--------|
| Netzlaufwerk (gemappt) | DC | Hauptnetzlaufwerk, zentrale Dateiablage |
| `\\appserver\Work4all\` | AppServer | Work4all ERP-Dateien |
| `\\appserver\Work4all\B001` | AppServer | Dokumente (Bilder, Montagescheine, etc.) |
| `\\appserver\Work4all\T001` | AppServer | Ticket-Anhaenge |
| `\\appserver\Work4all\Mail001` | AppServer | Mail-Anhaenge |
| `\\appserver\Work4all\ERPAnhänge\M001` | AppServer | ERP-Dokumente (Angebote, Bestellungen) |

---

## Remote-Zugriff (Cloudflare Tunnel)

| Dienst | Server | Hostname | Lokaler Port |
|--------|--------|----------|--------------|
| RDP | AppServer (202) | `rdp.js-fenster-intern.org` | `localhost:3389` |
| RDP | DC (201) | `dc-rdp.js-fenster-intern.org` | `localhost:3390` |
| SQL | AppServer (202) | `sql.js-fenster-intern.org` | `localhost:1433` |

### Tunnel-Uebersicht

| Tunnel-Name | Server | Status |
|-------------|--------|--------|
| `js-fenster-server` | AppServer (202) | Aktiv |
| `dc-server` | DC (201) | Aktiv |

### Client-Verbindung

```bash
# cloudflared installieren (einmalig)
winget install Cloudflare.cloudflared

# RDP zum AppServer (202)
cloudflared access rdp --hostname rdp.js-fenster-intern.org --url localhost:3389

# RDP zum DC (201)
cloudflared access rdp --hostname dc-rdp.js-fenster-intern.org --url localhost:3390

# SQL Server
cloudflared access tcp --hostname sql.js-fenster-intern.org --url localhost:1433
```

> **Details:** Siehe `ERP_Datenbank.md` → Remote-Zugriff: Cloudflare Tunnel

---

## Deaktivierte Dienste (HYPERV)

| Dienst | Grund | Rueckgaengig |
|--------|-------|--------------|
| IAStorIcon.exe | Memory-Leak (100MB → GB), Intel VROC nicht verwendet (Avago RAID aktiv) | `Rename-Item "C:\Program Files\Intel\Intel(R) Virtual RAID on CPU\IAStorIcon.exe.DISABLED" "IAStorIcon.exe"` |

---

## Changelog

| Datum | Aenderung |
|-------|-----------|
| 2026-01-05 | IAStorIcon.exe deaktiviert (Memory-Leak, VROC nicht verwendet) |
| 2025-12-29 | DC-RDP Tunnel hinzugefuegt (dc-rdp.js-fenster-intern.org) |
| 2025-12-19 | Initial - Hyper-V Infrastruktur dokumentiert |
| 2025-12-19 | Dateiablage und Remote-Zugriff ergaenzt |
| 2025-12-19 | n8n-server VM erstellt (Debian 13, Docker, n8n) |
