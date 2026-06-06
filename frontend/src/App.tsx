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
import { ArtilleryGame } from './components/SeatSync/ArtilleryGame';
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
  const partnerSeat = currentSeat === '12A' ? '14B' : '12A';

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
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'message' | 'alert'>('message');
  const [hasUnreadIndicator, setHasUnreadIndicator] = useState(false);

  const { 
    messages, incomingDrawPoint, sendMessage, sendDrawStroke, hasPartnerLeft,
    gameGuesses, sendGameGuess, activeTurnSeat,
    incomingArtilleryMove, sendArtilleryMove, passTurn, 
    matchRequestStatus, incomingMatchRequest, sendMatchRequest, respondToMatchRequest,
    partnerGameSession, sendGameSessionUpdate, terminateConnection, resetGameState, incomingClear, sendClearBoard,
    cancelMatchRequest, incomingArtilleryPosition, sendArtilleryPosition
  } = useSeatSyncSocket('room_12A_14B', isSeatSyncMatched, currentSeat);

  const isMyTurn = activeTurnSeat === currentSeat;

  useEffect(() => {
    if (matchRequestStatus === 'accepted' && !isSeatSyncMatched) {
      setIsSeatSyncMatched(true);
    }
  }, [matchRequestStatus, isSeatSyncMatched]);

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

  useEffect(() => {
    if (hasPartnerLeft && activeTab === 'media') {
      setToastNotification(`Seat ${partnerSeat} has terminated the connection.`);
      setToastType('alert');
      setHasUnreadIndicator(true);
    }
  }, [hasPartnerLeft, activeTab, partnerSeat]);

  useEffect(() => {
    if (activeTab === 'social') {
      setHasUnreadIndicator(false);
      setToastNotification(null); 
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
        setToastNotification(`Seat ${partnerSeat} quit the ${partnerGameSession.game === 'draw' ? 'Canvas' : 'Artillery'} game.`);
        setToastType('alert');
        setHasUnreadIndicator(true);
        setQuitMessages(prev => ({ ...prev, [partnerGameSession.game]: `Seat ${partnerSeat} quit the game.` })); // <--- SET MESSAGE
      }
    }
  }, [partnerGameSession, partnerSeat, resetGameState]);

  const forceTriggerAI = () => {
    setAiData(MOCK_AI_RESPONSE);
    setIsModalOpen(true);
  };

  const handleIdle = useCallback(() => {
    if (!isModalOpen && !isRestMode) forceTriggerAI();
  }, [isModalOpen, isRestMode]);

  useIdleTimer({ timeoutMs: 120000, onIdle: handleIdle });

  const handleStartGame = (game: 'draw' | 'artillery') => {
    setGameStates(prev => ({ ...prev, [game]: true }));
    sendGameSessionUpdate(game, 'start'); 
    resetGameState(); 
  };

  const handleQuitGame = (game: 'draw' | 'artillery') => {
    setGameStates(prev => ({ ...prev, [game]: false }));
    sendGameSessionUpdate(game, 'quit'); 
    setToastNotification(`You quit the ${game === 'draw' ? 'Canvas' : 'Artillery'} game.`);
    setToastType('alert');
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

      {toastNotification && (
        <div style={{
          position: 'fixed', top: '5.5rem', right: '1.5rem',
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
                {toastType === 'alert' ? 'CONNECTION UPDATE' : 'NEW COMMS LINK MESSAGE'}
              </strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toastNotification}</p>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setToastNotification(null); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '1.5rem', cursor: 'pointer', padding: 0, lineHeight: '1rem' }}>×</button>
        </div>
      )}

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
              <span style={{ width: '8px', height: '8px', background: toastType === 'alert' ? '#ff4444' : '#ff007f', borderRadius: '50%', display: 'block', boxShadow: `0 0 10px ${toastType === 'alert' ? '#ff4444' : '#ff007f'}` }} />
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
                onSendMatchRequest={sendMatchRequest}
                onCancelRequest={cancelMatchRequest}
                onEditStart={() => setIsSeatSyncMatched(false)} 
                onDisconnect={() => {
                  terminateConnection();
                  setIsSeatSyncMatched(false);
                  setToastNotification(null);
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
            onClick={forceTriggerAI}
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