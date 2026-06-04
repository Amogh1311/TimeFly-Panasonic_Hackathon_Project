import { useEffect, useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface DrawPoint {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
}

export const useSeatSyncSocket = (roomName: string, isMatched: boolean, mySeat: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // FIX 1: Removed 'setIncomingDrawPoint' from the array since we aren't using it until the backend is ready
  const [incomingDrawPoint] = useState<DrawPoint | null>(null);

  const partnerSeat = mySeat === '12A' ? '14B' : '12A';

  useEffect(() => {
    if (!isMatched) {
      setIsConnected(false);
      setMessages([]);
      return;
    }

    setIsConnected(true);
    
    const welcomeTimeout = setTimeout(() => {
      const systemMsg: ChatMessage = {
        id: 'sys-1',
        sender: `Seat ${partnerSeat}`, 
        text: `Hey there! Glad we matched. Super cool that we are both flying out today!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, systemMsg]);
    }, 2000);

    return () => clearTimeout(welcomeTimeout);
  }, [isMatched, roomName, partnerSeat]);

  const sendMessage = useCallback((text: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      sender: `You (${mySeat})`,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // [BACKEND NOTE]: Prathamesh will uncomment this
    // socket.emit('send_message', { room: roomName, message: newMessage });
  }, [mySeat, roomName]);

  const sendDrawStroke = useCallback((point: DrawPoint) => {
    // FIX 2: Added a console log to "use" the point variable and prove it tracks your mouse
    console.debug(`[Socket Hook] Broadcasting stroke for ${roomName}:`, point);
    
    // [BACKEND NOTE]: Prathamesh will uncomment this
    // socket.emit('draw_stroke', { room: roomName, point });
  }, [roomName]);

  return {
    isConnected,
    messages,
    incomingDrawPoint,
    sendMessage,
    sendDrawStroke
  };
};