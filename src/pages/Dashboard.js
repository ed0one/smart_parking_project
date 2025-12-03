// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ReservationModal from '../components/ReservationModal';
import ParkingSelector from '../components/ParkingSelector';
import LocuriGrid from '../LocuriGrid';
import { parkingApi } from '../utils/apiClient';
import '../App.css';

function Dashboard() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    // State
    const [parcareData, setParcareData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [vehicule, setVehicule] = useState([]);
    const [abonamente, setAbonamente] = useState([]);
    const [tarife, setTarife] = useState([]);
    const [selectedParkingId, setSelectedParkingId] = useState(1);
    
    // State pentru formulare
    const [numarNou, setNumarNou] = useState('');
    const [marcaNoua, setMarcaNoua] = useState('');
    const [modelNou, setModelNou] = useState('');
    
    // State pentru Modal Rezervare
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [selectedLocForReservation, setSelectedLocForReservation] = useState(null);

    // Vehicul principal (primul din listă)
    const vehiculPrincipal = vehicule.length > 0 ? vehicule[0] : null;

    // --- Data Fetching ---
    const fetchAllData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [dataParcare, dataVehicule, dataAbonamente, dataTarife] = await Promise.all([
                parkingApi.getParcareCompleta(selectedParkingId),
                parkingApi.getUserVehicles(user.idUtilizator),
                parkingApi.getUserSubscriptions(user.idUtilizator),
                parkingApi.getTariffs()
            ]);

            setParcareData(dataParcare);
            setVehicule(dataVehicule);
            setAbonamente(dataAbonamente);
            setTarife(dataTarife);
        } catch (error) {
            console.error(error);
            toast.error('Eroare la încărcarea datelor: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [user, selectedParkingId, toast]);

    // Initial Load
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- Handlers ---

    const handleRefresh = async () => {
        try {
            const data = await parkingApi.getParcareCompleta(selectedParkingId);
            setParcareData(data);
            toast.success('Harta parcării a fost actualizată!');
        } catch (error) {
            toast.error('Eroare la actualizare.');
        }
    };

    const handleParkingSelect = (id) => {
        setSelectedParkingId(id);
        toast.info('Se schimbă parcarea...');
    };

    const handleLocClick = (loc) => {
        if (loc.STATUSCURENT === 'Mentenanta') {
            toast.warning('Acest loc este în mentenanță.');
            return;
        }

        if (loc.STATUSCURENT === 'Ocupat') {
            // Aici am putea adăuga logică pentru a elibera locul dacă e al userului curent
            // Deocamdată doar informăm
            toast.info(`Locul ${loc.NUMARLOC} este deja ocupat.`);
            return;
        }

        // Dacă e liber, deschidem modalul de rezervare
        if (loc.STATUSCURENT === 'Liber') {
            if (!vehiculPrincipal) {
                toast.error('Trebuie să adaugi un vehicul înainte de a rezerva.');
                return;
            }
            setSelectedLocForReservation(loc);
            setIsReservationModalOpen(true);
        }
    };

    const handleReservationComplete = () => {
        setIsReservationModalOpen(false);
        setSelectedLocForReservation(null);
        handleRefresh(); // Reîmprospătăm grila
    };

    const handleAddVehicul = async (e) => {
        e.preventDefault();
        try {
            await parkingApi.addVehicle({
                idUtilizator: user.idUtilizator,
                numarInmatriculare: numarNou.toUpperCase(),
                marca: marcaNoua,
                model: modelNou
            });
            toast.success('Vehicul adăugat cu succes!');
            setNumarNou(''); setMarcaNoua(''); setModelNou('');
            // Refresh doar la vehicule
            const v = await parkingApi.getUserVehicles(user.idUtilizator);
            setVehicule(v);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleBuyAbonament = async (idTarif) => {
        if (!vehiculPrincipal) {
            toast.error('Adaugă un vehicul pentru a cumpăra abonament.');
            return;
        }
        try {
            await parkingApi.buySubscription({
                idUtilizator: user.idUtilizator,
                idVehicul: vehiculPrincipal.ID_VEHICUL,
                idTarif: idTarif
            });
            toast.success('Abonament achiziționat!');
            const subs = await parkingApi.getUserSubscriptions(user.idUtilizator);
            setAbonamente(subs);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- Render Helpers ---
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ro-RO');
    };

    return (
        <div className="App">
            <header className="App-header">
                <div className="header-container">
                    <h1>🅿️ Smart Parking</h1>
                    <div className="user-info">
                        <span>Salut, {user?.NUME || 'Sofer'}!</span>
                        <button onClick={() => navigate('/admin')} className="admin-button">Admin</button>
                        <button onClick={handleLogout} className="logout-button">Logout</button>
                    </div>
                </div>
            </header>

            <div className="container">
                {/* Selector Parcare */}
                <ParkingSelector 
                    selectedParkingId={selectedParkingId}
                    onParkingSelect={handleParkingSelect}
                />

                {/* Grid Parcare */}
                <h2>Harta Locurilor</h2>
                {loading ? (
                    <LoadingSpinner size="large" text="Se încarcă parcarea..." />
                ) : (
                    parcareData && parcareData.zone.map(zona => (
                        <div key={zona.ID_ZONA} className="zona-container">
                            <h3>{zona.NUMEZONA} <small>({zona.TIPZONA})</small></h3>
                            <LocuriGrid
                                locuri={zona.locuri}
                                onLocClick={handleLocClick}
                            />
                        </div>
                    ))
                )}

                <div className="split-view" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '2rem' }}>
                    
                    {/* Secțiunea Vehicule */}
                    <div className="vehicule-container" style={{ flex: 1, minWidth: '300px', marginTop: 0 }}>
                        <h2>Vehiculele Mele</h2>
                        <form onSubmit={handleAddVehicul} className="vehicul-form">
                            <div className="form-grup-inline">
                                <input 
                                    type="text" 
                                    value={numarNou} 
                                    onChange={(e) => setNumarNou(e.target.value)} 
                                    placeholder="Nr. (B-123-XYZ)" 
                                    required 
                                />
                                <input 
                                    type="text" 
                                    value={marcaNoua} 
                                    onChange={(e) => setMarcaNoua(e.target.value)} 
                                    placeholder="Marcă" 
                                />
                                <button type="submit" className="login-button add-button">+</button>
                            </div>
                        </form>
                        <ul className="vehicul-lista">
                            {vehicule.map(v => (
                                <li key={v.ID_VEHICUL}>
                                    <strong>{v.NUMARINMATRICULARE}</strong>
                                    <span>{v.MARCA}</span>
                                </li>
                            ))}
                            {vehicule.length === 0 && <p style={{fontStyle:'italic', color:'#666'}}>Niciun vehicul.</p>}
                        </ul>
                    </div>

                    {/* Secțiunea Abonamente */}
                    <div className="abonamente-container" style={{ flex: 1, minWidth: '300px', marginTop: 0 }}>
                        <h2>Abonamente</h2>
                        <div className="tarife-lista" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
                            {tarife.map(tarif => (
                                <div key={tarif.ID_TARIF} className="tarif-card" style={{padding: '10px'}}>
                                    <h4 style={{margin: '5px 0'}}>{tarif.DESCRIERE}</h4>
                                    <p className="tarif-pret">{tarif.VALOARE} {tarif.MONEDA}</p>
                                    <button onClick={() => handleBuyAbonament(tarif.ID_TARIF)} className="login-button buy-button" style={{fontSize: '0.8rem'}}>
                                        Cumpara
                                    </button>
                                </div>
                            ))}
                        </div>
                        <h4>Istoric Abonamente:</h4>
                        <ul className="vehicul-lista abonament-lista">
                            {abonamente.map(ab => (
                                <li key={ab.ID_ABONAMENT}>
                                    <strong>{ab.NUMEZONA}</strong>
                                    <span>Expira: {formatDate(ab.DATAEXPIRARE)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal Rezervare */}
            <ReservationModal 
                isOpen={isReservationModalOpen}
                onClose={() => setIsReservationModalOpen(false)}
                onReserve={handleReservationComplete}
                loc={selectedLocForReservation}
                vehiculPrincipal={vehiculPrincipal}
            />
        </div>
    );
}

export default Dashboard;