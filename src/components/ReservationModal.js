// src/components/ReservationModal.js
import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { parkingApi } from '../utils/apiClient'; // Importăm clientul
import './ReservationModal.css';

const ReservationModal = ({ isOpen, onClose, onReserve, loc, vehiculPrincipal }) => {
  const [selectedDuration, setSelectedDuration] = useState(60); // in minutes
  const [selectedTime, setSelectedTime] = useState('now');
  const [customTime, setCustomTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen || !loc) return null; // Verificăm și dacă avem un loc selectat

  const durations = [
    { value: 30, label: '30 minute', price: 2.5 },
    { value: 60, label: '1 oră', price: 5.0 },
    { value: 120, label: '2 ore', price: 9.0 },
    { value: 240, label: '4 ore', price: 16.0 },
    { value: 480, label: '8 ore', price: 25.0 }
  ];

  const handleReservation = async () => {
    if (!vehiculPrincipal) {
      toast.error('Nu aveți niciun vehicul înregistrat!');
      return;
    }

    setIsLoading(true);
    try {
      const startTime = selectedTime === 'now' ? new Date() : new Date(customTime);
      const endTime = new Date(startTime.getTime() + selectedDuration * 60000);

      // Validare timp
      if (isNaN(startTime.getTime())) {
          throw new Error("Timp de start invalid.");
      }

      // Folosim apiClient
      await parkingApi.reserveParking(loc.ID_LOC, {
          numarInmatriculare: vehiculPrincipal.NUMARINMATRICULARE,
          dataStart: startTime.toISOString(),
          dataEnd: endTime.toISOString(),
          durata: selectedDuration,
          pret: durations.find(d => d.value === selectedDuration)?.price || 5.0
      });

      toast.success(`Rezervare reușită pentru locul ${loc.NUMARLOC}!`);
      onReserve(); // Trigger refresh în Dashboard
      onClose(); // Închide modalul
    } catch (error) {
      console.error('Eroare la rezervare:', error);
      toast.error(`Eroare: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDurationData = durations.find(d => d.value === selectedDuration);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Rezervare Loc de Parcare</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="reservation-info">
              <div className="info-item">
                <span className="info-label">Loc:</span>
                <span className="info-value">{loc.NUMARLOC} ({loc.TIPZONA})</span>
              </div>
              <div className="info-item">
                <span className="info-label">Vehicul:</span>
                <span className="info-value">
                  {vehiculPrincipal ? vehiculPrincipal.NUMARINMATRICULARE : 'Nu aveți vehicul'}
                </span>
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Durata rezervării:</label>
              <div className="duration-options">
                {durations.map(duration => (
                  <div 
                    key={duration.value}
                    className={`duration-option ${selectedDuration === duration.value ? 'selected' : ''}`}
                    onClick={() => setSelectedDuration(duration.value)}
                  >
                    <span className="duration-label">{duration.label}</span>
                    <span className="duration-price">{duration.price} RON</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Când să înceapă rezervarea?</label>
              <div className="time-options">
                <label className="radio-option">
                  <input 
                    type="radio" 
                    value="now" 
                    checked={selectedTime === 'now'}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                  <span>Acum</span>
                </label>
                <label className="radio-option">
                  <input 
                    type="radio" 
                    value="custom" 
                    checked={selectedTime === 'custom'}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                  <span>La o oră specificată</span>
                </label>
              </div>
              
              {selectedTime === 'custom' && (
                <input 
                  type="datetime-local"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="datetime-input"
                  // Setăm minimul la ora curentă (aproximativ)
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>

            {selectedDurationData && (
              <div className="price-summary">
                <div className="price-row">
                  <span>Preț total:</span>
                  <span className="price-value">{selectedDurationData.price} RON</span>
                </div>
                <div className="price-row duration-info">
                  <span>Pentru {selectedDurationData.label}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>Anulează</button>
            <button 
              className="btn-reserve" 
              onClick={handleReservation}
              disabled={isLoading || !vehiculPrincipal || (selectedTime === 'custom' && !customTime)}
            >
              {isLoading ? 'Se rezervă...' : 'Rezervă Acum'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReservationModal;