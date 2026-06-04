import React, { useRef, useState, useEffect } from 'react';
import styles from './DrawingBoard.module.css';

interface DrawPoint {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
}

interface DrawingBoardProps {
  incomingStroke?: DrawPoint | null;
  onDrawStroke?: (point: DrawPoint) => void;
}

// PREMIUM UPGRADE: Pre-defined Neon Palette
const NEON_COLORS = [
  '#00d2ff', // Cyan
  '#ff007f', // Neon Pink
  '#00ff66', // Neon Green
  '#ffea00', // Bright Yellow
  '#ffffff'  // Pure White
];

export const DrawingBoard: React.FC<DrawingBoardProps> = ({ incomingStroke, onDrawStroke }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(NEON_COLORS[0]);
  const lastPos = useRef({ x: 0, y: 0 });

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

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

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
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

    if (onDrawStroke) {
      onDrawStroke({
        x: currentX, y: currentY, prevX: lastPos.current.x, prevY: lastPos.current.y, color
      });
    }

    lastPos.current = { x: currentX, y: currentY };
  };

  return (
    <div className={styles.boardContainer}>
      <div className={styles.controlHeader}>
        <div className={styles.titleGroup}>
          <h4>Shared Canvas</h4>
          <span className={styles.liveTag}>LIVE</span>
        </div>
        
        <div className={styles.tools}>
          {/* PREMIUM UPGRADE: Custom Color Swatches */}
          <div className={styles.palette}>
            {NEON_COLORS.map(c => (
              <button
                key={c}
                className={`${styles.swatch} ${color === c ? styles.activeSwatch : ''}`}
                style={{ backgroundColor: c, boxShadow: color === c ? `0 0 10px ${c}` : 'none' }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>
          
          <button className={styles.clearBtn} onClick={clearBoard}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Clear
          </button>
        </div>
      </div>

      <div className={styles.canvasWrapper} style={{ '--glow-color': color } as React.CSSProperties}>
        <canvas
          ref={canvasRef}
          className={styles.canvasElement}
          width={600}
          height={260}
          onMouseDown={(e) => {
            setIsDrawing(true);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            }
          }}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
        />
      </div>
    </div>
  );
};