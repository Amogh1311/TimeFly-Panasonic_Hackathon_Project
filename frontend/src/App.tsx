import React, { useState, useCallback, useEffect } from 'react';
import styles from './App.module.css';
import { DashboardGrid } from './components/DashboardGrid';
import { FlightSimulatorControls } from './components/FlightSimulatorControls/FlightSimulatorControls';
import { RecommendationModal } from './components/RecommendationModal/RecommendationModal';
import type { AiPayload } from './components/RecommendationModal/RecommendationModal';
import { useIdleTimer } from './hooks/useIdleTimer';
import { MatchSurvey } from './components/SeatSync/MatchSurvey';
import { ChatPanel } from './components/SeatSync/ChatPanel';
import { DrawingBoard } from './components/SeatSync/DrawingBoard';
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
  const currentSeat = new URLSearchParams(window.location.search).get('seat') || '12A';

  const [telemetry, setTelemetry] = useState<FlightTelemetry>({
    weather: 'Clear Skies', flightPhase: 'Cruising', passengerProfile: 'Business Traveler', passengerAge: '28'
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [activeTab, setActiveTab] = useState<'media' | 'social'>('media');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiData, setAiData] = useState<AiPayload | null>(null);
  const [isSeatSyncMatched, setIsSeatSyncMatched] = useState(false);
  const [isRestMode, setIsRestMode] = useState(false);

  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'message' | 'alert'>('message');
  const [hasUnreadIndicator, setHasUnreadIndicator] = useState(false);

  // DESTRUCTURE THE NEW PARTNER VARS
  const { messages, incomingDrawPoint, sendMessage, sendDrawStroke, hasPartnerLeft, simulatePartnerDisconnect } = useSeatSyncSocket(
    'room_12A_14B', 
    isSeatSyncMatched,
    currentSeat 
  );

  // 1. WATCH FOR REGULAR MESSAGES
  useEffect(() => {
    if (isSeatSyncMatched && activeTab === 'media' && messages.length > lastMessageCount) {
      const newestMessage = messages[messages.length - 1];
      if (newestMessage && !newestMessage.sender.includes('You')) {
        setToastNotification(`${newestMessage.sender}: "${newestMessage.text}"`);
        setToastType('message');
        setHasUnreadIndicator(true);
        const dismissTimer = setTimeout(() => setToastNotification(null), 4000);
        return () => clearTimeout(dismissTimer);
      }
    }
    setLastMessageCount(messages.length);
  }, [messages, activeTab, isSeatSyncMatched, lastMessageCount]);

  // 2. WATCH FOR PARTNER DISCONNECTS
  useEffect(() => {
    if (hasPartnerLeft && activeTab === 'media') {
      const partnerSeat = currentSeat === '12A' ? '14B' : '12A';
      setToastNotification(`Seat ${partnerSeat} has terminated the connection.`);
      setToastType('alert');
      setHasUnreadIndicator(true);
    }
  }, [hasPartnerLeft, activeTab, currentSeat]);

  useEffect(() => {
    if (activeTab === 'social') {
      setHasUnreadIndicator(false);
      setToastNotification(null); 
    }
  }, [activeTab]);

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
      
      {toastNotification && (
        <div style={{
          position: 'fixed', top: '5.5rem', right: '1.5rem',
          // DYNAMIC STYLING: Red for alerts, Blue for messages
          background: toastType === 'alert' ? 'rgba(255, 10, 10, 0.9)' : 'rgba(10, 15, 26, 0.9)', 
          backdropFilter: 'blur(12px)',
          border: toastType === 'alert' ? '1px solid #ff4444' : '1px solid var(--accent-cyan)', 
          borderRadius: '12px', padding: '1rem 1.5rem', zIndex: 99999, width: '320px',
          boxShadow: toastType === 'alert' ? '0 10px 30px rgba(255, 0, 0, 0.3)' : '0 10px 30px rgba(0, 210, 255, 0.2)',
          animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', overflow: 'hidden', flexGrow: 1 }} onClick={() => setActiveTab('social')}>
            <span style={{ fontSize: '1.5rem' }}>{toastType === 'alert' ? '⚠️' : '💬'}</span>
            <div style={{ overflow: 'hidden' }}>
              <strong style={{ color: toastType === 'alert' ? '#ffcccc' : 'var(--accent-cyan)', fontSize: '0.75rem', display: 'block', letterSpacing: '1px', marginBottom: '0.2rem' }}>
                {toastType === 'alert' ? 'CONNECTION LOST' : 'NEW COMMS LINK MESSAGE'}
              </strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toastNotification}</p>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setToastNotification(null); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '1.5rem', cursor: 'pointer', padding: 0, lineHeight: '1rem' }}>×</button>
        </div>
      )}

      {isRestMode && (
        <div onClick={() => setIsRestMode(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 8, 15, 0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(20px)' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>🌙 On a Break</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tap anywhere on the screen to wake up the system.</p>
        </div>
      )}

      <header className={styles.statusBar}>
        <div className={styles.logoGroup}>
          <span className={styles.brandText}>Time<span className={styles.brandAccent}>Fly</span></span>
          <span className={styles.airlineTag}>Seat {currentSeat} | {telemetry.flightPhase} Phase | {telemetry.weather}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ background: activeTab === 'media' ? 'var(--accent-cyan)' : 'transparent', color: activeTab === 'media' ? '#000' : 'white', border: '1px solid var(--accent-cyan)', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab('media')}>🎬 Media Portal</button>
          
          <button style={{ position: 'relative', background: activeTab === 'social' ? 'var(--accent-cyan)' : 'transparent', color: activeTab === 'social' ? '#000' : 'white', border: '1px solid var(--accent-cyan)', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setActiveTab('social')}>
            👋 Connect & Play
            {hasUnreadIndicator && (
              <span style={{ width: '8px', height: '8px', background: toastType === 'alert' ? '#ff4444' : '#ff007f', borderRadius: '50%', display: 'block', boxShadow: `0 0 10px ${toastType === 'alert' ? '#ff4444' : '#ff007f'}` }} />
            )}
          </button>
        </div>

        <div className={styles.flightMetrics}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', marginRight: '1rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>{timeString}</span>
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
                onDisconnect={() => {
                  setIsSeatSyncMatched(false);
                  setToastNotification(null);
                  setHasUnreadIndicator(false);
                }} 
                hasPartnerLeft={hasPartnerLeft}
                onAcknowledgeDisconnect={() => setIsSeatSyncMatched(false)}
              />
            </div>
            
            {/* HIDE CHAT AND CANVAS IF THE PARTNER LEFT! */}
            {isSeatSyncMatched && !hasPartnerLeft && (
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ flex: 1 }}>
                  <ChatPanel messages={messages} onSendMessage={sendMessage} />
                </div>
                <div style={{ flex: 1 }}>
                  <DrawingBoard incomingStroke={incomingDrawPoint} onDrawStroke={sendDrawStroke} />
                </div>
              </div>
            )}
          </div>

        </section>

        <aside className={styles.sidebarSection}>
          <FlightSimulatorControls telemetry={telemetry} setTelemetry={setTelemetry} />
          <button style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--accent-cyan)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }} onClick={forceTriggerAI}>🚀 FORCE TRIGGER AI MODAL</button>
          
          {/* DEV TOOL: CLICK THIS TO SIMULATE THE PARTNER DISCONNECTING */}
          {isSeatSyncMatched && !hasPartnerLeft && (
            <button 
              style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }} 
              onClick={simulatePartnerDisconnect}
            >
              ⚠️ DEV: Simulate Partner Disconnect
            </button>
          )}

        </aside>
      </main>

      <RecommendationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} payload={aiData} />
    </div>
  );
};

export default App;