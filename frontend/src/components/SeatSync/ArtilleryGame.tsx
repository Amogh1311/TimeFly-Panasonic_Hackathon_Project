import React, { useRef, useEffect, useState } from 'react';
import styles from './ArtilleryGame.module.css';

export interface ArtilleryGameProps {
  playerSeat: string;
  partnerSeat: string;
  gameInitiator: string | null;
  isMyTurn: boolean;
  incomingMove?: { angle: number; power: number; nextObstacle: number } | null;
  onSendMove?: (move: { angle: number; power: number; nextObstacle: number }) => void;
  incomingPosition?: { seat: string; x: number } | null; // NEW: Movement Prop
  onSendPosition?: (position: { seat: string; x: number }) => void; // NEW: Movement Prop
  onTurnEnd?: () => void;
  isActive: boolean; 
  onQuit?: () => void;
}

export const ArtilleryGame: React.FC<ArtilleryGameProps> = ({ 
  playerSeat,partnerSeat,gameInitiator, isMyTurn, incomingMove, onSendMove, incomingPosition, onSendPosition, onTurnEnd, isActive, onQuit 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const [p1Health, setP1Health] = useState(10);
  const [p2Health, setP2Health] = useState(10);
  const [p1X, setP1X] = useState(50); // NEW: P1 Position
  const [p2X, setP2X] = useState(550); // NEW: P2 Position
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(60);
  const [isAnimating, setIsAnimating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  
  // Dynamic Obstacle (Randomized height between 50 and 150)
  const [obstacleHeight, setObstacleHeight] = useState(100);

  // 🛑 NEW: Deterministic Player Assignment (Alphabetical Sort)
  const p1Seat = gameInitiator || playerSeat;
  const p2Seat = p1Seat === playerSeat ? partnerSeat : playerSeat;
  const amIP1 = playerSeat === p1Seat;
  const themeColor = amIP1 ? 'var(--accent-cyan)' : '#ff007f';

  // Listen for opponent's movement dynamically
  useEffect(() => {
    if (incomingPosition) {
      if (incomingPosition.seat === p1Seat) setP1X(incomingPosition.x);
      if (incomingPosition.seat === p2Seat) setP2X(incomingPosition.x);
    }
  }, [incomingPosition, p1Seat, p2Seat]);

  // Reset game state when a new session starts
  useEffect(() => {
    if (isActive) {
      setP1Health(10);
      setP2Health(10);
      setP1X(50);
      setP2X(550);
      setAngle(45);
      setPower(60);
      setStatusMsg("");
      setIsAnimating(false);
      drawScene();
    }
  }, [isActive]);

  // Automatically update the instruction text based on whose turn it is
  useEffect(() => {
    if (!isAnimating) {
      setStatusMsg(isMyTurn ? "Your Turn: Lock in Angle & Power" : "Waiting for Opponent to Fire...");
    }
  }, [isMyTurn, isAnimating]);

  // Constants for drawing
  const width = 600;
  const height = 250;
  const floorY = height - 20;

  const drawScene = (projectile?: { x: number, y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Draw Floor
    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, floorY, width, height - floorY);

    // Draw P1 Base (Cyan - 12A)
    ctx.fillStyle = '#00d2ff';
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 15;
    ctx.fillRect(p1X - 20, floorY - 30, 40, 30); // Dynamic X

    // Draw P2 Base (Pink - 14B)
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.fillRect(p2X - 20, floorY - 30, 40, 30); // Dynamic X

    // Draw Mountain Obstacle
    ctx.fillStyle = '#2a3143';
    ctx.shadowBlur = 0; 
    ctx.beginPath();
    ctx.moveTo(width / 2 - 40, floorY);
    ctx.lineTo(width / 2, floorY - obstacleHeight);
    ctx.lineTo(width / 2 + 40, floorY);
    ctx.fill();

    // Draw Projectile if active
    if (projectile) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Initial draw
  useEffect(() => {
    drawScene();
  }, [obstacleHeight, p1Health, p2Health, p1X, p2X]);

  // The Master Physics Engine
  const executeShot = (shotAngle: number, shotPower: number, isOpponent: boolean, nextObsHeight: number) => {
    setIsAnimating(true);
    setStatusMsg(isOpponent ? "Incoming Missile!!!" : "Firing...");

    const rad = (shotAngle * Math.PI) / 180;
    
    // Determine who is actually shooting based on the seat

    const shooterIsP1 = isOpponent ? !amIP1 : amIP1;

    // Physics variables (Start from dynamic X positions)
    let x = shooterIsP1 ? p1X : p2X; 
    let y = floorY - 30; 
    
    // P1 shoots right (positive X), P2 shoots left (negative X)
    let direction = shooterIsP1 ? 1 : -1;
    let vx = direction * Math.cos(rad) * (shotPower * 0.25); 
    let vy = -Math.sin(rad) * (shotPower * 0.25);
    const gravity = 0.5;

    const animate = () => {
      x += vx;
      y += vy;
      vy += gravity;

      drawScene({ x, y });

      let hitFloor = y >= floorY;
      let hitObstacle = x > (width / 2 - 40) && x < (width / 2 + 40) && y > (floorY - obstacleHeight);
      
      // Dynamic Hitboxes
      let hitP1 = x > (p1X - 20) && x < (p1X + 20) && y > (floorY - 30);
      let hitP2 = x > (p2X - 20) && x < (p2X + 20) && y > (floorY - 30);

      if (hitP1 || hitP2) {
        if (hitP1) setP1Health(prev => Math.max(0, prev - 1));
        if (hitP2) setP2Health(prev => Math.max(0, prev - 1));
        
        const iGotHit = (hitP1 && amIP1) || (hitP2 && !amIP1);
        setStatusMsg(iGotHit ? "Direct Hit! You took damage." : "Direct Hit! Target Damaged.");
        endShot(nextObsHeight, !isOpponent);
        return;
      }

      if (hitObstacle) {
        setStatusMsg("Miss! The shot hit the mountain.");
        endShot(nextObsHeight, !isOpponent);
        return;
      }

      if (hitFloor || x > width || x < 0) {
        setStatusMsg("Miss! Shot landed out of bounds.");
        endShot(nextObsHeight, !isOpponent);
        return;
      }

      requestAnimationFrame(animate);
    };

    animate();
  };

  // Listen for the opponent firing
  useEffect(() => {
    if (incomingMove && !isMyTurn) {
      executeShot(incomingMove.angle, incomingMove.power, true, incomingMove.nextObstacle);
    }
  }, [incomingMove]);

  // Local Firing Action
  const handleFire = () => {
    if (isAnimating || !isMyTurn) return;
    
    const nextObs = Math.floor(Math.random() * 100) + 50;
    
    if (onSendMove) {
      onSendMove({ angle, power, nextObstacle: nextObs });
    }
    
    executeShot(angle, power, false, nextObs);
  };

  // Local Movement Action
  const handleMove = (direction: 'left' | 'right') => {
    if (isAnimating || !isMyTurn) return;

    const step = 20; // Move 20px per click
    let newX = amIP1 ? p1X : p2X;

    if (direction === 'left') newX -= step;
    if (direction === 'right') newX += step;

    // Prevent crossing the mountain or falling off the map
    if (amIP1) {
      if (newX < 20) newX = 20;
      if (newX > width / 2 - 60) newX = width / 2 - 60;
      setP1X(newX);
    } else {
      if (newX < width / 2 + 60) newX = width / 2 + 60;
      if (newX > width - 20) newX = width - 20;
      setP2X(newX);
    }

    if (onSendPosition) {
      onSendPosition({ seat: playerSeat, x: newX });
    }
  };

  const endShot = (nextObsHeight: number, wasMyShot: boolean) => {
    setTimeout(() => {
      setObstacleHeight(nextObsHeight);
      setIsAnimating(false);
      drawScene();
      
      if (wasMyShot && onTurnEnd) {
        onTurnEnd();
      }
    }, 1500);
  };
  return (
    <div className={styles.gameWrapper}>
      <div className={styles.header}>
        <h4 className={styles.title}>🎯 Neon Artillery</h4>
        <div className={styles.scoreBoard}>
          
          {/* Player 1 / Left Side (Cyan) */}
          <div className={styles.healthDisplay}>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
              {p1Seat === playerSeat ? `Seat ${p1Seat} (You)` : `Seat ${p1Seat}`}
            </span>
            <div className={styles.healthBar}>
              <div className={`${styles.healthFill} ${styles.p1Fill}`} style={{ width: `${(p1Health / 10) * 100}%` }} />
            </div>
          </div>

          {/* Player 2 / Right Side (Pink) */}
          <div className={styles.healthDisplay}>
            <span style={{ fontSize: '0.7rem', color: '#ff007f', fontWeight: 'bold' }}>
              {p2Seat === playerSeat ? `Seat ${p2Seat} (You)` : `Seat ${p2Seat}`}
            </span>
            <div className={styles.healthBar}>
              <div className={`${styles.healthFill} ${styles.p2Fill}`} style={{ width: `${(p2Health / 10) * 100}%` }} />
            </div>
          </div>

        </div>
      </div>

      <p className={styles.statusText} style={{ color: isMyTurn ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
        {statusMsg}
      </p>

      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} width={600} height={250} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      <div className={styles.controls}>
        
        {/* NEW MOVEMENT CONTROLS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            onClick={() => handleMove('left')} 
            disabled={isAnimating || !isMyTurn}
            style={{
              background: 'transparent', color: themeColor, border: `1px solid ${themeColor}`,
              padding: '0.4rem 1rem', borderRadius: '8px', cursor: (isAnimating || !isMyTurn) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', opacity: (isAnimating || !isMyTurn) ? 0.4 : 1, transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { 
              if (!isAnimating && isMyTurn) {
                e.currentTarget.style.background = amIP1 ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 0, 127, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => { 
              if (!isAnimating && isMyTurn) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            ⬅️ Drive
          </button>
          <button 
            onClick={() => handleMove('right')} 
            disabled={isAnimating || !isMyTurn}
            style={{
              background: 'transparent', color: themeColor, border: `1px solid ${themeColor}`,
              padding: '0.4rem 1rem', borderRadius: '8px', cursor: (isAnimating || !isMyTurn) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', opacity: (isAnimating || !isMyTurn) ? 0.4 : 1, transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { 
              if (!isAnimating && isMyTurn) {
                e.currentTarget.style.background = amIP1 ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 0, 127, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => { 
              if (!isAnimating && isMyTurn) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            Drive ➡️
          </button>
        </div>

        <div className={styles.sliderGroup}>
          <label>Angle: <span style={{ color: themeColor }}>{angle}°</span></label>
          <input 
            type="range" min="0" max="90" value={angle} 
            onChange={(e) => setAngle(Number(e.target.value))}
            className={styles.slider} disabled={isAnimating || !isMyTurn}
            style={{ accentColor: themeColor }} 
          />
        </div>
        <div className={styles.sliderGroup}>
          <label>Power: <span style={{ color: themeColor }}>{power}%</span></label>
          <input 
            type="range" min="10" max="100" value={power} 
            onChange={(e) => setPower(Number(e.target.value))}
            className={styles.slider} disabled={isAnimating || !isMyTurn}
            style={{ accentColor: themeColor }} 
          />
        </div>
        <button 
          className={styles.fireBtn} 
          onClick={handleFire} 
          disabled={isAnimating || !isMyTurn}
          style={{
            background: (isAnimating || !isMyTurn) ? 'transparent' : themeColor,
            color: (isAnimating || !isMyTurn) ? 'var(--text-secondary)' : '#000',
            border: (isAnimating || !isMyTurn) ? '1px solid var(--text-secondary)' : 'none',
            boxShadow: (isAnimating || !isMyTurn) ? 'none' : `0 0 15px ${themeColor}`,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (!isAnimating && isMyTurn) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 0 25px ${themeColor}`;
            }
          }}
          onMouseOut={(e) => {
            if (!isAnimating && isMyTurn) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 0 15px ${themeColor}`;
            }
          }}
        >
          {isMyTurn ? "🔥 FIRE" : "WAITING..."}
        </button>
      </div>

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