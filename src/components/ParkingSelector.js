// src/components/ParkingSelector.js
import React, { useState, useEffect } from 'react';
import './ParkingSelector.css';

const ParkingSelector = ({ onParkingSelect, selectedParkingId }) => {
    const [parkings, setParkings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchParkings();
    }, []);

    const fetchParkings = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/parcari');
            const data = await response.json();
            if (response.ok) {
                setParkings(data);
            } else {
                console.error('Error fetching parkings:', data);
            }
        } catch (error) {
            console.error('Error fetching parkings:', error);
        }
        setLoading(false);
    };

    if (loading) return <div className="parking-selector-loading">Se încarcă parcările...</div>;

    return (
        <div className="parking-selector">
            <h3>🅿️ Selectează Parcarea</h3>
            <div className="parking-grid">
                {parkings.map(parking => (
                    <div 
                        key={parking.ID_PARCARE}
                        className={`parking-card ${selectedParkingId === parking.ID_PARCARE ? 'selected' : ''}`}
                        onClick={() => onParkingSelect(parking.ID_PARCARE)}
                    >
                        <div className="parking-card-header">
                            <span className="parking-icon">🅿️</span>
                            <h4>{parking.NUMEPARCARE}</h4>
                        </div>
                        <div className="parking-card-body">
                            <p className="parking-address">📍 {parking.ADRESA}</p>
                            <div className="parking-info">
                                <span className="capacity">Capacitate: {parking.CAPACITATETOTALA}</span>
                                <span className="hours">⏰ {parking.ORAINCEPUT} - 22:00</span>
                            </div>
                        </div>
                        {selectedParkingId === parking.ID_PARCARE && (
                            <div className="selected-indicator">✓ Selectată</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParkingSelector;
