import React, { useRef, useState, useEffect } from 'react';
import styles from './DrawingBoard.module.css';

interface DrawPoint { x: number; y: number; prevX: number; prevY: number; color: string; }
interface GameGuess { id: string; sender: string; text: string; }

interface DrawingBoardProps {
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
  incomingStroke, onDrawStroke, guesses = [], onSendGuess, isMyTurn, onPassTurn, isActive, onQuit , incomingClear, onClearBoard
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guessesEndRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(NEON_COLORS[0]);
  const [guessInput, setGuessInput] = useState('');
  const lastPos = useRef({ x: 0, y: 0 });

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
      ctx.beginPath();
      ctx.strokeStyle = incomingStroke.color;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.moveTo(incomingStroke.prevX, incomingStroke.prevY);
      ctx.lineTo(incomingStroke.x, incomingStroke.y);
      ctx.stroke();
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

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

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
          <span className={styles.liveTag} style={{ background: isMyTurn ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 0, 127, 0.2)', color: isMyTurn ? 'var(--accent-cyan)' : '#ff007f' }}>
            {isMyTurn ? "YOUR TURN" : "WAITING..."}
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
            style={{ marginLeft: '10px', background: 'rgba(0, 210, 255, 0.2)', color: 'var(--accent-cyan)' }}
          >
            ⏭ Pass Turn
          </button>
        </div>
      </div>

      <div className={styles.canvasWrapper} style={{ '--glow-color': color } as React.CSSProperties}>
        <canvas
          ref={canvasRef}
          className={styles.canvasElement}
          width={600}
          height={200}
          style={{ pointerEvents: isMyTurn ? 'auto' : 'none', cursor: isMyTurn ? 'crosshair' : 'default' }} 
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
            <div className={styles.emptyGame}>Start drawing! The other passenger will guess here.</div>
          ) : (
            guesses.map(g => (
              <div key={g.id} className={styles.guessRow}>
                <span className={styles.guesserName}>{g.sender}:</span>
                <span className={styles.guessText}>{g.text}</span>
              </div>
            ))
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
          />
          <button 
            type="submit" 
            className={styles.guessBtn} 
            disabled={!guessInput.trim() || isMyTurn}
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