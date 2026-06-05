import React from 'react';
import styles from './FlightSimulatorControls.module.css';
import type { FlightTelemetry } from '../../App';

interface Props {
  telemetry: FlightTelemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<FlightTelemetry>>;
}

// 1. Expanded 10-Item Arrays
const WEATHER_OPTIONS = ['Clear Skies', 'Light Turbulence', 'Heavy Turbulence', 'Thunderstorms', 'Rain', 'Snow', 'Fog', 'Crosswinds', 'Hail', 'Volcanic Ash'];
const PHASE_OPTIONS = ['Boarding', 'Taxiing', 'Takeoff', 'Climbing', 'Cruising', 'Descending', 'Holding Pattern', 'Approaching', 'Landing', 'Deplaning'];
const PROFILE_OPTIONS = ['Business Traveler', 'Solo Leisure', 'Parent with Child', 'Elderly Passenger', 'First-Time Flyer', 'Honeymooners', 'Nervous Flyer', 'Student', 'VIP/Status', 'Group/Tour'];

export const FlightSimulatorControls: React.FC<Props> = ({ telemetry, setTelemetry }) => {
  
  const updateTelemetry = (key: keyof FlightTelemetry, value: string) => {
    setTelemetry(prev => ({ ...prev, [key]: value }));
  };

  // 2. Strict Input Handler for Age (Digits only)
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Regex: Only allow string if it consists entirely of digits 0-9
    if (/^\d*$/.test(val)) {
      updateTelemetry('passengerAge', val);
    }
  };

  // 3. Blur Handler: Enforces minimum value of 1 if user leaves it empty or types 0
  const handleAgeBlur = () => {
    if (!telemetry.passengerAge || parseInt(telemetry.passengerAge, 10) < 1) {
      updateTelemetry('passengerAge', '1');
    }
  };

  return (
    <div className={styles.controlPanel}>
      <h2 className={styles.panelTitle}>Flight Telemetry</h2>
      <p className={styles.panelSubtitle}>Live Environment Simulator</p>

      {/* NEW: Age Input Section */}
      <div className={styles.controlGroup}>
        <label className={styles.label}>Passenger Age</label>
        <input 
          type="text" 
          value={telemetry.passengerAge}
          onChange={handleAgeChange}
          onBlur={handleAgeBlur}
          className={styles.ageInput}
          placeholder="e.g. 28"
          maxLength={3}
        />
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
        <label className={styles.label}>Seat 12A Profile</label>
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
      
    </div>
  );
};