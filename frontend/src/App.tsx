import React, { useState, useCallback } from 'react';
import styles from './App.module.css';
import { DashboardGrid } from './components/DashboardGrid';
import { FlightSimulatorControls } from './components/FlightSimulatorControls/FlightSimulatorControls';
import { RecommendationModal } from './components/RecommendationModal/RecommendationModal';
import type { AiPayload } from './components/RecommendationModal/RecommendationModal';
import { useIdleTimer } from './hooks/useIdleTimer';
import { MatchSurvey } from './components/SeatSync/MatchSurvey';
import { ChatPanel } from './components/SeatSync/ChatPanel';
import { DrawingBoard } from './components/SeatSync/DrawingBoard';

// NEW HOOK IMPORT (We will create this file next)
import { useSeatSyncSocket } from './hooks/useSeatSyncSocket';

export interface FlightTelemetry {
  weather: string;
  flightPhase: string;
  passengerProfile: string;
  passengerAge: string;
}

const MOCK_AI_RESPONSE: AiPayload = {
  greeting: "I noticed we've hit some heavy turbulence. Here are some calming options.",
  detected_vibe: "Calming Distraction",
  items: [
    { id: "1", title: "Midnight Coffee Shop", media_type: "Music", thumbnail_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80" },
    { id: "2", title: "The Office", media_type: "Video", thumbnail_url: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80" },
    { id: "3", title: "Deep Sleep Meditation", media_type: "Audiobook", thumbnail_url: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&q=80" },
    { id: "4", title: "Planet Earth", media_type: "Documentary", thumbnail_url: "https://images.unsplash.com/photo-1610992015732-284000305018?w=800&q=80" },
    { id: "5", title: "Lofi Beats", media_type: "Music", thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80" },
    { id: "6", title: "Acoustic Covers", media_type: "Music", thumbnail_url: "https://images.unsplash.com/photo-1485579149621-3123dd97988d?w=800&q=80" },
    { id: "7", title: "Nature Sounds", media_type: "Audio", thumbnail_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80" },
    { id: "8", title: "Comedy Special", media_type: "Video", thumbnail_url: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80" }
  ]
};

export const App: React.FC = () => {
  // --- NEW: DYNAMIC SEAT ASSIGNMENT ---
  // Reads ?seat=XX from the URL. Defaults to '12A' if no parameter is provided.
  const currentSeat = new URLSearchParams(window.location.search).get('seat') || '12A';

  const [telemetry, setTelemetry] = useState<FlightTelemetry>({
    weather: 'Clear Skies', flightPhase: 'Cruising', passengerProfile: 'Business Traveler', passengerAge: '28'
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [activeTab, setActiveTab] = useState<'media' | 'social'>('media');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiData, setAiData] = useState<AiPayload | null>(null);
  const [isSeatSyncMatched, setIsSeatSyncMatched] = useState(false);
  const [isRestMode, setIsRestMode] = useState(false);

  // --- NEW: SOCKET HOOK INITIALIZATION ---
  // We pass in our dynamic seat so the chat knows who we are
  const { messages, incomingDrawPoint, sendMessage, sendDrawStroke } = useSeatSyncSocket(
    'room_12A_14B', 
    isSeatSyncMatched,
    currentSeat 
  );

  const forceTriggerAI = () => {
    setAiData(MOCK_AI_RESPONSE);
    setIsModalOpen(true);
  };

  const handleIdle = useCallback(() => {
    if (!isModalOpen && !isRestMode) forceTriggerAI();
  }, [isModalOpen, isRestMode]);

  useIdleTimer({ timeoutMs: 120000, onIdle: handleIdle });

  return (
    <div className={styles.appContainer}>
      
      {isRestMode && (
        <div onClick={() => setIsRestMode(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 8, 15, 0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(20px)' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>🌙 On a Break</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tap anywhere on the screen to wake up the system.</p>
        </div>
      )}

      <header className={styles.statusBar}>
        <div className={styles.logoGroup}>
          <span className={styles.brandText}>Time<span className={styles.brandAccent}>Fly</span></span>
          {/* UPDATED: Dynamically injects the current seat number into the top header! */}
          <span className={styles.airlineTag}>Seat {currentSeat} | {telemetry.flightPhase} Phase | {telemetry.weather}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ background: activeTab === 'media' ? 'var(--accent-cyan)' : 'transparent', color: activeTab === 'media' ? '#000' : 'white', border: '1px solid var(--accent-cyan)', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab('media')}>🎬 Media Portal</button>
          <button style={{ background: activeTab === 'social' ? 'var(--accent-cyan)' : 'transparent', color: activeTab === 'social' ? '#000' : 'white', border: '1px solid var(--accent-cyan)', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab('social')}>👋 Connect & Play</button>
        </div>

        <div className={styles.flightMetrics}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', marginRight: '1rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
            {timeString}
          </span>
          <button onClick={() => setIsRestMode(true)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--text-secondary)', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>🌙 Go on Break</button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.dashboardSection}>
          
          <div style={{ display: activeTab === 'media' ? 'block' : 'none', height: '100%' }}>
            <DashboardGrid />
          </div>

          <div style={{ display: activeTab === 'social' ? 'flex' : 'none', gap: '1.5rem', height: '100%' }}>
            <div style={{ flex: 1, minWidth: '350px' }}>
              <MatchSurvey 
                onMatchReady={() => setIsSeatSyncMatched(true)} 
                onEditStart={() => setIsSeatSyncMatched(false)} 
              />
            </div>
            
            {isSeatSyncMatched && (
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ flex: 1 }}>
                  {/* UPDATED: Pass the dynamic socket state into the Chat Panel */}
                  <ChatPanel messages={messages} onSendMessage={sendMessage} />
                </div>
                <div style={{ flex: 1 }}>
                  {/* UPDATED: Pass the dynamic socket state into the Drawing Board */}
                  <DrawingBoard incomingStroke={incomingDrawPoint} onDrawStroke={sendDrawStroke} />
                </div>
              </div>
            )}
          </div>

        </section>

        <aside className={styles.sidebarSection}>
          <FlightSimulatorControls telemetry={telemetry} setTelemetry={setTelemetry} />
          <button style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--accent-cyan)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }} onClick={forceTriggerAI}>🚀 FORCE TRIGGER AI MODAL</button>
        </aside>
      </main>

      <RecommendationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} payload={aiData} />
    </div>
  );
};

export default App;