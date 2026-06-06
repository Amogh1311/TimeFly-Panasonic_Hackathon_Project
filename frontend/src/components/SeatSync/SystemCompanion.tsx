import React from 'react';

interface Props {
  isMatched: boolean;
  partnerSeat: string;
}

export const SystemCompanion: React.FC<Props> = ({ isMatched, partnerSeat }) => {
  return (
    <div style={{
        background: 'rgba(15, 20, 35, 0.6)',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        borderRadius: '20px',
        padding: '2rem',
        color: 'white',
        height: '100%', // Take full height of the column
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)'
    }}>
      {!isMatched ? (
        <>
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', fontSize: '1.5rem' }}>Travel Sync</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
            TimeFly connects you with fellow passengers based on your unique profile. 
            <strong> Build your journey:</strong> Share media, play collaborative games, and turn a long flight into a meaningful connection.
          </p>
        </>
      ) : (
        <>
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', fontSize: '1.5rem' }}>Collaboration Hub</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
            You are currently linked with <strong>Seat {partnerSeat}</strong>. You can now:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem', color: '#fff', lineHeight: '2' }}>
            <li>💬 <strong>Live Chat:</strong> Exchange thoughts in real-time.</li>
            <li>🎨 <strong>Canvas Guessing:</strong> Test your creativity together.</li>
            <li>🎯 <strong>Neon Artillery:</strong> Compete in turn-based strategy.</li>
          </ul>
        </>
      )}
    </div>
  );
};