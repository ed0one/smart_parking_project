const oracledb = require('oracledb');
require('dotenv').config();

// Modul "Thin" - nu necesită instalarea altor client libraries de la Oracle, e mai simplu
try {
  oracledb.initOracleClient({ libDir: process.env.ORACLE_LIB_DIR }); 
} catch (err) {
  // Ignorăm eroarea dacă suntem în modul thin implicit
}

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // Returnează rezultatele ca obiecte JSON, nu vectori
oracledb.autoCommit = true; // Commit automat la INSERT/UPDATE

async function execute(sql, binds = [], opts = {}) {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
    });

    const result = await connection.execute(sql, binds, opts);
    return result;
  } catch (err) {
    console.error("Eroare Oracle:", err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Eroare la închiderea conexiunii:", err);
      }
    }
  }
}

module.exports = { execute };