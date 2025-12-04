import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminApi, parkingApi } from '../utils/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPanel.css';

function AdminPanel() {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [stats, setStats] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [tarife, setTarife] = useState([]);
    const [mentenanta, setMentenanta] = useState([]);
    const [recenzii, setRecenzii] = useState([]);

    // Edit States
    const [editTarifId, setEditTarifId] = useState(null);
    const [editTarifValue, setEditTarifValue] = useState('');

    useEffect(() => {
        if (!user || user.email !== 'edi2004george@gmail.com') {
            toast.error('Acces interzis! Nu ai drepturi de administrator.');
            navigate('/'); // Îl trimitem înapoi pe Dashboard
        }
    }, [user, navigate, toast]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'dashboard') {
                    const data = await adminApi.getStats();
                    setStats(data);
                } else if (activeTab === 'users') {
                    const data = await adminApi.getUsers();
                    setUsersList(data);
                } else if (activeTab === 'transactions') {
                    const data = await adminApi.getTransactions();
                    setTransactions(data);
                } else if (activeTab === 'tarife') {
                    const data = await parkingApi.getTariffs(); // Public endpoint is fine for list
                    setTarife(data);
                } else if (activeTab === 'mentenanta') {
                    const data = await adminApi.getMaintenance();
                    setMentenanta(data);
                } else if (activeTab === 'recenzii') {
                    const data = await adminApi.getReviews();
                    setRecenzii(data);
                }
            } catch (error) {
                console.error(error);
                // Nu dam eroare la recenzii/mentenanta daca sunt goale
                if (activeTab !== 'recenzii' && activeTab !== 'mentenanta') {
                    toast.error('Eroare date admin.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    // Handlers
    const handleDeleteUser = async (id) => {
        if (!window.confirm('Sigur ștergi acest utilizator?')) return;
        try {
            await adminApi.deleteUser(id);
            toast.success('Utilizator șters.');
            setUsersList(usersList.filter(u => u.ID_UTILIZATOR !== id));
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSaveTarif = async (id) => {
        try {
            await adminApi.updateTarif(id, editTarifValue);
            toast.success('Preț actualizat!');
            setEditTarifId(null);
            // Refresh local
            setTarife(tarife.map(t => t.ID_TARIF === id ? { ...t, VALOARE: editTarifValue } : t));
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleResolveTicket = async (id) => {
        try {
            await adminApi.resolveMaintenance(id);
            toast.success('Tichet rezolvat!');
            // Refresh
            const data = await adminApi.getMaintenance();
            setMentenanta(data);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">🛡️ Admin Panel</div>
                <nav className="admin-nav">
                    <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>📊 Statistici</button>
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>👥 Utilizatori</button>
                    <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>💰 Tranzacții</button>
                    <button className={activeTab === 'tarife' ? 'active' : ''} onClick={() => setActiveTab('tarife')}>🏷️ Tarife & Prețuri</button>
                    <button className={activeTab === 'mentenanta' ? 'active' : ''} onClick={() => setActiveTab('mentenanta')}>🔧 Mentenanță</button>
                    <button className={activeTab === 'recenzii' ? 'active' : ''} onClick={() => setActiveTab('recenzii')}>⭐ Recenzii</button>
                    <button className="back-btn" onClick={() => navigate('/')}>← Înapoi la Site</button>
                </nav>
            </aside>

            <main className="admin-content">
                <header className="admin-header">
                    <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                    <span>Admin: <strong>{user?.nume}</strong></span>
                </header>

                <div className="admin-body">
                    {loading ? <LoadingSpinner /> : (
                        <>
                            {/* DASHBOARD */}
                            {activeTab === 'dashboard' && stats && (
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <h3>Utilizatori</h3>
                                        <p>{stats.totalUsers}</p>
                                    </div>
                                    <div className="stat-card revenue">
                                        <h3>Venituri</h3>
                                        <p>{stats.totalRevenue} RON</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Abonamente</h3>
                                        <p>{stats.activeSubscriptions}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Grad Ocupare</h3>
                                        <p>{stats.currentOccupancy} locuri</p>
                                    </div>
                                </div>
                            )}

                            {/* TARIFE */}
                            {activeTab === 'tarife' && (
                                <div className="table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Descriere</th>
                                                <th>Zona</th>
                                                <th>Preț Actual</th>
                                                <th>Acțiuni</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tarife.map(t => (
                                                <tr key={t.ID_TARIF}>
                                                    <td>{t.DESCRIERE}</td>
                                                    <td>{t.NUMEZONA}</td>
                                                    <td>
                                                        {editTarifId === t.ID_TARIF ? (
                                                            <input 
                                                                type="number" 
                                                                value={editTarifValue} 
                                                                onChange={(e) => setEditTarifValue(e.target.value)}
                                                                style={{width: '80px', padding: '5px'}}
                                                            />
                                                        ) : (
                                                            <strong>{t.VALOARE} {t.MONEDA}</strong>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {editTarifId === t.ID_TARIF ? (
                                                            <>
                                                                <button className="btn-save" onClick={() => handleSaveTarif(t.ID_TARIF)}>Salvează</button>
                                                                <button className="btn-cancel-edit" onClick={() => setEditTarifId(null)}>X</button>
                                                            </>
                                                        ) : (
                                                            <button className="btn-edit" onClick={() => {
                                                                setEditTarifId(t.ID_TARIF);
                                                                setEditTarifValue(t.VALOARE);
                                                            }}>Editează Preț</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* MENTENANTA */}
                            {activeTab === 'mentenanta' && (
                                <div className="table-container">
                                    {mentenanta.length === 0 ? <p style={{padding: '20px'}}>Nicio problemă raportată.</p> : (
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Parcare / Loc</th>
                                                    <th>Problemă</th>
                                                    <th>Data</th>
                                                    <th>Status</th>
                                                    <th>Acțiune</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mentenanta.map(m => (
                                                    <tr key={m.ID_MENTENANTA}>
                                                        <td>{m.NUMEPARCARE} - <strong>{m.NUMARLOC}</strong></td>
                                                        <td>{m.DESCRIERE_PROBLEMA}</td>
                                                        <td>{m.DATA_FMT}</td>
                                                        <td>
                                                            <span className={`status-badge ${m.STATUS === 'Rezolvat' ? 'success' : 'warning'}`}>
                                                                {m.STATUS}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {m.STATUS !== 'Rezolvat' && (
                                                                <button className="btn-resolve" onClick={() => handleResolveTicket(m.ID_MENTENANTA)}>
                                                                    Marchează Rezolvat
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {/* RECENZII */}
                            {activeTab === 'recenzii' && (
                                <div className="reviews-grid">
                                    {recenzii.length === 0 ? <p>Nicio recenzie încă.</p> : recenzii.map(r => (
                                        <div key={r.ID_RECENZIE} className="review-card">
                                            <div className="review-header">
                                                <strong>{r.NUME} {r.PRENUME}</strong>
                                                <span className="review-stars">{'⭐'.repeat(r.NOTA)}</span>
                                            </div>
                                            <p className="review-text">"{r.COMENTARIU}"</p>
                                            <small className="review-meta">{r.NUMEPARCARE} • {r.DATA_FMT}</small>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* USERS (Existent) */}
                            {activeTab === 'users' && (
                                <div className="table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nume</th>
                                                <th>Email</th>
                                                <th>Balanță</th>
                                                <th>Acțiuni</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersList.map(u => (
                                                <tr key={u.ID_UTILIZATOR}>
                                                    <td>{u.ID_UTILIZATOR}</td>
                                                    <td>{u.NUME} {u.PRENUME} {u.ROL === 'ADMIN' && <span className="badge-admin">ADMIN</span>}</td>
                                                    <td>{u.EMAIL}</td>
                                                    <td>{u.BALANTA} RON</td>
                                                    <td>
                                                        {u.ROL !== 'ADMIN' && (
                                                            <button className="btn-delete" onClick={() => handleDeleteUser(u.ID_UTILIZATOR)}>Șterge</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TRANSACTIONS (Existent) */}
                            {activeTab === 'transactions' && (
                                <div className="table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Utilizator</th>
                                                <th>Metodă</th>
                                                <th>Sumă</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map(t => (
                                                <tr key={t.ID_PLATA}>
                                                    <td>{t.DATA_FMT}</td>
                                                    <td>{t.NUME} {t.PRENUME}</td>
                                                    <td>{t.METODA_PLATA}</td>
                                                    <td style={{color: '#27ae60', fontWeight:'bold'}}>+{t.SUMA} RON</td>
                                                    <td><span className="status-badge success">{t.STATUS_PLATA}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminPanel;