const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false, // Für lokales Netzwerk
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

const getPool = async () => {
    if (!pool) {
        pool = await sql.connect(config);
        console.log('✅ SQL Server verbunden');
    }
    return pool;
};

const closePool = async () => {
    if (pool) {
        await pool.close();
        pool = null;
        console.log('SQL Server Verbindung geschlossen');
    }
};

module.exports = {
    getPool,
    closePool,
    sql
};
