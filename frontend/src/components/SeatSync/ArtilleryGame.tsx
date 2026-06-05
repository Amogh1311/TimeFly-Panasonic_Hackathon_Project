import React, { useRef, useEffect, useState } from 'react';
import styles from './ArtilleryGame.module.css';

export interface ArtilleryGameProps {
  playerSeat: string;
  isMyTurn: boolean;
  incomingMove?: { angle: number; power: number; nextObstacle: number } | null;
  onSendMove?: (move: { angle: number; power: number; nextObstacle: number }) => void;
  onTurnEnd?: () => void;
  isActive: boolean; // NEW: Added to track if the game just started
}

export const ArtilleryGame: React.FC<ArtilleryGameProps> = ({ 
  playerSeat, isMyTurn, incomingMove, onSendMove, onTurnEnd, isActive 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const [p1Health, setP1Health] = useState(10);
  const [p2Health, setP2Health] = useState(10);
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(60);
  const [isAnimating, setIsAnimating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  
  // Dynamic Obstacle (Randomized height between 50 and 150)
  const [obstacleHeight, setObstacleHeight] = useState(100);

  // NEW: Reset game state when a new session starts
  useEffect(() => {
    if (isActive) {
      setP1Health(10);
      setP2Health(10);
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
    ctx.fillRect(30, floorY - 30, 40, 30);

    // Draw P2 Base (Pink - 14B)
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.fillRect(width - 70, floorY - 30, 40, 30);

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
  }, [obstacleHeight, p1Health, p2Health]);

  // The Master Physics Engine
  const executeShot = (shotAngle: number, shotPower: number, isOpponent: boolean, nextObsHeight: number) => {
    setIsAnimating(true);
    setStatusMsg(isOpponent ? "Incoming Missile!!!" : "Firing...");

    const rad = (shotAngle * Math.PI) / 180;
    
    // Determine who is actually shooting based on the seat
    const amIP1 = playerSeat === '12A';
    const shooterIsP1 = isOpponent ? !amIP1 : amIP1;

    // Physics variables (P1 shoots from left, P2 shoots from right)
    let x = shooterIsP1 ? 50 : width - 50; 
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
      let hitP1 = x > 30 && x < 70 && y > (floorY - 30);
      let hitP2 = x > width - 70 && x < width - 30 && y > (floorY - 30);

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
          
          <div className={styles.healthDisplay}>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
              {playerSeat === '12A' ? 'YOU (12A)' : '12A'}
            </span>
            <div className={styles.healthBar}>
              <div className={`${styles.healthFill} ${styles.p1Fill}`} style={{ width: `${(p1Health / 10) * 100}%` }} />
            </div>
          </div>

          <div className={styles.healthDisplay}>
            <span style={{ fontSize: '0.7rem', color: '#ff007f' }}>
              {playerSeat === '14B' ? 'YOU (14B)' : '14B'}
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
        <div className={styles.sliderGroup}>
          <label>Angle: <span>{angle}°</span></label>
          <input 
            type="range" min="0" max="90" value={angle} 
            onChange={(e) => setAngle(Number(e.target.value))}
            className={styles.slider} disabled={isAnimating || !isMyTurn}
          />
        </div>
        <div className={styles.sliderGroup}>
          <label>Power: <span>{power}%</span></label>
          <input 
            type="range" min="10" max="100" value={power} 
            onChange={(e) => setPower(Number(e.target.value))}
            className={styles.slider} disabled={isAnimating || !isMyTurn}
          />
        </div>
        <button 
          className={styles.fireBtn} 
          onClick={handleFire} 
          disabled={isAnimating || !isMyTurn}
        >
          {isMyTurn ? "FIRE" : "WAITING..."}
        </button>
      </div>
    </div>
  );
};