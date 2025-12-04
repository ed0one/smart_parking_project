const cron = require('node-cron'); // <--- ADAUGA ASTA SUS DE TOT
const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- CRON JOB: Verificare automată la fiecare minut ---
cron.schedule('* * * * *', async () => {
    console.log('Running Check: Eliberare locuri expirate...');
    try {
        // 1. Găsim rezervările care au expirat (Data Sfarsit < Acum) și sunt încă 'Confirmata'
        const expired = await db.execute(
            `SELECT id_rezervare, id_loc FROM rezervari 
             WHERE status = 'Confirmata' AND data_sfarsit < SYSDATE`
        );

        if (expired.rows.length > 0) {
            console.log(`Găsite ${expired.rows.length} rezervări expirate. Se eliberează...`);

            for (const row of expired.rows) {
                // Update Status Rezervare
                await db.execute(
                    `UPDATE rezervari SET status = 'Finalizata' WHERE id_rezervare = :id`,
                    { id: row.ID_REZERVARE }
                );

                // Update Status Loc -> Liber
                await db.execute(
                    `UPDATE locuri SET statuscurent = 'Liber' WHERE id_loc = :id`,
                    { id: row.ID_LOC }
                );
            }
            console.log('Locuri eliberate cu succes.');
        }
    } catch (err) {
        console.error('Eroare Cron Job:', err);
    }
});

