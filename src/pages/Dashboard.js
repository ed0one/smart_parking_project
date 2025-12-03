// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { parkingApi } from '../utils/apiClient';
import '../App.css';
import LocuriGrid from '../LocuriGrid.js';
import ParkingSelector from '../components/ParkingSelector';
import ReservationModal from '../components/ReservationModal';

function Dashboard() {

    const [parcareData, setParcareData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [vehicule, setVehicule] = useState([]);
    const [numarNou, setNumarNou] = useState('');
    const [marcaNoua, setMarcaNoua] = useState('');
    const [modelNou, setModelNou] = useState('');
    const [tarife, setTarife] = useState([]);
    const [abonamente, setAbonamente] = useState([]);
    const [selectedParkingId, setSelectedParkingId] = useState(1);
    
    // State pentru carusel
    const [currentTarifIndex, setCurrentTarifIndex] = useState(0);

    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [selectedLocForReservation, setSelectedLocForReservation] = useState(null);

    const { user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const vehiculPrincipal = vehicule.length > 0 ? vehicule[0] : null;

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

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Funcții carusel
    const nextTarif = () => {
        setCurrentTarifIndex((prevIndex) => 
            prevIndex === tarife.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevTarif = () => {
        setCurrentTarifIndex((prevIndex) => 
            prevIndex === 0 ? tarife.length - 1 : prevIndex - 1
        );
    };

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
            toast.info(`Locul ${loc.NUMARLOC} este deja ocupat.`);
            return;
        }
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
        handleRefresh();
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
                <ParkingSelector 
                    selectedParkingId={selectedParkingId}
                    onParkingSelect={handleParkingSelect}
                />

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

                    {/* Secțiunea Abonamente (CARUSEL STILIZAT) */}
                    <div className="abonamente-container" style={{ flex: 1, minWidth: '300px', marginTop: 0 }}>
                        <h2>Abonamente</h2>
                        
                        {tarife.length > 0 ? (
                            <div className="carousel-container">
                                {/* Buton Stânga cu Iconiță Chevron */}
                                <button onClick={prevTarif} className="carousel-nav-button" title="Anterior">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>

                                <div className="tarif-card-carousel">
                                    <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{tarife[currentTarifIndex].DESCRIERE}</h3>
                                    <p style={{ fontStyle: 'italic', color: '#7f8c8d' }}>Zona: {tarife[currentTarifIndex].NUMEZONA}</p>
                                    
                                    <div style={{ margin: '20px 0' }}>
                                        <span className="tarif-pret" style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                            {tarife[currentTarifIndex].VALOARE} 
                                        </span>
                                        <span style={{ fontSize: '1.2rem', color: '#666', marginLeft: '5px' }}>
                                            {tarife[currentTarifIndex].MONEDA}
                                        </span>
                                    </div>

                                    <button 
                                        onClick={() => handleBuyAbonament(tarife[currentTarifIndex].ID_TARIF)} 
                                        className="login-button buy-button" 
                                        style={{ width: '100%' }}
                                    >
                                        Cumpără Acum
                                    </button>
                                    <span className="carousel-counter">
                                        Oferta {currentTarifIndex + 1} din {tarife.length}
                                    </span>
                                </div>

                                {/* Buton Dreapta cu Iconiță Chevron */}
                                <button onClick={nextTarif} className="carousel-nav-button" title="Următor">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <p>Nu există abonamente disponibile.</p>
                        )}

                        <h4>Istoric Abonamente:</h4>
                        <ul className="vehicul-lista abonament-lista">
                            {abonamente.length > 0 ? abonamente.map(ab => (
                                <li key={ab.ID_ABONAMENT}>
                                    <strong>{ab.NUMEZONA}</strong>
                                    <span>Expira: {formatDate(ab.DATAEXPIRARE)}</span>
                                </li>
                            )) : <p style={{fontStyle:'italic', color:'#666'}}>Niciun abonament activ.</p>}
                        </ul>
                    </div>
                </div>
            </div>

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