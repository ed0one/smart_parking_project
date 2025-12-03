const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors()); // Permite frontend-ului (port 3001) să apeleze backend-ul (port 3000)
app.use(express.json());

// --- 1. Rute Auth ---
app.post('/api/auth/login', async (req, res) => {
    const { email, parola } = req.body;
    try {
        const result = await db.execute(
            `SELECT id_utilizator, nume, email FROM utilizatori WHERE email = :email AND parola = :parola`,
            [email, parola]
        );
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Frontend-ul se așteaptă la chei cu litere mici sau mari, depinde de Oracle (returnează UPPERCASE)
            // Adaptăm răspunsul:
            res.json({
                idUtilizator: user.ID_UTILIZATOR,
                nume: user.NUME,
                email: user.EMAIL
            });
        } else {
            res.status(401).json({ error: 'Email sau parolă incorectă' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { nume, prenume, email, parola } = req.body;
    try {
        // Verificăm dacă există deja
        const check = await db.execute(`SELECT 1 FROM utilizatori WHERE email = :email`, [email]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Email deja folosit' });
        }

        // Inserăm (ID-ul e generat automat de secvență/trigger în Oracle)
        // Nota: Vom folosi un sequence în SQL
        await db.execute(
            `INSERT INTO utilizatori (nume, prenume, email, parola) VALUES (:nume, :prenume, :email, :parola)`,
            [nume, prenume, email, parola]
        );
        res.json({ message: 'Cont creat cu succes' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2. Rute Parcari & Locuri ---
app.get('/api/parcari', async (req, res) => {
    try {
        const result = await db.execute(`SELECT * FROM parcari`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint complex pentru Dashboard
app.get('/api/parcare-completa/:id', async (req, res) => {
    const idParcare = req.params.id;
    try {
        const parcareResult = await db.execute(`SELECT * FROM parcari WHERE id_parcare = :id`, [idParcare]);
        const zoneResult = await db.execute(`SELECT * FROM zone WHERE id_parcare = :id`, [idParcare]);
        
        // Luăm locurile pentru toate zonele acestei parcări
        // Putem face un JOIN, dar pentru simplitate facem query separat
        const locuriResult = await db.execute(
            `SELECT l.* FROM locuri l 
             JOIN zone z ON l.id_zona = z.id_zona 
             WHERE z.id_parcare = :id ORDER BY l.id_loc`, 
            [idParcare]
        );

        // Structurăm datele cum vrea Frontend-ul
        const zoneCuLocuri = zoneResult.rows.map(zona => {
            return {
                ...zona,
                locuri: locuriResult.rows.filter(loc => loc.ID_ZONA === zona.ID_ZONA)
            };
        });

        res.json({
            parcare: parcareResult.rows[0],
            zone: zoneCuLocuri
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/locuri/:id/rezervare', async (req, res) => {
    const idLoc = req.params.id;
    const { numarInmatriculare, dataStart, dataEnd, pret } = req.body;
    
    // Convertim datele ISO string in Date object pentru Oracle (sau Timestamp)
    // Oracle preferă TO_TIMESTAMP sau date objects
    const start = new Date(dataStart);
    const end = new Date(dataEnd);

    try {
        // Actualizăm statusul locului
        await db.execute(`UPDATE locuri SET statuscurent = 'Ocupat' WHERE id_loc = :id`, [idLoc]);
        
        // Găsim ID-ul vehiculului pe baza numărului
        const vehiculRes = await db.execute(
            `SELECT id_vehicul, id_utilizator FROM vehicule WHERE numarinmatriculare = :nr`, 
            [numarInmatriculare]
        );
        
        if (vehiculRes.rows.length === 0) {
            return res.status(404).json({ error: 'Vehiculul nu a fost găsit' });
        }
        
        const vehicul = vehiculRes.rows[0];

        // Inserăm rezervarea
        await db.execute(
            `INSERT INTO rezervari (id_utilizator, id_loc, id_vehicul, data_inceput, data_sfarsit, pret_total, status)
             VALUES (:uid, :lid, :vid, :dstart, :dend, :pret, 'Confirmata')`,
            {
                uid: vehicul.ID_UTILIZATOR,
                lid: idLoc,
                vid: vehicul.ID_VEHICUL,
                dstart: start,
                dend: end,
                pret: pret
            }
        );

        res.json({ message: 'Rezervare efectuată' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/locuri/:id/simulare', async (req, res) => {
    const idLoc = req.params.id;
    const { status } = req.body; // 'Liber' sau 'Ocupat'
    try {
        await db.execute(`UPDATE locuri SET statuscurent = :status WHERE id_loc = :id`, [status, idLoc]);
        res.json({ message: 'Status actualizat' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. Rute Utilizator ---
app.get('/api/user/:id/vehicule', async (req, res) => {
    try {
        const result = await db.execute(`SELECT * FROM vehicule WHERE id_utilizator = :id`, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/user/vehicule', async (req, res) => {
    const { idUtilizator, numarInmatriculare, marca, model } = req.body;
    try {
        await db.execute(
            `INSERT INTO vehicule (id_utilizator, numarinmatriculare, marca, model) 
             VALUES (:uid, :nr, :marca, :model)`,
            [idUtilizator, numarInmatriculare, marca, model]
        );
        res.json({ message: 'Vehicul adăugat' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/user/:id/abonamente', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT a.*, t.numezona, v.numarinmatriculare 
             FROM abonamente a
             JOIN tarife t ON a.id_tarif = t.id_tarif
             JOIN vehicule v ON a.id_vehicul = v.id_vehicul
             WHERE a.id_utilizator = :id`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/user/abonamente', async (req, res) => {
    const { idUtilizator, idVehicul, idTarif } = req.body;
    const dataStart = new Date();
    const dataExp = new Date();
    dataExp.setMonth(dataExp.getMonth() + 1); // +1 lună

    try {
        await db.execute(
            `INSERT INTO abonamente (id_utilizator, id_vehicul, id_tarif, datastartvalabilitate, dataexpirare, status)
             VALUES (:uid, :vid, :tid, :dstart, :dexp, 'Activ')`,
            {
                uid: idUtilizator,
                vid: idVehicul,
                tid: idTarif,
                dstart: dataStart,
                dexp: dataExp
            }
        );
        res.json({ message: 'Abonament cumpărat' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. Rute Tarife ---
app.get('/api/tarife/abonamente', async (req, res) => {
    try {
        const result = await db.execute(`SELECT * FROM tarife`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Health Check ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Pornire Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});