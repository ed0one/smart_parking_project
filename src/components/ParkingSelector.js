// src/components/ParkingSelector.js
import React from 'react';
import './ParkingSelector.css';

const ParkingSelector = ({ parkings, onParkingSelect, selectedParkingId }) => {
    // Nu mai facem fetch aici, primim lista "parkings" din Dashboard
    
    if (!parkings || parkings.length === 0) {
        return <div className="parking-selector-loading">Nu există parcări disponibile.</div>;
    }

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
                                <span className="hours">⏰ {parking.ORAINCEPUT} - {parking.ORASFARSIT || '22:00'}</span>
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