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
import WalletCard from '../components/WalletCard';

function Dashboard() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [parkingsList, setParkingsList] = useState([]);
    const [selectedParkingId, setSelectedParkingId] = useState(null);
    const [parcareData, setParcareData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [vehicule, setVehicule] = useState([]);
    const [abonamente, setAbonamente] = useState([]);
    
    // NOU: State pentru rezervări
    const [rezervari, setRezervari] = useState([]);

    const [tarife, setTarife] = useState([]);
    const [balance, setBalance] = useState(0);

    const [numarNou, setNumarNou] = useState('');
    const [marcaNoua, setMarcaNoua] = useState('');
    const [modelNou, setModelNou] = useState('');
    
    const [currentTarifIndex, setCurrentTarifIndex] = useState(0);
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [selectedLocForReservation, setSelectedLocForReservation] = useState(null);

    const vehiculPrincipal = vehicule.length > 0 ? vehicule[0] : null;

    const handleFinishReservation = async (idRezervare) => {
    if (!window.confirm("Ești sigur că vrei să eliberezi locul?")) return;

    try {
        await parkingApi.finishReservation(idRezervare);
        toast.success("Loc eliberat! Sperăm că ți-a plăcut parcarea.");
        handleRefresh(); // Actualizează harta și lista
    } catch (error) {
        toast.error(error.message);
    }
};

    useEffect(() => {
        const initApp = async () => {
            try {
                const lista = await parkingApi.getParcari();
                setParkingsList(lista);
                if (lista && lista.length > 0) {
                    setSelectedParkingId(lista[0].ID_PARCARE);
                } else {
                    setLoading(false);
                    toast.warning('Nu s-au găsit parcări în sistem.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Eroare la conectarea cu serverul.');
                setLoading(false);
            }
        };
        if (user) initApp();
    }, [user]);

    const fetchAllData = useCallback(async () => {
        if (!user || !selectedParkingId) return;
        setLoading(true);
        try {
            // NOU: Fetch rezervări
            const [dataParcare, dataVehicule, dataAbonamente, dataRezervari, dataTarife, dataBalanta] = await Promise.all([
                parkingApi.getParcareCompleta(selectedParkingId),
                parkingApi.getUserVehicles(user.idUtilizator),
                parkingApi.getUserSubscriptions(user.idUtilizator),
                parkingApi.getUserReservations(user.idUtilizator), // <-- AICI
                parkingApi.getTariffs(),
                parkingApi.getBalance(user.idUtilizator)
            ]);

            setParcareData(dataParcare);
            setVehicule(dataVehicule);
            setAbonamente(dataAbonamente);
            setRezervari(dataRezervari); // <-- SETAM REZERVARILE
            setTarife(dataTarife);
            setBalance(dataBalanta.balanta);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedParkingId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const refreshBalance = async () => {
        try {
            const data = await parkingApi.getBalance(user.idUtilizator);
            setBalance(data.balanta);
        } catch (e) { console.error(e); }
    };

    const handleParkingSelect = (id) => {
        setSelectedParkingId(id);
        toast.info('Se schimbă parcarea...');
    };

    const handleRefresh = () => {
        fetchAllData();
        toast.success('Date actualizate!');
    };

    const nextTarif = () => setCurrentTarifIndex(prev => prev === tarife.length - 1 ? 0 : prev + 1);
    const prevTarif = () => setCurrentTarifIndex(prev => prev === 0 ? tarife.length - 1 : prev - 1);

    const handleLocClick = (loc) => {
        if (loc.STATUSCURENT === 'Mentenanta') return toast.warning('Loc în mentenanță.');
        if (loc.STATUSCURENT === 'Ocupat') return toast.info(`Locul ${loc.NUMARLOC} este ocupat.`);
        
        if (!vehiculPrincipal) return toast.error('Adaugă un vehicul pentru a rezerva.');
        
        setSelectedLocForReservation(loc);
        setIsReservationModalOpen(true);
    };

    const handleReservationComplete = () => {
        setIsReservationModalOpen(false);
        setSelectedLocForReservation(null);
        handleRefresh(); 
        refreshBalance(); 
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
            toast.success('Vehicul adăugat!');
            setNumarNou(''); setMarcaNoua(''); setModelNou('');
            const v = await parkingApi.getUserVehicles(user.idUtilizator);
            setVehicule(v);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleBuyAbonament = async (idTarif) => {
        if (!vehiculPrincipal) return toast.error('Adaugă un vehicul mai întâi.');
        try {
            await parkingApi.buySubscription({
                idUtilizator: user.idUtilizator,
                idVehicul: vehiculPrincipal.ID_VEHICUL,
                idTarif: idTarif
            });
            toast.success('Abonament activat!');
            const subs = await parkingApi.getUserSubscriptions(user.idUtilizator);
            setAbonamente(subs);
            refreshBalance();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('ro-RO') : '-';
    const formatTime = (d) => d ? new Date(d).toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'}) : '-';

    return (
        <div className="App">
            <header className="App-header">
                <div className="header-container">
                    <h1>🅿️ Smart Parking</h1>
                    <div className="user-info">
    <span>Salut, {user?.prenume || user?.nume || 'Șofer'}!</span>
    
    {/* MODIFICARE AICI: Verificăm emailul specific */}
    {user?.email === 'edi2004george@gmail.com' && (
        <button onClick={() => navigate('/admin')} className="admin-button">Admin</button>
    )}
    
    <button onClick={handleLogout} className="logout-button">Logout</button>
</div>
                </div>
            </header>

            <div className="container">
                <ParkingSelector 
                    parkings={parkingsList}
                    selectedParkingId={selectedParkingId}
                    onParkingSelect={handleParkingSelect}
                />

                <div className="section-header" style={{marginTop: '2rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2>Harta Locurilor</h2>
                    <button onClick={handleRefresh} className="btn-small btn-small--edit">↻ Actualizează</button>
                </div>

                {loading && !parcareData ? (
                    <LoadingSpinner size="large" text="Se încarcă datele..." />
                ) : (
                    parcareData && parcareData.zone.map(zona => (
                        <div key={zona.ID_ZONA} className="zona-container">
                            <h3>{zona.NUMEZONA} <small style={{color:'#666', fontSize:'0.8em'}}>({zona.TIPZONA})</small></h3>
                            <LocuriGrid
                                locuri={zona.locuri}
                                onLocClick={handleLocClick}
                            />
                        </div>
                    ))
                )}

                <div className="split-view" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '2rem' }}>
                    
                    <div className="vehicule-container" style={{ flex: 1, minWidth: '300px', marginTop: 0 }}>
                        <WalletCard 
                            userId={user.idUtilizator}
                            balance={balance}
                            onBalanceChange={refreshBalance}
                        />

                        {/* NOU: Secțiunea Rezervări */}
                        <div style={{ marginTop: '20px', marginBottom: '30px' }}>
                            <h2 style={{ borderBottom: '2px solid #f39c12', color: '#e67e22' }}>Rezervările Mele</h2>
                            {rezervari.length === 0 ? (
                                <p style={{ fontStyle: 'italic', color: '#666' }}>Nu ai rezervări active.</p>
                            ) : (
                                <ul className="vehicul-lista" style={{ maxHeight: '200px', overflowY: 'auto' }}>
    {rezervari.map(rez => (
        <li key={rez.ID_REZERVARE} style={{ borderLeftColor: rez.STATUS === 'Confirmata' ? '#27ae60' : '#bdc3c7', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
                <strong>{rez.NUMEPARCARE} - Loc {rez.NUMARLOC}</strong>
                <span style={{ fontSize: '0.8rem', display:'block', marginTop:'4px' }}>
                    {formatTime(rez.DATA_INCEPUT)} - {formatTime(rez.DATA_SFARSIT)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight:'bold', color: rez.STATUS === 'Confirmata' ? '#27ae60' : '#7f8c8d' }}>
                    {rez.STATUS.toUpperCase()}
                </span>
            </div>
            
            {/* Butonul apare doar dacă rezervarea este activă */}
            {rez.STATUS === 'Confirmata' && (
                <button 
                    onClick={() => handleFinishReservation(rez.ID_REZERVARE)}
                    style={{
                        padding: '5px 10px',
                        fontSize: '0.7rem',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: '10px'
                    }}
                >
                    Eliberează
                </button>
            )}
        </li>
    ))}
</ul>
                            )}
                        </div>

                        <h2>Vehiculele Mele</h2>
                        <form onSubmit={handleAddVehicul} className="vehicul-form">
                            <div className="form-grup-inline">
                                <input 
                                    type="text" value={numarNou} onChange={(e) => setNumarNou(e.target.value)} 
                                    placeholder="Nr. (B-123-XYZ)" required 
                                />
                                <input 
                                    type="text" value={marcaNoua} onChange={(e) => setMarcaNoua(e.target.value)} 
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

                    <div className="abonamente-container" style={{ flex: 1, minWidth: '300px', marginTop: 0 }}>
                        <h2>Abonamente</h2>
                        
                        {tarife.length > 0 ? (
                            <div className="carousel-container">
                                <button onClick={prevTarif} className="carousel-nav-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                </button>

                                <div className="tarif-card-carousel">
                                    <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{tarife[currentTarifIndex].DESCRIERE}</h3>
                                    <p style={{ fontStyle: 'italic', color: '#7f8c8d' }}>Zona: {tarife[currentTarifIndex].NUMEZONA}</p>
                                    <div style={{ margin: '20px 0' }}>
                                        <span className="tarif-pret" style={{ fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>{tarife[currentTarifIndex].VALOARE}</span>
                                        <span style={{ fontSize: '1.2rem', color: '#666', marginLeft: '5px' }}>{tarife[currentTarifIndex].MONEDA}</span>
                                    </div>
                                    <button onClick={() => handleBuyAbonament(tarife[currentTarifIndex].ID_TARIF)} className="login-button buy-button" style={{ width: '100%' }}>Cumpără Acum</button>
                                    <span className="carousel-counter">Oferta {currentTarifIndex + 1} din {tarife.length}</span>
                                </div>

                                <button onClick={nextTarif} className="carousel-nav-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                </button>
                            </div>
                        ) : <p>Nu există abonamente.</p>}

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