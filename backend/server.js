const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. Rute Auth ---
app.post('/api/auth/login', async (req, res) => {
    const { email, parola } = req.body;
    try {
        const result = await db.execute(
            `SELECT id_utilizator, nume, email FROM utilizatori WHERE email = :email AND parola = :parola`,
            { email: email, parola: parola }
        );
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({
                idUtilizator: user.ID_UTILIZATOR,
                nume: user.NUME,
                email: user.EMAIL
            });
        } else {
            res.status(401).json({ error: 'Email sau parolă incorectă' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { nume, prenume, email, parola } = req.body;
    try {
        const check = await db.execute(`SELECT 1 FROM utilizatori WHERE email = :email`, { email: email });
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Email deja folosit' });
        }

        await db.execute(
            `INSERT INTO utilizatori (nume, prenume, email, parola, balanta) 
             VALUES (:nume, :prenume, :email, :parola, 500)`,
            { nume: nume, prenume: prenume, email: email, parola: parola }
        );
        res.json({ message: 'Cont creat cu succes' });
    } catch (err) {
        console.error(err);
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

app.get('/api/parcare-completa/:id', async (req, res) => {
    const idParcare = req.params.id;
    try {
        const parcareResult = await db.execute(`SELECT * FROM parcari WHERE id_parcare = :id`, { id: idParcare });
        
        if (parcareResult.rows.length === 0) {
             return res.status(404).json({ error: 'Parcarea nu exista' });
        }

        const zoneResult = await db.execute(`SELECT * FROM zone WHERE id_parcare = :id`, { id: idParcare });
        
        const locuriResult = await db.execute(
            `SELECT l.* FROM locuri l 
             JOIN zone z ON l.id_zona = z.id_zona 
             WHERE z.id_parcare = :id ORDER BY l.id_loc`, 
            { id: idParcare }
        );

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
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/locuri/:id/rezervare', async (req, res) => {
    const idLoc = req.params.id;
    const { numarInmatriculare, dataStart, dataEnd, pret } = req.body;
    
    const start = new Date(dataStart);
    const end = new Date(dataEnd);

    try {
        await db.execute(`UPDATE locuri SET statuscurent = 'Ocupat' WHERE id_loc = :id`, { id: idLoc });
        
        const vehiculRes = await db.execute(
            `SELECT id_vehicul, id_utilizator FROM vehicule WHERE numarinmatriculare = :nr`, 
            { nr: numarInmatriculare }
        );
        
        if (vehiculRes.rows.length === 0) {
            return res.status(404).json({ error: 'Vehiculul nu a fost găsit' });
        }
        
        const vehicul = vehiculRes.rows[0];

        // FIX: Am schimbat :uid in :user_id pentru a evita conflictul cu functia UID din Oracle
        await db.execute(
            `INSERT INTO rezervari (id_utilizator, id_loc, id_vehicul, data_inceput, data_sfarsit, pret_total, status)
             VALUES (:user_id, :loc_id, :veh_id, :dstart, :dend, :pret, 'Confirmata')`,
            {
                user_id: vehicul.ID_UTILIZATOR,
                loc_id: idLoc,
                veh_id: vehicul.ID_VEHICUL,
                dstart: start,
                dend: end,
                pret: pret
            }
        );

        res.json({ message: 'Rezervare efectuată' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/locuri/:id/simulare', async (req, res) => {
    const idLoc = req.params.id;
    const { status } = req.body;
    try {
        await db.execute(`UPDATE locuri SET statuscurent = :status WHERE id_loc = :id`, { status: status, id: idLoc });
        res.json({ message: 'Status actualizat' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. Rute Utilizator & Vehicule ---
app.get('/api/user/:id/vehicule', async (req, res) => {
    try {
        const result = await db.execute(`SELECT * FROM vehicule WHERE id_utilizator = :id`, { id: req.params.id });
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
             VALUES (:user_id, :nr_inmat, :marca_auto, :model_auto)`,
            {
                user_id: idUtilizator,
                nr_inmat: numarInmatriculare,
                marca_auto: marca,
                model_auto: model
            }
        );
        res.json({ message: 'Vehicul adăugat' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- 4. Rute Abonamente & Portofel ---

app.get('/api/user/:id/abonamente', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT a.*, t.numezona, v.numarinmatriculare 
             FROM abonamente a
             JOIN tarife t ON a.id_tarif = t.id_tarif
             JOIN vehicule v ON a.id_vehicul = v.id_vehicul
             WHERE a.id_utilizator = :id`,
            { id: req.params.id }
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tarife/abonamente', async (req, res) => {
    try {
        const result = await db.execute(`SELECT * FROM tarife`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Portofel
app.get('/api/user/:id/balanta', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT balanta FROM utilizatori WHERE id_utilizator = :id`,
            { id: req.params.id }
        );
        if (result.rows.length > 0) {
            res.json({ balanta: result.rows[0].BALANTA });
        } else {
            res.status(404).json({ error: 'Utilizator negasit' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/user/wallet/topup', async (req, res) => {
    const { idUtilizator, suma } = req.body;
    
    if (!suma || suma <= 0) return res.status(400).json({ error: 'Suma invalida' });

    try {
        await db.execute(
            `UPDATE utilizatori SET balanta = balanta + :suma WHERE id_utilizator = :id`,
            { suma: suma, id: idUtilizator }
        );

        // FIX: :uid redenumit in :user_id
        await db.execute(
            `INSERT INTO plati (id_utilizator, suma, status_plata, metoda_plata) 
             VALUES (:user_id, :suma, 'Reusit', 'Alimentare')`,
            { user_id: idUtilizator, suma: suma }
        );

        res.json({ message: `Cont alimentat cu ${suma} RON` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/user/abonamente', async (req, res) => {
    const { idUtilizator, idVehicul, idTarif } = req.body;
    
    try {
        const tarifRes = await db.execute(`SELECT valoare, durata_zile FROM tarife WHERE id_tarif = :id`, { id: idTarif });
        if (tarifRes.rows.length === 0) return res.status(404).json({ error: 'Tarif inexistent' });
        
        const pret = tarifRes.rows[0].VALOARE;
        const zile = tarifRes.rows[0].DURATA_ZILE || 30;

        const userRes = await db.execute(`SELECT balanta FROM utilizatori WHERE id_utilizator = :id`, { id: idUtilizator });
        const balantaCurenta = userRes.rows[0].BALANTA;

        if (balantaCurenta < pret) {
            return res.status(400).json({ error: `Fonduri insuficiente! Ai ${balantaCurenta} RON.` });
        }

        await db.execute(
            `UPDATE utilizatori SET balanta = balanta - :pret WHERE id_utilizator = :id`,
            { pret: pret, id: idUtilizator }
        );

        const dataStart = new Date();
        const dataExp = new Date();
        dataExp.setDate(dataExp.getDate() + zile);
        
        // FIX: :uid redenumit in :user_id
        await db.execute(
            `INSERT INTO abonamente (id_utilizator, id_vehicul, id_tarif, datastartvalabilitate, dataexpirare, status)
             VALUES (:user_id, :veh_id, :tarif_id, :dstart, :dexp, 'Activ')`,
            { 
                user_id: idUtilizator, 
                veh_id: idVehicul, 
                tarif_id: idTarif, 
                dstart: dataStart, 
                dexp: dataExp 
            }
        );

        // FIX: :uid redenumit in :user_id
        await db.execute(
            `INSERT INTO plati (id_utilizator, suma, status_plata, metoda_plata) 
             VALUES (:user_id, :suma, 'Reusit', 'Portofel')`,
            { user_id: idUtilizator, suma: pret }
        );

        res.json({ message: 'Abonament cumpărat cu succes!' });

    } catch (err) {
        console.error(err);
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