// src/LocuriGrid.js
import React from 'react';
import './LocuriGrid.css';
// --- MODIFICARE: Am ȘTERS 'import { useAuth }' ---

// --- MODIFICARE: Primim 'vehiculPrincipal' ca prop ---
function LocuriGrid({ locuri, onRefresh, vehiculPrincipal }) {

    // --- MODIFICARE: Am ȘTERS 'const { user } = useAuth();' ---

    const handleLocClick = async (loc) => {
        const statusCurent = loc.STATUSCURENT;
        let statusNou;

        if (statusCurent === 'Liber') {
            statusNou = 'Ocupat';
        } else if (statusCurent === 'Ocupat') {
            statusNou = 'Liber';
        } else {
            console.log('Locul este în mentenanță, nu se poate schimba.');
            return;
        }

        // --- MODIFICARE: Folosim vehiculul real al utilizatorului ---
        // Verificăm dacă utilizatorul are măcar o mașină
        if (statusNou === 'Ocupat' && !vehiculPrincipal) {
            alert('Eroare: Nu aveți niciun vehicul înregistrat pentru a parca.');
            return;
        }

        // Folosim numărul mașinii principale a utilizatorului logat
        const numarInmatriculareSimulat = vehiculPrincipal?.NUMARINMATRICULARE;

        try {
            const response = await fetch(`http://localhost:3000/api/locuri/${loc.ID_LOC}/simulare`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: statusNou,
                    // Trimitem numărul mașinii doar dacă ocupăm locul
                    numarInmatriculare: statusNou === 'Ocupat' ? numarInmatriculareSimulat : null
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`Eroare de la server: ${data.error}`);
                return;
            }

            console.log('Simulare reușită:', data.message);
            onRefresh(); // Reîmprospătăm grila

        } catch (error) {
            console.error('Eroare la simularea clicului:', error);
            alert('A apărut o eroare de rețea.');
        }
    };

    return (
        <div className="locuri-container">
            <div className="locuri-grid">
                {locuri.map(loc => (
                    <div
                        key={loc.ID_LOC}
                        onClick={() => handleLocClick(loc)}
                        className={`
              loc-parcare 
              ${loc.STATUSCURENT.toLowerCase()}
              ${loc.TIPZONA.toLowerCase()} 
              ${loc.STATUSCURENT !== 'Mentenanta' ? 'clicabil' : ''}
            `}
                        title={loc.STATUSCURENT !== 'Mentenanta' ? `Clic pentru a schimba starea` : 'Loc în mentenanță'}
                    >
            <span className="loc-numar">
              {(loc.TIPZONA === 'Premium' || loc.TIPZONA === 'VIP') && '★ '}
                {loc.NUMARLOC}
            </span>
                    </div>
                ))}
            </div>

            <div className="legenda">
                <div className="legenda-item"><span className="casuta liber"></span> Liber Standard</div>
                <div className="legenda-item"><span className="casuta ocupat"></span> Ocupat</div>
                <div className="legenda-item"><span className="casuta premium"></span> ★ Loc VIP</div>
                <div className="legenda-item"><span className="casuta mentenanta"></span> Mentenanță</div>
            </div>
        </div>
    );
}

export default LocuriGrid;