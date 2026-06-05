import React, { useRef, useEffect, useState } from 'react';
import styles from './ArtilleryGame.module.css';

export interface ArtilleryGameProps {
  playerSeat: string;
  isMyTurn: boolean; // NEW: Receives the turn state from App.tsx
}

export const ArtilleryGame: React.FC<ArtilleryGameProps> = ({ playerSeat, isMyTurn }) => {
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

  // NEW: Automatically update the instruction text based on whose turn it is
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

    // Draw P1 Base (Cyan)
    ctx.fillStyle = '#00d2ff';
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 15;
    ctx.fillRect(30, floorY - 30, 40, 30);

    // Draw P2 Base (Pink)
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.fillRect(width - 70, floorY - 30, 40, 30);

    // Draw Mountain Obstacle
    ctx.fillStyle = '#2a3143';
    ctx.shadowBlur = 0; // Turn off glow for obstacle
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

  const handleFire = () => {
    // Failsafe: Don't allow firing if it's animating or not your turn
    if (isAnimating || !isMyTurn) return;
    
    setIsAnimating(true);
    setStatusMsg("Firing...");

    // Convert angle to radians
    const rad = (angle * Math.PI) / 180;
    
    // Physics variables
    let x = 50; // Starting X (Center of P1 base)
    let y = floorY - 30; // Starting Y
    let vx = Math.cos(rad) * (power * 0.25); // Scale power down for canvas size
    let vy = -Math.sin(rad) * (power * 0.25);
    const gravity = 0.5;

    const animate = () => {
      x += vx;
      y += vy;
      vy += gravity; // Gravity pulls it down

      drawScene({ x, y });

      // Collision Detection
      let hitFloor = y >= floorY;
      let hitObstacle = x > (width / 2 - 40) && x < (width / 2 + 40) && y > (floorY - obstacleHeight);
      let hitOpponent = x > (width - 70) && x < (width - 30) && y > (floorY - 30);

      if (hitOpponent) {
        setStatusMsg("Direct Hit! Target Damaged.");
        setP2Health(prev => Math.max(0, prev - 1));
        endTurn();
        return;
      }

      if (hitObstacle) {
        setStatusMsg("Miss! You hit the mountain.");
        endTurn();
        return;
      }

      if (hitFloor || x > width || x < 0) {
        setStatusMsg("Miss! Shot landed out of bounds.");
        endTurn();
        return;
      }

      requestAnimationFrame(animate);
    };

    animate();
  };

  const endTurn = () => {
    setTimeout(() => {
      // Randomize the mountain for the next round!
      setObstacleHeight(Math.floor(Math.random() * 100) + 50);
      setIsAnimating(false);
      
      // Tomorrow: Prathamesh's backend will emit the turn update here
      // which will instantly flip isMyTurn to false on your screen!
      
      drawScene();
    }, 1500);
  };

  return (
    <div className={styles.gameWrapper}>
      <div className={styles.header}>
        <h4 className={styles.title}>🎯 Neon Artillery</h4>
        <div className={styles.scoreBoard}>
          <div className={styles.healthDisplay}>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>YOU</span>
            <div className={styles.healthBar}>
              <div className={`${styles.healthFill} ${styles.p1Fill}`} style={{ width: `${(p1Health / 10) * 100}%` }} />
            </div>
          </div>
          <div className={styles.healthDisplay}>
            <span style={{ fontSize: '0.7rem', color: '#ff007f' }}>OPPONENT</span>
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
          {/* UPDATED: Disabled when waiting */}
          <input 
            type="range" min="0" max="90" value={angle} 
            onChange={(e) => setAngle(Number(e.target.value))}
            className={styles.slider} disabled={isAnimating || !isMyTurn}
          />
        </div>
        <div className={styles.sliderGroup}>
          <label>Power: <span>{power}%</span></label>
          {/* UPDATED: Disabled when waiting */}
          <input 
            type="range" min="10" max="100" value={power} 
            onChange={(e) => setPower(Number(e.target.value))}
            className={styles.slider} disabled={isAnimating || !isMyTurn}
          />
        </div>
        {/* UPDATED: Button visually changes and locks when waiting */}
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