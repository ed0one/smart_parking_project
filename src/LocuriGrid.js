// src/LocuriGrid.js
import React from 'react';
import './LocuriGrid.css';

function LocuriGrid({ locuri, onLocClick }) {
  return (
    <div className="locuri-container">
      <div className="locuri-grid">
        {locuri.map(loc => (
          <div
            key={loc.ID_LOC}
            onClick={() => onLocClick(loc)}
            className={`
              loc-parcare 
              ${loc.STATUSCURENT ? loc.STATUSCURENT.toLowerCase() : 'liber'}
              ${loc.TIPZONA ? loc.TIPZONA.toLowerCase() : 'standard'} 
              ${loc.STATUSCURENT !== 'Mentenanta' ? 'clicabil' : ''}
            `}
            title={loc.STATUSCURENT !== 'Mentenanta' ? `Click pentru acțiuni` : 'Loc în mentenanță'}
          >
            <span className="loc-numar">
              {(loc.TIPZONA === 'Premium' || loc.TIPZONA === 'VIP') && '★ '}
              {loc.NUMARLOC}
            </span>
          </div>
        ))}
      </div>

      <div className="legenda">
        <div className="legenda-item"><span className="casuta liber"></span> Liber</div>
        <div className="legenda-item"><span className="casuta ocupat"></span> Ocupat</div>
        <div className="legenda-item"><span className="casuta premium"></span> ★ Premium/VIP</div>
        <div className="legenda-item"><span className="casuta mentenanta"></span> Mentenanță</div>
      </div>
    </div>
  );
}

export default LocuriGrid;