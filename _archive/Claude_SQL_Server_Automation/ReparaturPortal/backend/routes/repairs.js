const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/database');

// Reparatur-Status-Definitionen
const REPAIR_STATUS = {
    ANFRAGE: 'Anfrage',
    ERSTBESICHTIGUNG_GEPLANT: 'Erstbesichtigung geplant',
    ERSTBESICHTIGUNG_DURCHGEFUEHRT: 'Erstbesichtigung durchgeführt',
    ERSATZTEIL_BESTELLT: 'Ersatzteil bestellt',
    ERSATZTEIL_EINGETROFFEN: 'Ersatzteil eingetroffen',
    FOLGETERMIN_GEPLANT: 'Folgetermin geplant',
    REPARATUR_DURCHGEFUEHRT: 'Reparatur durchgeführt',
    ABGESCHLOSSEN: 'Abgeschlossen',
    STORNIERT: 'Storniert'
};

// GET alle Reparaturen mit Kundendaten
router.get('/', async (req, res) => {
    try {
        const { status, timeframe } = req.query;

        const pool = await getPool();
        let query = `
            SELECT
                a.Code as AuftragCode,
                a.Datum as Auftragsdatum,
                a.KundeCode,
                k.Name as KundeName,
                k.Vorname as KundeVorname,
                k.Telefon as KundeTelefon,
                k.Strasse as KundeStrasse,
                k.PLZ as KundePLZ,
                k.Ort as KundeOrt,
                a.Bemerkung,
                a.Betrag,
                ast.Name as Status
            FROM dbo.Auftrag a
            LEFT JOIN dbo.KAnsprechp k ON a.KundeCode = k.Code
            LEFT JOIN dbo.Auftragsstatus ast ON a.StatusCode = ast.Code
            WHERE 1=1
        `;

        // Optional: Filter nach Status
        if (status) {
            query += ` AND ast.Name = '${status}'`;
        }

        // Optional: Filter nach Zeitraum
        if (timeframe === 'past') {
            query += ` AND a.Datum < GETDATE()`;
        } else if (timeframe === 'future') {
            query += ` AND a.Datum >= GETDATE()`;
        }

        query += ` ORDER BY a.Datum DESC`;

        const result = await pool.request().query(query);

        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Reparaturen:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen der Reparaturen',
            error: error.message
        });
    }
});

