// src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { parkingApi } from '../utils/apiClient';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPanel.css';

function AdminPanel() {
    const [stats, setStats] = useState({});
    const [users, setUsers] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('dashboard');
    
    const { toast } = useToast();

    // Fetch initial data
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch health check with statistics
            const healthData = await parkingApi.checkHealth();
            setStats(healthData.statistics || {});
            
            toast.success('Date administrative încărcate cu succes');
        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Eroare la încărcarea datelor administrative');
        }
        setLoading(false);
    };

    const StatCard = ({ title, value, iconType, color, trend }) => (
        <div className={`stat-card stat-card--${color}`}>
            <div className="stat-card__header">
                <div className="stat-card__title">{title}</div>
                <div className={`stat-card__icon icon-${iconType}`}></div>
            </div>
            <div className="stat-card__value">{value}</div>
            {trend && (
                <div className={`stat-card__trend ${trend > 0 ? 'positive' : 'negative'}`}>
                    ↗ {Math.abs(trend)}% față de luna trecută
                </div>
            )}
        </div>
    );

    const TabButton = ({ tab, label, isActive, onClick }) => (
        <button 
            className={`tab-button ${isActive ? 'tab-button--active' : ''}`}
            onClick={() => onClick(tab)}
        >
            {label}
        </button>
    );

    const DashboardTab = () => (
        <div className="dashboard-tab">
            <div className="stats-grid">
                <StatCard 
                    title="Utilizatori Totali" 
                    value={stats.TOTAL_USERS || 0}
                    iconType="users"
                    color="blue"
                    trend={12}
                />
                <StatCard 
                    title="Vehicule Înregistrate" 
                    value={stats.TOTAL_VEHICLES || 0}
                    iconType="car"
                    color="green"
                    trend={8}
                />
                <StatCard 
                    title="Locuri Disponibile" 
                    value={stats.AVAILABLE_SPOTS || 0}
                    iconType="parking"
                    color="yellow"
                />
                <StatCard 
                    title="Locuri Ocupate" 
                    value={stats.OCCUPIED_SPOTS || 0}
                    iconType="warning"
                    color="red"
                />
            </div>
            
            <div className="charts-section">
                <div className="chart-container">
                    <h3>Ocupare pe Zone</h3>
                    <div className="simple-chart">
                        {/* Simplified chart representation */}
                        <div className="chart-bar">
                            <div className="bar bar--standard" style={{height: '60%'}}></div>
                            <span>Standard</span>
                        </div>
                        <div className="chart-bar">
                            <div className="bar bar--premium" style={{height: '80%'}}></div>
                            <span>Premium</span>
                        </div>
                        <div className="chart-bar">
                            <div className="bar bar--vip" style={{height: '40%'}}></div>
                            <span>VIP</span>
                        </div>
                        <div className="chart-bar">
                            <div className="bar bar--electric" style={{height: '90%'}}></div>
                            <span>Electric</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const UsersTab = () => (
        <div className="users-tab">
            <div className="section-header">
                <h3>Gestionare Utilizatori</h3>
                <button className="btn btn--primary">Adaugă Utilizator</button>
            </div>
            
            <div className="users-table">
                <div className="table-header">
                    <div>Nume</div>
                    <div>Email</div>
                    <div>Vehicule</div>
                    <div>Status</div>
                    <div>Acțiuni</div>
                </div>
                
                {/* Sample user data - in real implementation, fetch from API */}
                <div className="table-row">
                    <div>Ion Popescu</div>
                    <div>ion.popescu@email.com</div>
                    <div>2</div>
                    <div><span className="status status--active">Activ</span></div>
                    <div>
                        <button className="btn-small btn-small--edit">Editează</button>
                        <button className="btn-small btn-small--delete">Șterge</button>
                    </div>
                </div>
                
                <div className="table-row">
                    <div>Maria Ionescu</div>
                    <div>maria.ionescu@email.com</div>
                    <div>1</div>
                    <div><span className="status status--active">Activ</span></div>
                    <div>
                        <button className="btn-small btn-small--edit">Editează</button>
                        <button className="btn-small btn-small--delete">Șterge</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const SessionsTab = () => (
        <div className="sessions-tab">
            <div className="section-header">
                <h3>Sesiuni Active de Parcare</h3>
                <button className="btn btn--secondary" onClick={fetchDashboardData}>
                    Actualizează
                </button>
            </div>
            
            <div className="sessions-grid">
                <div className="session-card">
                    <div className="session-card__header">
                        <div className="session-card__location">Loc A03</div>
                        <div className="session-card__status status--active">Activ</div>
                    </div>
                    <div className="session-card__details">
                        <div>Vehicul: B-123-ABC</div>
                        <div>Utilizator: Ion Popescu</div>
                        <div>Început: 14:30 (2h 15m)</div>
                        <div>Tip: Abonament</div>
                    </div>
                </div>
                
                <div className="session-card">
                    <div className="session-card__header">
                        <div className="session-card__location">Loc B04</div>
                        <div className="session-card__status status--active">Activ</div>
                    </div>
                    <div className="session-card__details">
                        <div>Vehicul: B-789-GHI</div>
                        <div>Utilizator: Maria Ionescu</div>
                        <div>Început: 15:45 (1h 0m)</div>
                        <div>Tip: Abonament</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const SettingsTab = () => (
        <div className="settings-tab">
            <div className="section-header">
                <h3>Configurări Sistem</h3>
            </div>
            
            <div className="settings-sections">
                <div className="settings-section">
                    <h4>Tarife și Prețuri</h4>
                    <div className="form-group">
                        <label>Tarif Standard (RON/oră)</label>
                        <input type="number" defaultValue={5.00} step={0.1} />
                    </div>
                    <div className="form-group">
                        <label>Tarif Premium (RON/oră)</label>
                        <input type="number" defaultValue={8.00} step={0.1} />
                    </div>
                    <div className="form-group">
                        <label>Tarif VIP (RON/oră)</label>
                        <input type="number" defaultValue={12.00} step={0.1} />
                    </div>
                </div>
                
                <div className="settings-section">
                    <h4>Capacități Zone</h4>
                    <div className="form-group">
                        <label>Zona Standard</label>
                        <input type="number" defaultValue={30} />
                    </div>
                    <div className="form-group">
                        <label>Zona Premium</label>
                        <input type="number" defaultValue={20} />
                    </div>
                    <div className="form-group">
                        <label>Zona VIP</label>
                        <input type="number" defaultValue={8} />
                    </div>
                </div>
                
                <button className="btn btn--primary">Salvează Configurările</button>
            </div>
        </div>
    );

    if (loading) {
        return <LoadingSpinner size="large" text="Se încarcă panoul de administrare..." />;
    }

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h1>Panou de Administrare</h1>
                <div className="admin-header__actions">
                    <button className="btn btn--secondary" onClick={fetchDashboardData}>
                        Actualizează Date
                    </button>
                </div>
            </div>
            
            <div className="admin-tabs">
                <div className="tabs-nav">
                    <TabButton 
                        tab="dashboard" 
                        label="Dashboard" 
                        isActive={selectedTab === 'dashboard'}
                        onClick={setSelectedTab}
                    />
                    <TabButton 
                        tab="users" 
                        label="Utilizatori" 
                        isActive={selectedTab === 'users'}
                        onClick={setSelectedTab}
                    />
                    <TabButton 
                        tab="sessions" 
                        label="Sesiuni" 
                        isActive={selectedTab === 'sessions'}
                        onClick={setSelectedTab}
                    />
                    <TabButton 
                        tab="settings" 
                        label="Configurări" 
                        isActive={selectedTab === 'settings'}
                        onClick={setSelectedTab}
                    />
                </div>
                
                <div className="tabs-content">
                    {selectedTab === 'dashboard' && <DashboardTab />}
                    {selectedTab === 'users' && <UsersTab />}
                    {selectedTab === 'sessions' && <SessionsTab />}
                    {selectedTab === 'settings' && <SettingsTab />}
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
