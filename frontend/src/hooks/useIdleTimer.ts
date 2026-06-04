import { useEffect, useRef, useState } from 'react';

interface UseIdleTimerProps {
  timeoutMs: number;
  onIdle: () => void;
}

export const useIdleTimer = ({ timeoutMs, onIdle }: UseIdleTimerProps) => {
  const [isIdle, setIsIdle] = useState(false);
  
  // FIXED: Tells TypeScript to expect a standard browser timer instead of a Node timer
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    setIsIdle(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle(); 
    }, timeoutMs);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [timeoutMs, onIdle]);

  return isIdle;
};