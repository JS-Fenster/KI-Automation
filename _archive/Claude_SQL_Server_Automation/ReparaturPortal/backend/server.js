const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { getPool, closePool } = require('./config/database');

// Import Routes
const customersRouter = require('./routes/customers');
const repairsRouter = require('./routes/repairs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Reparatur-Portal Backend läuft',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/repairs', repairsRouter);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint nicht gefunden',
        path: req.path
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server Fehler:', err);
    res.status(500).json({
        success: false,
        message: 'Interner Server-Fehler',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Server starten
const startServer = async () => {
    try {
        // Teste Datenbankverbindung
        await getPool();
        console.log('✅ Datenbankverbindung erfolgreich');

        app.listen(PORT, () => {
            console.log('');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('  🔧 Reparatur-Portal Backend gestartet');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`  🌐 Server läuft auf: http://localhost:${PORT}`);
            console.log(`  📊 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`  👥 Kunden API: http://localhost:${PORT}/api/customers`);
            console.log(`  🔧 Reparatur API: http://localhost:${PORT}/api/repairs`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Fehler beim Starten des Servers:', error);
        process.exit(1);
    }
};

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Server wird heruntergefahren...');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Server wird heruntergefahren...');
    await closePool();
    process.exit(0);
});

// Server starten
startServer();

module.exports = app;
