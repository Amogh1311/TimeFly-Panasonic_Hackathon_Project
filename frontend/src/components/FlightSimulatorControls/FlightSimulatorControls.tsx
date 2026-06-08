import React from 'react';
import styles from './FlightSimulatorControls.module.css';
import type { FlightTelemetry } from '../../App';

interface Props {
  telemetry: FlightTelemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<FlightTelemetry>>;
  onTriggerAI: () => void;
}

// 1. Expanded 10-Item Arrays
const WEATHER_OPTIONS = ['Clear Skies', 'Light Turbulence', 'Heavy Turbulence', 'Thunderstorms', 'Rain', 'Snow', 'Fog', 'Crosswinds', 'Hail', 'Volcanic Ash'];
const PHASE_OPTIONS = ['Boarding', 'Taxiing', 'Takeoff', 'Climbing', 'Cruising', 'Descending', 'Holding Pattern', 'Approaching', 'Landing', 'Deplaning'];
const PROFILE_OPTIONS = ['Business Traveler', 'Solo Leisure', 'Parent with Child', 'Elderly Passenger', 'First-Time Flyer', 'Honeymooners', 'Nervous Flyer', 'Student', 'VIP/Status', 'Group/Tour'];

export const FlightSimulatorControls: React.FC<Props> = ({ telemetry, setTelemetry, onTriggerAI }) => {
  
  // Grab the dynamic seat number straight from the URL, defaulting to 12A
  const currentSeat = new URLSearchParams(window.location.search).get('seat') || '12A';

  const updateTelemetry = (key: keyof FlightTelemetry, value: string) => {
    setTelemetry(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.controlPanel} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <div>
        <h2 className={styles.panelTitle}>Flight Telemetry</h2>
        <p className={styles.panelSubtitle}>Live Environment Simulator</p>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>Atmospheric Conditions</label>
        <div className={styles.buttonGrid}>
          {WEATHER_OPTIONS.map((condition) => (
            <button
              key={condition}
              className={`${styles.controlButton} ${telemetry.weather === condition ? styles.active : ''}`}
              onClick={() => updateTelemetry('weather', condition)}
            >
              {condition}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.label}>Flight Phase</label>
        <div className={styles.buttonGrid}>
          {PHASE_OPTIONS.map((phase) => (
            <button
              key={phase}
              className={`${styles.controlButton} ${telemetry.flightPhase === phase ? styles.active : ''}`}
              onClick={() => updateTelemetry('flightPhase', phase)}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.controlGroup}>
        {/* The dynamic seat number is now injected here! */}
        <label className={styles.label}>Seat {currentSeat} Profile</label>
        <div className={styles.buttonGrid}>
          {PROFILE_OPTIONS.map((profile) => (
            <button
              key={profile}
              className={`${styles.controlButton} ${telemetry.passengerProfile === profile ? styles.active : ''}`}
              onClick={() => updateTelemetry('passengerProfile', profile)}
            >
              {profile}
            </button>
          ))}
        </div>
      </div>
      
      {/* NEW: AI Context Description Box (Pushes to the bottom to fill space) */}
      <div style={{
        marginTop: '1rem', // Pushes this box to the bottom of the panel
        marginBottom:'2.5rem',
        background: 'rgba(0,0,0,0.2)',
        padding: '1.2rem',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h4 style={{ color: 'white', marginBottom: '0.8rem', fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🧠</span> Recommendation Assistant
        </h4>
        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.9rem' }}>
          The <strong style={{ color: 'var(--accent-cyan)' }}>TimeFly AI</strong> monitors live cabin metrics to instantly generate hyper-personalized content recommendations.
        </p>
        <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
          <li><strong style={{ color: '#ccc' }}>Conditions:</strong> Adapts content vibe (e.g., calming audio during heavy turbulence).</li>
          <li><strong style={{ color: '#ccc' }}>Phase:</strong> Filters media length (e.g., short sitcoms during the descent phase).</li>
          <li><strong style={{ color: '#ccc' }}>Profile:</strong> Tailors genres and pacing to specific passenger demographics.</li>
        </ul>
      </div>

      <button 
        style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'var(--accent-cyan)', 
          color: '#000', 
          fontWeight: 'bold', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          width: '100%',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 15px rgba(0, 210, 255, 0.2)' 
        }} 
        onClick={onTriggerAI}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 210, 255, 0.4)';
          e.currentTarget.style.filter = 'brightness(1.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 210, 255, 0.2)';
          e.currentTarget.style.filter = 'brightness(1)';
        }}
      >
        Best Recommendations
      </button>

    </div>
  );
};