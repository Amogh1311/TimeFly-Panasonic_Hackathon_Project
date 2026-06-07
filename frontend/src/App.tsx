import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './App.module.css';
import { DashboardGrid } from './components/DashboardGrid';
import { FlightSimulatorControls } from './components/FlightSimulatorControls/FlightSimulatorControls';
import { RecommendationModal } from './components/RecommendationModal/RecommendationModal';
import type { AiPayload } from './components/RecommendationModal/RecommendationModal';
import { useIdleTimer } from './hooks/useIdleTimer';
import { MatchSurvey } from './components/SeatSync/MatchSurvey';
import { ChatPanel } from './components/SeatSync/ChatPanel';
import { DrawingBoard } from './components/SeatSync/DrawingBoard';
import { ArtilleryGame } from './components/SeatSync/ArtilleryGame';
import { useSeatSyncSocket } from './hooks/useSeatSyncSocket';

export interface FlightTelemetry {
  weather: string;
  flightPhase: string;
  passengerProfile: string;
  passengerAge: string;
}

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
  const [activeGame, setActiveGame] = useState<'draw' | 'artillery'>('draw');
  const [gameStates, setGameStates] = useState({ draw: false, artillery: false });
  const [quitMessages, setQuitMessages] = useState<{draw: string | null, artillery: string | null}>({ draw: null, artillery: null });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiData, setAiData] = useState<AiPayload | null>(null);
  const [isSeatSyncMatched, setIsSeatSyncMatched] = useState(false);
  const [isRestMode, setIsRestMode] = useState(false);

  const [lastMessageCount, setLastMessageCount] = useState(0);
  interface ToastItem {
    id: string;
    message: string;
    type: 'message' | 'alert';
  }

  // 2. Change state to hold an ARRAY of toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 3. Create a helper function to safely add and auto-remove toasts
  const addToast = useCallback((message: string, type: 'message' | 'alert') => {
    setToasts(prev => {
      // If this exact message is already showing, drop the duplicate!
      if (prev.some(t => t.message === message)) return prev;

      const id = Math.random().toString(36).substring(2, 9); 
      return [{ id, message, type }, ...prev];
    });
  }, []);

  const [hasUnreadIndicator, setHasUnreadIndicator] = useState(false);

  const { 
    messages, incomingDrawPoint, sendMessage, sendDrawStroke, hasPartnerLeft,
    gameGuesses, sendGameGuess, activeTurnSeat,
    incomingArtilleryMove, sendArtilleryMove, passTurn, 
    matchRequestStatus, incomingMatchRequest, sendMatchRequest, respondToMatchRequest,
    partnerGameSession, sendGameSessionUpdate, terminateConnection, resetGameState, incomingClear, sendClearBoard,
    cancelMatchRequest, incomingArtilleryPosition, sendArtilleryPosition, partnerSeat: matchedSeat, submitSurvey
  } = useSeatSyncSocket( isSeatSyncMatched, currentSeat);

  const lastKnownPartner = useRef<string>('Unknown');
  const partnerSeat = matchedSeat || (hasPartnerLeft ? lastKnownPartner.current : 'Searching...');
  const isMyTurn = activeTurnSeat === currentSeat;

  
  useEffect(() => {
    if (matchedSeat) {
      lastKnownPartner.current = matchedSeat;
    }
  }, [matchedSeat]);

  useEffect(() => {
    if (matchRequestStatus === 'accepted' && !isSeatSyncMatched) {
      setIsSeatSyncMatched(true);
    }
  }, [matchRequestStatus, isSeatSyncMatched]);

  useEffect(() => {
    if (isSeatSyncMatched && activeTab === 'media' && messages.length > lastMessageCount) {
      const newestMessage = messages[messages.length - 1];
      if (newestMessage && !newestMessage.sender.includes('You')) {
        addToast(`${newestMessage.sender}: "${newestMessage.text}"`, 'message');
        setHasUnreadIndicator(true);
      }
    }
    setLastMessageCount(messages.length);
  }, [messages, activeTab, isSeatSyncMatched, lastMessageCount]);

  useEffect(() => {
    if (hasPartnerLeft && activeTab === 'media') {
      addToast(`Seat ${lastKnownPartner.current} has terminated the connection.`, 'alert'); // <--- Reads memory box
      setHasUnreadIndicator(true);
    }
  }, [hasPartnerLeft, activeTab, addToast]);

  useEffect(() => {
    if (activeTab === 'social') {
      setHasUnreadIndicator(false);
      setToasts([]); // Clears all toasts in the array!
    }
  }, [activeTab]);

  useEffect(() => {
    if (partnerGameSession) {
      setGameStates(prev => ({ ...prev, [partnerGameSession.game]: partnerGameSession.action === 'start' }));
      
      if (partnerGameSession.action === 'start') {
        resetGameState(); 
        setQuitMessages(prev => ({ ...prev, [partnerGameSession.game]: null })); // <--- CLEAR MESSAGE
      }

      if (partnerGameSession.action === 'quit') {
        addToast(`Seat ${lastKnownPartner.current} quit the ${partnerGameSession.game === 'draw' ? 'Canvas' : 'Artillery'} game.`, 'alert'); // <--- Reads memory box
        setHasUnreadIndicator(true);
        setQuitMessages(prev => ({ ...prev, [partnerGameSession.game]: `Seat ${lastKnownPartner.current} quit the game.` })); // <--- Reads memory box
      }
    }
  }, [partnerGameSession, partnerSeat, resetGameState]);

  const triggerAI = async () => {
    try {
      // Fetch live predictions from FastAPI
      const response = await fetch('http://localhost:8000/api/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry)
      });
      
      const realAiData = await response.json();
      setAiData(realAiData);
      setIsModalOpen(true); 
      
    } catch (error) {
      console.error("AI Engine offline, falling back...", error);
      setAiData({
          greeting: "Connection to AI lost. Please check your network.",
          detected_vibe: "Offline Mode",
          items: []
      });
      setIsModalOpen(true);
    }
  };

  const handleIdle = useCallback(() => {
    if (!isModalOpen && !isRestMode) triggerAI();
  }, [isModalOpen, isRestMode]);

  useIdleTimer({ timeoutMs: 120000, onIdle: handleIdle });

  const handleStartGame = (game: 'draw' | 'artillery') => {
    setGameStates(prev => ({ ...prev, [game]: true }));
    sendGameSessionUpdate(game, 'start'); 
    resetGameState(); 
  };

  const handleQuitGame = (game: 'draw' | 'artillery') => {
    // 1. Close the game UI locally
    setGameStates(prev => ({ ...prev, [game]: false }));
    
    // 2. Tell the backend to notify the partner
    sendGameSessionUpdate(game, 'quit'); 
    
    // 3. Clear any local quit messages (No toast notifications here!)
    setQuitMessages(prev => ({ ...prev, [game]: null }));
  };

  return (
    <div className={styles.appContainer}>
      
      {incomingMatchRequest && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(15px)',
          zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.3s'
        }}>
          <div style={{
            background: 'rgba(15, 20, 35, 0.95)', border: '1px solid var(--accent-cyan)', borderRadius: '24px',
            padding: '3rem', maxWidth: '450px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0, 210, 255, 0.2)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
            <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.8rem' }}>Connection Request!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
              <strong>Seat {incomingMatchRequest.fromSeat}</strong> is trying to connect with you. Based on the survey, we found you two are travel buddies! 😊
              
              {/* NEW: DYNAMIC AI MATCH SCORE */}
              {incomingMatchRequest.score && (
                <span style={{ display: 'block', marginTop: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => respondToMatchRequest(false)} 
                style={{ 
                  padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid #ff4444', 
                  color: '#ff4444', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', flex: 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Decline
              </button>
              <button 
                onClick={() => { respondToMatchRequest(true); setIsSeatSyncMatched(true); setActiveTab('social'); }} 
                style={{ 
                  padding: '0.8rem 1.5rem', background: 'var(--accent-cyan)', border: 'none', color: 'black', 
                  borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', flex: 1,
                  boxShadow: '0 0 15px rgba(0,210,255,0.4)', transition: 'all 0.2s ease' 
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(0,210,255,0.8)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0,210,255,0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Accept Link
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .toast-card {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        }
        .toast-card:hover {
          transform: translateX(-5px);
        }
        .toast-text {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-height: 1.4em;
          transition: max-height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .toast-card:hover .toast-text {
          -webkit-line-clamp: 10;
          max-height: 150px;
        }
      `}</style>

      {/* The Stacking Toast Container */}
      <div style={{ position: 'fixed', top: '5.5rem', right: '1.5rem', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-card" style={{
            background: toast.type === 'alert' ? 'rgba(255, 10, 10, 0.9)' : 'rgba(10, 15, 26, 0.9)', 
            backdropFilter: 'blur(12px)',
            border: toast.type === 'alert' ? '1px solid #ff4444' : '1px solid var(--accent-cyan)', 
            borderRadius: '12px', padding: '1rem 1.5rem', width: '320px',
            boxShadow: toast.type === 'alert' ? '0 10px 30px rgba(255, 0, 0, 0.3)' : '0 10px 30px rgba(0, 210, 255, 0.2)',
            animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem',
            cursor: 'pointer'
          }} onClick={() => setActiveTab('social')}>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', overflow: 'hidden', flexGrow: 1 }}>
              <span style={{ fontSize: '1.5rem', marginTop: '-2px' }}>{toast.type === 'alert' ? '⚠️' : '💬'}</span>
              <div style={{ overflow: 'hidden', width: '100%' }}>
                <strong style={{ color: toast.type === 'alert' ? '#ffcccc' : 'var(--accent-cyan)', fontSize: '0.75rem', display: 'block', letterSpacing: '1px', marginBottom: '0.4rem' }}>
                  {toast.type === 'alert' ? 'CONNECTION UPDATE' : 'NEW COMMS LINK MESSAGE'}
                </strong>
                <p className="toast-text" style={{ margin: 0, fontSize: '0.9rem', color: 'white', lineHeight: '1.4em' }}>
                  {toast.message}
                </p>
              </div>
            </div>

            <button onClick={(e) => { 
              e.stopPropagation(); 
              setToasts(prev => prev.filter(t => t.id !== toast.id)); 
            }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '1.5rem', cursor: 'pointer', padding: 0, lineHeight: '1rem' }}>
              ×
            </button>
            
          </div>
        ))}
      </div>

      <div 
        onClick={() => setIsRestMode(false)} 
        style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(5, 8, 15, 0.95)', zIndex: 9999, display: 'flex', 
          flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
          color: 'white', cursor: 'pointer', backdropFilter: 'blur(20px)',
          opacity: isRestMode ? 1 : 0,
          visibility: isRestMode ? 'visible' : 'hidden',
          pointerEvents: isRestMode ? 'auto' : 'none',
          transition: 'all 0.4s ease-in-out'
        }}
      >
        <h1 style={{ 
          fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-cyan)',
          transform: isRestMode ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          🌙 On a Break
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          transform: isRestMode ? 'translateY(0)' : 'translateY(20px)',
          transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          Tap anywhere on the screen to wake up the system.
        </p>
      </div>

      <header className={styles.statusBar}>
        <div className={styles.logoGroup} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span className={styles.brandText}>Time<span className={styles.brandAccent}>Fly</span></span>
          
          <span style={{ 
            color: '#ffffff', 
            fontSize: '2rem', 
            fontWeight: '900', 
            letterSpacing: '1px',
            textShadow: '0 0 15px rgba(255, 255, 255, 0.3)'
          }}>
            {currentSeat}
          </span>
          
          <span className={styles.airlineTag} style={{ 
            borderLeft: '1px solid rgba(255, 255, 255, 0.2)', 
            paddingLeft: '1.25rem',
            opacity: 0.9
          }}>
            {telemetry.flightPhase} Phase | {telemetry.weather} | {telemetry.passengerProfile}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`${styles.navButton} ${activeTab === 'media' ? styles.navButtonActive : styles.navButtonInactive}`}
            onClick={() => setActiveTab('media')}
          >
            🎬 Media Portal
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'social' ? styles.navButtonActive : styles.navButtonInactive}`}
            onClick={() => setActiveTab('social')}
          >
            👋 Connect & Play
            {hasUnreadIndicator && (
              <span style={{ 
                width: '8px', height: '8px', 
                background: toasts.some(t => t.type === 'alert') ? '#ff4444' : '#ff007f', 
                borderRadius: '50%', display: 'block', 
                boxShadow: `0 0 10px ${toasts.some(t => t.type === 'alert') ? '#ff4444' : '#ff007f'}` 
              }} />
            )}
          </button>
        </div>

        <div className={styles.flightMetrics}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', marginRight: '1rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>{timeString}</span>
          <button 
            className={styles.breakButton}
            onClick={() => setIsRestMode(true)} 
          >
            🌙 Go on Break
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.dashboardSection}>
          
          <div style={{ display: activeTab === 'media' ? 'block' : 'none', height: '100%' }}>
            <DashboardGrid telemetry={telemetry} />
          </div>

          <div style={{ display: activeTab === 'social' ? 'flex' : 'none', gap: '1.5rem', height: '100%' }}>
            <div style={{ flex: 1, minWidth: '350px' }}>
              <MatchSurvey 
                isMatched={isSeatSyncMatched}
                partnerSeat={partnerSeat}
                matchRequestStatus={matchRequestStatus}
                onSubmitProfile={submitSurvey}
                onSendMatchRequest={sendMatchRequest}
                onCancelRequest={cancelMatchRequest}
                onEditStart={() => setIsSeatSyncMatched(false)} 
                onDisconnect={() => {
                  terminateConnection();
                  setIsSeatSyncMatched(false);
                  setToasts([]);
                  setHasUnreadIndicator(false);
                }} 
                hasPartnerLeft={hasPartnerLeft}
                onAcknowledgeDisconnect={() => setIsSeatSyncMatched(false)}
              />
            </div>
            
            {isSeatSyncMatched && !hasPartnerLeft && (
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.5s ease-out', height: '100%', minHeight: 0 }}>
                <div style={{ flex: 2, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <ChatPanel messages={messages} onSendMessage={sendMessage} />
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  <div style={{ 
                    display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', 
                    padding: '0.4rem', borderRadius: '12px', width: 'fit-content' 
                  }}>
                    <button
                      onClick={() => setActiveGame('draw')}
                      style={{ 
                        background: activeGame === 'draw' ? 'var(--accent-cyan)' : 'transparent', 
                        color: activeGame === 'draw' ? '#000' : 'white', border: 'none', 
                        padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', 
                        fontWeight: 'bold', transition: 'all 0.2s' 
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🖌️ Canvas Guessing
                    </button>
                    <button
                      onClick={() => setActiveGame('artillery')}
                      style={{ 
                        background: activeGame === 'artillery' ? 'var(--accent-cyan)' : 'transparent', 
                        color: activeGame === 'artillery' ? '#000' : 'white', border: 'none', 
                        padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', 
                        fontWeight: 'bold', transition: 'all 0.2s' 
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🎯 Neon Artillery
                    </button>
                  </div>

                  <div style={{ position: 'relative', flex: 1, minHeight: 0, borderRadius: '16px', overflow: 'hidden' }}>
                    
                    <div style={{ 
                      height: '100%', 
                      filter: gameStates[activeGame] ? 'none' : 'blur(8px) brightness(0.4)', 
                      pointerEvents: gameStates[activeGame] ? 'auto' : 'none', 
                      transition: 'all 0.4s ease-in-out' 
                    }}>
                      {activeGame === 'draw' ? (
                        <DrawingBoard 
                          incomingStroke={incomingDrawPoint} 
                          onDrawStroke={sendDrawStroke} 
                          guesses={gameGuesses}
                          onSendGuess={sendGameGuess}
                          isMyTurn={isMyTurn}
                          onPassTurn={passTurn} 
                          isActive={gameStates.draw} 
                          onQuit={() => handleQuitGame('draw')} // <--- NEW: Passed down!
                          incomingClear={incomingClear}
                          onClearBoard={sendClearBoard}
                        />
                      ) : (
                        <ArtilleryGame 
                          playerSeat={currentSeat} 
                          isMyTurn={isMyTurn}
                          incomingMove={incomingArtilleryMove}
                          onSendMove={sendArtilleryMove}
                          incomingPosition={incomingArtilleryPosition}
                          onSendPosition={sendArtilleryPosition}
                          onTurnEnd={passTurn}
                          isActive={gameStates.artillery} 
                          onQuit={() => handleQuitGame('artillery')} // <--- NEW: Passed down!
                        />
                      )}
                    </div>

                    {!gameStates[activeGame] && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(10, 15, 26, 0.75)' }}>
                        {quitMessages[activeGame] && (
                          <div style={{ marginBottom: '2rem', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🛑</span>
                            <h3 style={{ color: '#ff4444', margin: 0, fontSize: '1.4rem' }}>{quitMessages[activeGame]}</h3>
                          </div>
                        )}
                        <button 
                          onClick={() => handleStartGame(activeGame)} 
                          style={{ 
                            padding: '1rem 2rem', background: 'var(--accent-cyan)', color: 'black', 
                            fontWeight: '900', borderRadius: '30px', border: 'none', cursor: 'pointer', 
                            fontSize: '1.2rem', boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)',
                            transition: 'transform 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          ▶ Play {activeGame === 'draw' ? 'Canvas' : 'Artillery'} with {partnerSeat}
                        </button>
                      </div>
                    )}
                    
                    {/* THE OLD FLOATING QUIT BUTTON WAS DELETED FROM RIGHT HERE! */}

                  </div>
                  
                </div>
              </div>
            )}
          </div>

        </section>

        <aside className={styles.sidebarSection}>
          <FlightSimulatorControls telemetry={telemetry} setTelemetry={setTelemetry} />
          
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
            onClick={triggerAI}
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
        </aside>
      </main>

      <RecommendationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} payload={aiData} />
    </div>
  );
};

export default App;