// GET einzelne Reparatur
router.get('/:code', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('code', sql.Int, req.params.code)
            .query(`
                SELECT
                    a.*,
                    k.Name as KundeName,
                    k.Vorname as KundeVorname,
                    k.Telefon as KundeTelefon,
                    k.EMail as KundeEmail,
                    k.Strasse as KundeStrasse,
                    k.PLZ as KundePLZ,
                    k.Ort as KundeOrt,
                    ast.Name as Status
                FROM dbo.Auftrag a
                LEFT JOIN dbo.KAnsprechp k ON a.KundeCode = k.Code
                LEFT JOIN dbo.Auftragsstatus ast ON a.StatusCode = ast.Code
                WHERE a.Code = @code
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reparatur nicht gefunden'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Reparatur:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen der Reparatur',
            error: error.message
        });
    }
});

// POST neue Reparatur anlegen
router.post('/', async (req, res) => {
    try {
        const {
            kundeCode,
            datum,
            bemerkung,
            betrag,
            statusCode
        } = req.body;

        const pool = await getPool();
        const result = await pool.request()
            .input('kundeCode', sql.Int, kundeCode)
            .input('datum', sql.DateTime, datum || new Date())
            .input('bemerkung', sql.NVarChar, bemerkung || '')
            .input('betrag', sql.Decimal(18, 2), betrag || 100.00)
            .input('statusCode', sql.Int, statusCode || 1)
            .query(`
                INSERT INTO dbo.Auftrag (KundeCode, Datum, Bemerkung, Betrag, StatusCode, Angelegt)
                OUTPUT INSERTED.Code
                VALUES (@kundeCode, @datum, @bemerkung, @betrag, @statusCode, GETDATE())
            `);

        res.status(201).json({
            success: true,
            message: 'Reparatur erfolgreich angelegt',
            code: result.recordset[0].Code
        });
    } catch (error) {
        console.error('Fehler beim Anlegen der Reparatur:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Anlegen der Reparatur',
            error: error.message
        });
    }
});

// PATCH Reparatur aktualisieren
router.patch('/:code', async (req, res) => {
    try {
        const { datum, bemerkung, betrag, statusCode } = req.body;

        const pool = await getPool();
        await pool.request()
            .input('code', sql.Int, req.params.code)
            .input('datum', sql.DateTime, datum)
            .input('bemerkung', sql.NVarChar, bemerkung)
            .input('betrag', sql.Decimal(18, 2), betrag)
            .input('statusCode', sql.Int, statusCode)
            .query(`
                UPDATE dbo.Auftrag
                SET Datum = @datum,
                    Bemerkung = @bemerkung,
                    Betrag = @betrag,
                    StatusCode = @statusCode
                WHERE Code = @code
            `);

        res.json({
            success: true,
            message: 'Reparatur erfolgreich aktualisiert'
        });
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Reparatur:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Aktualisieren der Reparatur',
            error: error.message
        });
    }
});

// GET Reparatur-Statistiken
router.get('/stats/overview', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT
                COUNT(*) as Gesamt,
                SUM(CASE WHEN ast.Name LIKE '%geplant%' THEN 1 ELSE 0 END) as Geplant,
                SUM(CASE WHEN ast.Name LIKE '%durchgeführt%' OR ast.Name = 'Abgeschlossen' THEN 1 ELSE 0 END) as Abgeschlossen,
                SUM(CASE WHEN a.Datum >= GETDATE() THEN 1 ELSE 0 END) as Zukuenftig,
                SUM(CASE WHEN a.Datum < GETDATE() AND ast.Name NOT LIKE '%Abgeschlossen%' THEN 1 ELSE 0 END) as Ueberfaellig
            FROM dbo.Auftrag a
            LEFT JOIN dbo.Auftragsstatus ast ON a.StatusCode = ast.Code
            WHERE a.Datum >= DATEADD(month, -6, GETDATE())
        `);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Statistiken:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen der Statistiken',
            error: error.message
        });
    }
});

// GET Anstehende Termine (für Outlook-Integration vorbereitet)
router.get('/appointments/upcoming', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT TOP 50
                a.Code as AuftragCode,
                a.Datum as Termin,
                k.Name as KundeName,
                k.Vorname as KundeVorname,
                k.Strasse,
                k.PLZ,
                k.Ort,
                k.Telefon,
                ast.Name as Status,
                a.Bemerkung
            FROM dbo.Auftrag a
            LEFT JOIN dbo.KAnsprechp k ON a.KundeCode = k.Code
            LEFT JOIN dbo.Auftragsstatus ast ON a.StatusCode = ast.Code
            WHERE a.Datum >= GETDATE()
            ORDER BY a.Datum ASC
        `);

        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length,
            note: 'PLATZHALTER: Später mit Outlook-API synchronisieren'
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Termine:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen der Termine',
            error: error.message
        });
    }
});

// GET Routenoptimierung-Vorschau (Platzhalter)
router.get('/route/optimize', async (req, res) => {
    try {
        const { date } = req.query;

        const pool = await getPool();
        const result = await pool.request()
            .input('date', sql.Date, date || new Date())
            .query(`
                SELECT
                    a.Code as AuftragCode,
                    a.Datum,
                    k.Name as KundeName,
                    k.Strasse,
                    k.PLZ,
                    k.Ort,
                    a.Bemerkung
                FROM dbo.Auftrag a
                LEFT JOIN dbo.KAnsprechp k ON a.KundeCode = k.Code
                WHERE CAST(a.Datum AS DATE) = @date
                ORDER BY a.Datum
            `);

        // PLATZHALTER: Hier später Routenoptimierung implementieren
        // z.B. mit Google Maps API oder GraphHopper

        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length,
            note: 'PLATZHALTER: Routenoptimierung noch nicht implementiert',
            placeholder: {
                algorithm: 'Geografische Optimierung (zukünftig)',
                provider: 'Google Maps API / GraphHopper (zukünftig)'
            }
        });
    } catch (error) {
        console.error('Fehler bei der Routenoptimierung:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Routenoptimierung',
            error: error.message
        });
    }
});

module.exports = router;
