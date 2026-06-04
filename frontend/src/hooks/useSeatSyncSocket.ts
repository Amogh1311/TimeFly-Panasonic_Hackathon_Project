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
  const [incomingDrawPoint] = useState<DrawPoint | null>(null);
  
  // NEW: Track if the partner dropped the connection
  const [hasPartnerLeft, setHasPartnerLeft] = useState(false);

  const partnerSeat = mySeat === '12A' ? '14B' : '12A';

  useEffect(() => {
    if (!isMatched) {
      setIsConnected(false);
      setMessages([]);
      setHasPartnerLeft(false); // Reset this when you start a new search
      return;
    }

    setIsConnected(true);
    setHasPartnerLeft(false);
    
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
    // socket.emit('send_message', { room: roomName, message: newMessage });
  }, [mySeat, roomName]);

  const sendDrawStroke = useCallback((point: DrawPoint) => {
    // socket.emit('draw_stroke', { room: roomName, point });
  }, [roomName]);

  // DEV TOOL: Simulates receiving a "Disconnect" signal from the backend
  const simulatePartnerDisconnect = useCallback(() => {
    setHasPartnerLeft(true);
  }, []);

  // [BACKEND NOTE]: Prathamesh will uncomment this listener
  // useEffect(() => {
  //   socket.on('partner_disconnected', () => setHasPartnerLeft(true));
  //   return () => socket.off('partner_disconnected');
  // }, []);

  return {
    isConnected,
    messages,
    incomingDrawPoint,
    hasPartnerLeft,             // Export the state
    simulatePartnerDisconnect,  // Export the dev tool
    sendMessage,
    sendDrawStroke
  };
};