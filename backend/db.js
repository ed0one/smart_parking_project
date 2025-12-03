const oracledb = require('oracledb');
require('dotenv').config();

// Modul Thin (nu necesită Instant Client instalat)
try {
  oracledb.initOracleClient({ libDir: process.env.ORACLE_LIB_DIR });
} catch (err) {
  // Ignorăm eroarea dacă suntem deja în modul thin
}

// Setări globale pentru formatul răspunsului
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

// Configurare Pool
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
    poolMin: 2,          // Păstrează minim 2 conexiuni deschise
    poolMax: 10,         // Maxim 10 conexiuni simultane (previne ORA-12516)
    poolIncrement: 1,
    poolTimeout: 60      // Închide conexiunile inactive după 60s
};

let poolPromise = null;

// Funcție care returnează pool-ul (îl creează doar dacă nu există)
async function getPool() {
    if (!poolPromise) {
        poolPromise = oracledb.createPool(dbConfig);
    }
    return poolPromise;
}

async function execute(sql, binds = [], opts = {}) {
    let connection;
    try {
        // 1. Obținem pool-ul (o singură dată la pornire)
        const pool = await getPool();
        
        // 2. Împrumutăm o conexiune din pool
        connection = await pool.getConnection();

        // 3. Executăm interogarea
        const result = await connection.execute(sql, binds, opts);
        return result;

    } catch (err) {
        console.error("Eroare Oracle DB:", err);
        throw err;
    } finally {
        // 4. Returnăm conexiunea înapoi în pool (NU o închidem de tot)
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Eroare la eliberarea conexiunii:", err);
            }
        }
    }
}

// Funcție pentru a închide pool-ul la oprirea serverului (Ctrl+C)
async function closePool() {
    try {
        if (poolPromise) {
            const pool = await poolPromise;
            await pool.close();
            console.log('Pool Oracle închis.');
        }
    } catch (err) {
        console.error('Eroare la închiderea pool-ului', err);
    }
}

module.exports = { execute, closePool };