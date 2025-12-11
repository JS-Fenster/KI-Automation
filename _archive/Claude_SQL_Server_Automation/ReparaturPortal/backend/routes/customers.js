const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/database');

// GET alle Kunden
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT TOP 1000
                    KAnsprechpCode as Code,
                    Name,
                    Vorname,
                    Telefon,
                    [E-Mail] as EMail,
                    Straße as Strasse,
                    Plz as PLZ,
                    Ort,
                    Erstkontakt as Angelegt
                FROM dbo.KAnsprechp
                ORDER BY Erstkontakt DESC
            `);

        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Kunden:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen der Kunden',
            error: error.message
        });
    }
});

// GET einzelner Kunde
router.get('/:code', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('code', sql.Int, req.params.code)
            .query(`
                SELECT *
                FROM dbo.KAnsprechp
                WHERE KAnsprechpCode = @code
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kunde nicht gefunden'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Fehler beim Abrufen des Kunden:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen des Kunden',
            error: error.message
        });
    }
});

// POST neuen Kunden anlegen
router.post('/', async (req, res) => {
    try {
        const { name, vorname, telefon, email, strasse, plz, ort } = req.body;

        const pool = await getPool();
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('vorname', sql.NVarChar, vorname || '')
            .input('telefon', sql.NVarChar, telefon || '')
            .input('email', sql.NVarChar, email || '')
            .input('strasse', sql.NVarChar, strasse || '')
            .input('plz', sql.NVarChar, plz || '')
            .input('ort', sql.NVarChar, ort || '')
            .query(`
                INSERT INTO dbo.KAnsprechp (Name, Vorname, Telefon, [E-Mail], Straße, Plz, Ort, Erstkontakt)
                OUTPUT INSERTED.KAnsprechpCode as Code
                VALUES (@name, @vorname, @telefon, @email, @strasse, @plz, @ort, GETDATE())
            `);

        res.status(201).json({
            success: true,
            message: 'Kunde erfolgreich angelegt',
            code: result.recordset[0].Code
        });
    } catch (error) {
        console.error('Fehler beim Anlegen des Kunden:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Anlegen des Kunden',
            error: error.message
        });
    }
});

// PATCH Kunde aktualisieren
router.patch('/:code', async (req, res) => {
    try {
        const { name, vorname, telefon, email, strasse, plz, ort } = req.body;

        const pool = await getPool();
        await pool.request()
            .input('code', sql.Int, req.params.code)
            .input('name', sql.NVarChar, name)
            .input('vorname', sql.NVarChar, vorname)
            .input('telefon', sql.NVarChar, telefon)
            .input('email', sql.NVarChar, email)
            .input('strasse', sql.NVarChar, strasse)
            .input('plz', sql.NVarChar, plz)
            .input('ort', sql.NVarChar, ort)
            .query(`
                UPDATE dbo.KAnsprechp
                SET Name = @name,
                    Vorname = @vorname,
                    Telefon = @telefon,
                    [E-Mail] = @email,
                    Straße = @strasse,
                    Plz = @plz,
                    Ort = @ort,
                    LetzteÄnderung = GETDATE()
                WHERE KAnsprechpCode = @code
            `);

        res.json({
            success: true,
            message: 'Kunde erfolgreich aktualisiert'
        });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Kunden:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Aktualisieren des Kunden',
            error: error.message
        });
    }
});

// GET Kunden suchen
router.get('/search/:term', async (req, res) => {
    try {
        const searchTerm = `%${req.params.term}%`;
        const pool = await getPool();
        const result = await pool.request()
            .input('term', sql.NVarChar, searchTerm)
            .query(`
                SELECT TOP 50
                    KAnsprechpCode as Code,
                    Name,
                    Vorname,
                    Telefon,
                    [E-Mail] as EMail,
                    Straße as Strasse,
                    Plz as PLZ,
                    Ort
                FROM dbo.KAnsprechp
                WHERE Name LIKE @term
                   OR Vorname LIKE @term
                   OR Telefon LIKE @term
                   OR [E-Mail] LIKE @term
                ORDER BY Name
            `);

        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Fehler bei der Kundensuche:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Kundensuche',
            error: error.message
        });
    }
});

module.exports = router;
