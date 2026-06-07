import React, { useRef, useState, useEffect } from 'react';
import styles from './DrawingBoard.module.css';

interface DrawPoint { x: number; y: number; prevX: number; prevY: number; color: string; }
interface GameGuess { id: string; sender: string; text: string; }

interface DrawingBoardProps {
  playerSeat: string;
  partnerSeat: string;
  gameInitiator: string | null;
  incomingStroke?: DrawPoint | null;
  onDrawStroke?: (point: DrawPoint) => void;
  guesses?: GameGuess[];
  onSendGuess?: (text: string) => void;
  isMyTurn: boolean;
  onPassTurn?: () => void;
  isActive: boolean;
  onQuit?: () => void; // NEW: Added onQuit prop
  incomingClear?: number;
  onClearBoard?: () => void;
}

const NEON_COLORS = ['#00d2ff', '#ff007f', '#00ff66', '#ffea00', '#ffffff'];

export const DrawingBoard: React.FC<DrawingBoardProps> = ({ 
  playerSeat, partnerSeat,gameInitiator,
  incomingStroke, onDrawStroke, guesses = [], onSendGuess, isMyTurn, onPassTurn, isActive, onQuit , incomingClear, onClearBoard
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guessesEndRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(NEON_COLORS[0]);
  const [guessInput, setGuessInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const p1Seat = gameInitiator || playerSeat;
  const amIP1 = playerSeat === p1Seat;
  
  const myThemeColor = amIP1 ? 'var(--accent-cyan)' : '#ff007f';
  const myBgColor = amIP1 ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 0, 127, 0.2)';
  const partnerThemeColor = amIP1 ? '#ff007f' : 'var(--accent-cyan)';
  
  const activeTurnColor = isMyTurn ? myThemeColor : partnerThemeColor;
  const activeBgColor = activeTurnColor === 'var(--accent-cyan)' ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 0, 127, 0.2)';

  const clearBoard = () => {
    if (!isMyTurn) return; 
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onClearBoard) onClearBoard(); // <--- Tells the partner!
    }
  };

  useEffect(() => {
    if (isActive && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [isActive]);

  useEffect(() => {
    if (!incomingStroke) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.beginPath();
      
      // NEW: Check for the ERASER flag
      if (incomingStroke.color === 'ERASER') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20; // Make the eraser thicker!
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 3;
        ctx.strokeStyle = incomingStroke.color;
      }

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.moveTo(incomingStroke.prevX, incomingStroke.prevY);
      ctx.lineTo(incomingStroke.x, incomingStroke.y);
      ctx.stroke();
      ctx.restore();
    }
  }, [incomingStroke]);

  // Auto-scroll the game guesses
  useEffect(() => {
    guessesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [guesses]);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isMyTurn) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.save();
    ctx.beginPath();
    
    // NEW: Check for the ERASER flag
    if (color === 'ERASER') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20; // Make the eraser thicker!
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    ctx.restore();

    if (onDrawStroke) onDrawStroke({ x: currentX, y: currentY, prevX: lastPos.current.x, prevY: lastPos.current.y, color });
    lastPos.current = { x: currentX, y: currentY };
  };

  useEffect(() => {
    if (incomingClear && incomingClear > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [incomingClear]);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || !onSendGuess || isMyTurn) return;
    onSendGuess(guessInput.trim());
    setGuessInput('');
  };

  return (
    <div className={styles.boardContainer}>
      <div className={styles.controlHeader}>
        <div className={styles.titleGroup}>
          <h4>Co-op Pictionary</h4>
          <span className={styles.liveTag} style={{ background: myBgColor, color: myThemeColor }}>
            {isMyTurn ? "DRAW" : "WAITING..."}
          </span>
        </div>
        
        <div className={styles.tools} style={{ opacity: isMyTurn ? 1 : 0.4, pointerEvents: isMyTurn ? 'auto' : 'none' }}>
          <div className={styles.palette}>
            {NEON_COLORS.map(c => (
              <button 
                key={c} 
                className={`${styles.swatch} ${color === c ? styles.activeSwatch : ''}`} 
                style={{ backgroundColor: c, boxShadow: color === c ? `0 0 10px ${c}` : 'none' }} 
                onClick={() => setColor(c)} 
                disabled={!isMyTurn}
              />
            ))}
            
            {/* NEW ERASER BUTTON */}
            <button 
              onClick={() => setColor('ERASER')} 
              disabled={!isMyTurn}
              style={{
                marginLeft: '0.5rem', padding: '0.2rem 0.6rem', borderRadius: '8px', cursor: !isMyTurn ? 'not-allowed' : 'pointer',
                background: color === 'ERASER' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white', border: color === 'ERASER' ? '1px solid white' : '1px solid rgba(255,255,255,0.2)'
              }}
            >
              🧽
            </button>
          </div>
          <button className={styles.clearBtn} onClick={clearBoard} disabled={!isMyTurn}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Clear
          </button>
          
          <button 
            className={styles.clearBtn} 
            onClick={onPassTurn} 
            disabled={!isMyTurn} 
            style={{ 
              marginLeft: '10px', 
              background: myBgColor, 
              color: myThemeColor,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.4rem 0.6rem',
              minWidth: '90px' /* 🛑 Locks the exact width! */
            }}
          >
            <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>⏭</span>
            <span style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', fontWeight: 'bold' }}>Pass Turn</span>
          </button>
        </div>
      </div>

      <div className={styles.canvasWrapper} style={{ '--glow-color': color } as React.CSSProperties}>
        <canvas
          ref={canvasRef}
          className={styles.canvasElement}
          width={600}
          height={200}
          style={{ 
            pointerEvents: isMyTurn ? 'auto' : 'none', 
            cursor: isMyTurn ? (color === 'ERASER' ? 'cell' : 'crosshair') : 'default' // <--- UPDATED CURSOR
          }}
          onMouseDown={(e) => {
            if (!isMyTurn) return;
            setIsDrawing(true);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          }}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
        />
      </div>

      <div className={styles.gameSection}>
        <div className={styles.guessList}>
          {guesses.length === 0 ? (
            <div className={styles.emptyGame}>
              {isMyTurn 
                ? "Start drawing! The other passenger will guess here." 
                : "Watch closely! Type your guess below..."}
            </div>
          ) : (
            guesses.map(g => {
              
              // 🛑 THE FIX: g.sender looks like "Seat 12A". We simply check if it contains the Blue player's seat!
              const isP1Sender = g.sender.includes(p1Seat);
              
              // If it has P1's seat number, it's Cyan. If not, it's Pink!
              const guessColor = isP1Sender ? 'var(--accent-cyan)' : '#ff007f';
              
              return (
                <div key={g.id} className={styles.guessRow}>
                  <span className={styles.guesserName} style={{ color: guessColor, fontWeight: 'bold' }}>{g.sender}:</span>
                  <span className={styles.guessText} style={{ color: guessColor }}>{g.text}</span>
                </div>
              );
            })
          )}
          <div ref={guessesEndRef} />
        </div>
        
        <form onSubmit={handleGuessSubmit} className={styles.guessForm}>
          <input 
            type="text" 
            placeholder={isMyTurn ? "You are drawing! Your partner is guessing..." : "Type your guess here..."} 
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            className={styles.guessInput}
            disabled={isMyTurn}
            onFocus={() => setIsFocused(true)}   /* 🛑 NEW: Triggers glow */
            onBlur={() => setIsFocused(false)}   /* 🛑 NEW: Removes glow */
            style={isFocused ? {                 /* 🛑 NEW: Dynamic styling */
              outline: 'none',
              border: `1px solid ${myThemeColor}`,
              boxShadow: `0 0 15px ${myThemeColor}`
            } : { transition: 'all 0.2s ease' }}
          />
          <button 
            type="submit" 
            className={styles.guessBtn} 
            disabled={!guessInput.trim() || isMyTurn}
            style={{
              background: (!guessInput.trim() || isMyTurn) ? 'transparent' : myThemeColor,
              color: (!guessInput.trim() || isMyTurn) ? 'var(--text-secondary)' : '#000',
              border: (!guessInput.trim() || isMyTurn) ? '1px solid var(--text-secondary)' : 'none',
              boxShadow: (!guessInput.trim() || isMyTurn) ? 'none' : `0 0 10px ${myThemeColor}`,
              transition: 'all 0.2s ease',
              cursor: (!guessInput.trim() || isMyTurn) ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => {
              if (guessInput.trim() && !isMyTurn) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 0 20px ${myThemeColor}`;
              }
            }}
            onMouseOut={(e) => {
              if (guessInput.trim() && !isMyTurn) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 0 10px ${myThemeColor}`;
              }
            }}
          >
            Guess
          </button>
        </form>
      </div>

      {/* NEW: Quit Game Button nicely placed in the natural flow below the guessing section */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <button 
          onClick={onQuit} 
          style={{ 
            background: '#ff4444', color: '#ffffff', border: 'none', 
            borderRadius: '8px', padding: '0.5rem 1.5rem', cursor: 'pointer', 
            fontWeight: 'bold', transition: 'all 0.2s', width: '100%', maxWidth: '200px',
            boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)'
          }}
          onMouseOver={(e) => { 
            e.currentTarget.style.background = '#e60000'; 
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => { 
            e.currentTarget.style.background = '#ff4444'; 
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🛑 Quit Game
        </button>
      </div>

    </div>
  );
};