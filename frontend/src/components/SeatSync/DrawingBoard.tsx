import React, { useRef, useState, useEffect } from 'react';
import styles from './DrawingBoard.module.css';

interface DrawPoint {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
}

// NEW: This interface tells TypeScript to expect stroke data from App.tsx!
interface DrawingBoardProps {
  incomingStroke?: DrawPoint | null;
  onDrawStroke?: (point: DrawPoint) => void;
}

export const DrawingBoard: React.FC<DrawingBoardProps> = ({ incomingStroke, onDrawStroke }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#00d2ff');
  const lastPos = useRef({ x: 0, y: 0 });

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Sync external incoming strokes painted by the other passenger
  useEffect(() => {
    if (!incomingStroke) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = incomingStroke.color;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
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
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Send stroke data to App.tsx so it can be routed through the WebSocket
    if (onDrawStroke) {
      onDrawStroke({
        x: currentX,
        y: currentY,
        prevX: lastPos.current.x,
        prevY: lastPos.current.y,
        color
      });
    }

    lastPos.current = { x: currentX, y: currentY };
  };

  return (
    <div className={styles.boardContainer}>
      <div className={styles.controlHeader}>
        <h4>Co-Op Drawing Canvas</h4>
        <div className={styles.tools}>
          <input 
            type="color" 
            className={styles.colorPicker} 
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
          />
          <button className={styles.clearBtn} onClick={clearBoard}>Reset Canvas</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvasElement}
        width={500}
        height={220}
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
  );
};