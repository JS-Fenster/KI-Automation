# Server-Infrastruktur

> **Stand:** 2025-12-20 | **Netzwerk:** 192.168.16.x

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

| Laufwerk/Pfad | Server | Inhalt |
|---------------|--------|--------|
| `Z:\` | DC | Hauptnetzlaufwerk, zentrale Dateiablage |
| `\\appserver\Work4all\` | AppServer | Work4all ERP-Dateien |
| `\\appserver\Work4all\B001` | AppServer | Dokumente (Bilder, Montagescheine, etc.) |
| `\\appserver\Work4all\T001` | AppServer | Ticket-Anhaenge |
| `\\appserver\Work4all\Mail001` | AppServer | Mail-Anhaenge |
| `\\appserver\Work4all\ERPAnhänge\M001` | AppServer | ERP-Dokumente (Angebote, Bestellungen) |

---

## Remote-Zugriff

| Dienst | Hostname | Methode |
|--------|----------|---------|
| SQL Server | `sql.js-fenster-intern.org` | Cloudflare Tunnel |
| RDP | `rdp.js-fenster-intern.org` | Cloudflare Tunnel |

> **Details:** Siehe `ERP_Datenbank.md` → Remote-Zugriff: Cloudflare Tunnel

---

## Changelog

| Datum | Aenderung |
|-------|-----------|
| 2025-12-19 | Initial - Hyper-V Infrastruktur dokumentiert |
| 2025-12-19 | Dateiablage und Remote-Zugriff ergaenzt |
| 2025-12-19 | n8n-server VM erstellt (Debian 13, Docker, n8n) |