// --- 1. Rute Auth ---
app.post('/api/auth/login', async (req, res) => {
    const { email, parola } = req.body;
    try {
        // NOU: Selectam si PRENUME
        const result = await db.execute(
            `SELECT id_utilizator, nume, prenume, email FROM utilizatori WHERE email = :email AND parola = :parola`,
            { email: email, parola: parola }
        );
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({
                idUtilizator: user.ID_UTILIZATOR,
                nume: user.NUME,
                prenume: user.PRENUME, // NOU: Trimitem prenumele
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
             const firstParking = await db.execute(`SELECT * FROM parcari FETCH FIRST 1 ROWS ONLY`);
             if (firstParking.rows.length > 0) {
                 return res.json({ redirect: firstParking.rows[0].ID_PARCARE });
             }
             return res.status(404).json({ error: 'Nu exista parcari in sistem' });
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
        const locCheck = await db.execute(`SELECT statuscurent FROM locuri WHERE id_loc = :id`, { id: idLoc });
        if (locCheck.rows.length === 0 || locCheck.rows[0].STATUSCURENT !== 'Liber') {
             return res.status(400).json({ error: 'Locul nu este disponibil.' });
        }

        const vehiculRes = await db.execute(
            `SELECT id_vehicul, id_utilizator FROM vehicule WHERE numarinmatriculare = :nr`, 
            { nr: numarInmatriculare }
        );
        
        if (vehiculRes.rows.length === 0) {
            return res.status(404).json({ error: 'Vehiculul nu a fost găsit' });
        }
        
        const vehicul = vehiculRes.rows[0];
        const userRes = await db.execute(`SELECT balanta FROM utilizatori WHERE id_utilizator = :id`, { id: vehicul.ID_UTILIZATOR });
        if (userRes.rows[0].BALANTA < pret) {
             return res.status(400).json({ error: 'Fonduri insuficiente pentru rezervare.' });
        }

        await db.execute(
            `UPDATE utilizatori SET balanta = balanta - :pret WHERE id_utilizator = :id`,
            { pret: pret, id: vehicul.ID_UTILIZATOR }
        );

        await db.execute(`UPDATE locuri SET statuscurent = 'Rezervat' WHERE id_loc = :id`, { id: idLoc });
        
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

        await db.execute(
            `INSERT INTO plati (id_utilizator, suma, status_plata, metoda_plata) 
             VALUES (:user_id, :suma, 'Reusit', 'Portofel - Rezervare')`,
            { user_id: vehicul.ID_UTILIZATOR, suma: pret }
        );

        res.json({ message: 'Rezervare efectuată cu succes!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/rezervari/:id/finalizeaza', async (req, res) => {
    const idRezervare = req.params.id;
    try {
        // 1. Luam ID-ul locului asociat
        const rezResult = await db.execute(
            `SELECT id_loc, status FROM rezervari WHERE id_rezervare = :id`,
            { id: idRezervare }
        );

        if (rezResult.rows.length === 0) return res.status(404).json({ error: 'Rezervare negăsită' });
        if (rezResult.rows[0].STATUS !== 'Confirmata') return res.status(400).json({ error: 'Rezervarea este deja finalizată' });

        const idLoc = rezResult.rows[0].ID_LOC;

        // 2. Actualizam rezervarea
        await db.execute(
            `UPDATE rezervari SET status = 'Finalizata', data_sfarsit = SYSDATE WHERE id_rezervare = :id`,
            { id: idRezervare }
        );

        // 3. Eliberam locul
        await db.execute(
            `UPDATE locuri SET statuscurent = 'Liber' WHERE id_loc = :id`,
            { id: idLoc }
        );

        res.json({ message: 'Loc eliberat cu succes! Mulțumim.' });

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
            { user_id: idUtilizator, nr_inmat: numarInmatriculare, marca_auto: marca, model_auto: model }
        );
        res.json({ message: 'Vehicul adăugat' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- NOU: Ruta pentru a vedea REZERVARILE userului ---
app.get('/api/user/:id/rezervari', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT r.*, l.numarloc, p.numeparcare, v.numarinmatriculare 
             FROM rezervari r
             JOIN locuri l ON r.id_loc = l.id_loc
             JOIN zone z ON l.id_zona = z.id_zona
             JOIN parcari p ON z.id_parcare = p.id_parcare
             JOIN vehicule v ON r.id_vehicul = v.id_vehicul
             WHERE r.id_utilizator = :id
             ORDER BY r.data_sfarsit DESC`,
            { id: req.params.id }
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. Rute Abonamente & Portofel ---

app.get('/api/user/:id/abonamente', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT a.*, t.numezona, t.descriere, v.numarinmatriculare 
             FROM abonamente a
             JOIN tarife t ON a.id_tarif = t.id_tarif
             JOIN vehicule v ON a.id_vehicul = v.id_vehicul
             WHERE a.id_utilizator = :id AND a.dataexpirare > SYSDATE
             ORDER BY a.dataexpirare DESC`,
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
        const checkExisting = await db.execute(
            `SELECT 1 FROM abonamente 
             WHERE id_utilizator = :user_id 
             AND id_tarif = :tarif_id 
             AND status = 'Activ' 
             AND dataexpirare > SYSDATE`,
            { user_id: idUtilizator, tarif_id: idTarif }
        );

        if (checkExisting.rows.length > 0) {
            return res.status(400).json({ error: 'Aveți deja un abonament activ de acest tip!' });
        }

        const tarifRes = await db.execute(`SELECT valoare, durata_zile FROM tarife WHERE id_tarif = :id`, { id: idTarif });
        if (tarifRes.rows.length === 0) return res.status(404).json({ error: 'Tarif inexistent' });
        
        const pret = tarifRes.rows[0].VALOARE;
        const zile = tarifRes.rows[0].DURATA_ZILE || 30;

        const userRes = await db.execute(`SELECT balanta FROM utilizatori WHERE id_utilizator = :id`, { id: idUtilizator });
        const balantaCurenta = userRes.rows[0].BALANTA;

        if (balantaCurenta < pret) {
            return res.status(400).json({ error: `Fonduri insuficiente! Ai ${balantaCurenta} RON, necesar ${pret} RON.` });
        }

        await db.execute(
            `UPDATE utilizatori SET balanta = balanta - :pret WHERE id_utilizator = :id`,
            { pret: pret, id: idUtilizator }
        );

        const dataStart = new Date();
        const dataExp = new Date();
        dataExp.setDate(dataExp.getDate() + zile);
        
        await db.execute(
            `INSERT INTO abonamente (id_utilizator, id_vehicul, id_tarif, datastartvalabilitate, dataexpirare, status)
             VALUES (:user_id, :veh_id, :tarif_id, :dstart, :dend, 'Activ')`,
            { user_id: idUtilizator, veh_id: idVehicul, tarif_id: idTarif, dstart: dataStart, dend: dataExp }
        );

        await db.execute(
            `INSERT INTO plati (id_utilizator, suma, status_plata, metoda_plata) 
             VALUES (:user_id, :suma, 'Reusit', 'Portofel - Abonament')`,
            { user_id: idUtilizator, suma: pret }
        );

        res.json({ message: 'Abonament activat cu succes!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- 5. RUTE ADMIN (NOU) ---

// Statistici Generale
app.get('/api/admin/stats', async (req, res) => {
    try {
        const users = await db.execute(`SELECT COUNT(*) AS total FROM utilizatori`);
        const revenue = await db.execute(`SELECT SUM(suma) AS total FROM plati WHERE status_plata = 'Reusit'`);
        const activeSubs = await db.execute(`SELECT COUNT(*) AS total FROM abonamente WHERE status = 'Activ'`);
        const parkedCars = await db.execute(`SELECT COUNT(*) AS total FROM locuri WHERE statuscurent = 'Ocupat'`);

        res.json({
            totalUsers: users.rows[0].TOTAL,
            totalRevenue: revenue.rows[0].TOTAL || 0,
            activeSubscriptions: activeSubs.rows[0].TOTAL,
            currentOccupancy: parkedCars.rows[0].TOTAL
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lista Utilizatori
app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT id_utilizator, nume, prenume, email, rol, balanta, TO_CHAR(data_inregistrare, 'DD-MM-YYYY') as data_reg 
             FROM utilizatori ORDER BY id_utilizator DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sterge Utilizator (Admin)
app.delete('/api/admin/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        // Stergem tot ce tine de user pentru a pastra consistenta (sau folosim CASCADE in DB)
        // Aici facem cleanup manual pentru siguranta
        await db.execute(`DELETE FROM rezervari WHERE id_utilizator = :id`, { id: userId });
        await db.execute(`DELETE FROM abonamente WHERE id_utilizator = :id`, { id: userId });
        await db.execute(`DELETE FROM plati WHERE id_utilizator = :id`, { id: userId });
        await db.execute(`DELETE FROM vehicule WHERE id_utilizator = :id`, { id: userId });
        await db.execute(`DELETE FROM utilizatori WHERE id_utilizator = :id`, { id: userId });
        
        res.json({ message: 'Utilizator șters cu succes.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Istoric Plati (Toate)
app.get('/api/admin/plati', async (req, res) => {
    try {
        // Luam ultimele 50 de plati
        const result = await db.execute(
            `SELECT p.*, u.nume, u.prenume, TO_CHAR(p.data_plata, 'DD-MM-YYYY HH24:MI') as data_fmt 
             FROM plati p
             JOIN utilizatori u ON p.id_utilizator = u.id_utilizator
             ORDER BY p.data_plata DESC FETCH FIRST 50 ROWS ONLY`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Management Locuri (Schimba status Mentenanta/Liber)
app.post('/api/admin/locuri/:id/toggle', async (req, res) => {
    const idLoc = req.params.id;
    try {
        const loc = await db.execute(`SELECT statuscurent FROM locuri WHERE id_loc = :id`, { id: idLoc });
        if (loc.rows.length === 0) return res.status(404).json({ error: 'Loc inexistent' });

        const currentStatus = loc.rows[0].STATUSCURENT;
        let newStatus = currentStatus === 'Mentenanta' ? 'Liber' : 'Mentenanta';
        
        // Daca e ocupat, nu il punem in mentenanta direct (optional)
        if (currentStatus === 'Ocupat' || currentStatus === 'Rezervat') {
             return res.status(400).json({ error: 'Nu poți pune în mentenanță un loc ocupat.' });
        }

        await db.execute(`UPDATE locuri SET statuscurent = :status WHERE id_loc = :id`, { status: newStatus, id: idLoc });
        res.json({ message: `Locul este acum: ${newStatus}`, newStatus });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. TARIFE (GET & UPDATE)
// GET e deja definit la public, dar facem unul de admin daca vrem detalii extra, 
// momentan folosim cel public pentru lista, dar avem nevoie de UPDATE.
app.put('/api/admin/tarife/:id', async (req, res) => {
    const idTarif = req.params.id;
    const { valoare } = req.body;
    
    if (!valoare || valoare <= 0) return res.status(400).json({ error: 'Valoare invalidă' });

    try {
        await db.execute(
            `UPDATE tarife SET valoare = :val WHERE id_tarif = :id`, 
            { val: valoare, id: idTarif }
        );
        res.json({ message: 'Tarif actualizat cu succes!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. RECENZII (GET)
app.get('/api/admin/recenzii', async (req, res) => {
    try {
        // Dacă nu ai tabela RECENZII creată, va da eroare, dar presupunem că ai rulat scriptul complet
        // Facem JOIN ca să vedem cine a scris și despre ce parcare
        const result = await db.execute(
            `SELECT r.*, u.nume, u.prenume, p.numeparcare, TO_CHAR(r.data_recenzie, 'DD-MM-YYYY') as data_fmt
             FROM recenzii r
             JOIN utilizatori u ON r.id_utilizator = u.id_utilizator
             JOIN parcari p ON r.id_parcare = p.id_parcare
             ORDER BY r.data_recenzie DESC`
        );
        res.json(result.rows);
    } catch (err) {
        // Returnam array gol daca nu exista tabela sau date, ca sa nu crape frontend-ul
        res.json([]); 
    }
});

// 3. MENTENANTA (GET & RESOLVE)
app.get('/api/admin/mentenanta', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT m.*, l.numarloc, p.numeparcare, TO_CHAR(m.data_raportarii, 'DD-MM-YYYY') as data_fmt
             FROM mentenanta m
             JOIN locuri l ON m.id_loc = l.id_loc
             JOIN zone z ON l.id_zona = z.id_zona
             JOIN parcari p ON z.id_parcare = p.id_parcare
             ORDER BY m.status ASC, m.data_raportarii DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/admin/mentenanta/:id/rezolva', async (req, res) => {
    const idMentenanta = req.params.id;
    try {
        // 1. Luam ID-ul locului
        const tichet = await db.execute(`SELECT id_loc FROM mentenanta WHERE id_mentenanta = :id`, {id: idMentenanta});
        if (tichet.rows.length === 0) return res.status(404).json({error: 'Tichet inexistent'});
        
        const idLoc = tichet.rows[0].ID_LOC;

        // 2. Actualizam tichetul ca Rezolvat
        await db.execute(
            `UPDATE mentenanta SET status = 'Rezolvat', data_rezolvarii = SYSDATE WHERE id_mentenanta = :id`,
            { id: idMentenanta }
        );

        // 3. Punem locul inapoi pe LIBER
        await db.execute(
            `UPDATE locuri SET statuscurent = 'Liber' WHERE id_loc = :id`,
            { id: idLoc }
        );

        res.json({ message: 'Problemă rezolvată! Locul este din nou liber.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Istoric Modificari Tarife
app.get('/api/admin/istoric-tarife', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT * FROM ISTORIC_TARIFE ORDER BY DATA_MODIFICARII DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});