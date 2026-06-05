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

export interface GameGuess {
  id: string;
  sender: string;
  text: string;
}

// Interface for Artillery Physics Data
export interface ArtilleryMove {
  angle: number;
  power: number;
  nextObstacle: number;
}

export const useSeatSyncSocket = (roomName: string, isMatched: boolean, mySeat: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasPartnerLeft, setHasPartnerLeft] = useState(false);
  
  // Game States
  const [incomingDrawPoint] = useState<DrawPoint | null>(null);
  const [gameGuesses, setGameGuesses] = useState<GameGuess[]>([]);
  const [activeTurnSeat, setActiveTurnSeat] = useState<string>(mySeat);
  const [incomingArtilleryMove, setIncomingArtilleryMove] = useState<ArtilleryMove | null>(null);
  const [partnerGameSession, setPartnerGameSession] = useState<{ game: 'draw' | 'artillery', action: 'start' | 'quit' } | null>(null);

  // NEW: Matchmaking Handshake States
  const [matchRequestStatus, setMatchRequestStatus] = useState<'idle' | 'pending' | 'accepted' | 'declined'>('idle');
  const [incomingMatchRequest, setIncomingMatchRequest] = useState<{fromSeat: string} | null>(null);

  const partnerSeat = mySeat === '12A' ? '14B' : '12A';

  useEffect(() => {
    if (!isMatched) {
      setIsConnected(false);
      setMessages([]);
      setGameGuesses([]);
      setHasPartnerLeft(false);
      setIncomingArtilleryMove(null);
      setPartnerGameSession(null);
      setMatchRequestStatus('idle'); // Reset match status on disconnect
      return;
    }

    setIsConnected(true);
    setHasPartnerLeft(false);
    
    // MOCK: Simulate the welcome message
    const welcomeTimeout = setTimeout(() => {
      const systemMsg: ChatMessage = {
        id: 'sys-1',
        sender: `Seat ${partnerSeat}`, 
        text: `Hey there! Glad we matched. Super cool that we are both flying out today!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, systemMsg]);
    }, 2000);

    // MOCK: Simulate the partner guessing the drawing
    const guessTimeout = setTimeout(() => {
      const mockGuess: GameGuess = {
        id: 'guess-1',
        sender: `Seat ${partnerSeat}`,
        text: 'Is it an airplane?? ✈️'
      };
      setGameGuesses(prev => [...prev, mockGuess]);
    }, 6000);

    /* ========================================================
       [TOMORROW'S BACKEND INTEGRATION BLOCK]
       Delete the timeouts above, and uncomment this section!
       ========================================================
       
       socket.on('receive_match_request', (data) => setIncomingMatchRequest(data));
       socket.on('match_request_accepted', () => setMatchRequestStatus('accepted'));
       socket.on('match_request_declined', () => setMatchRequestStatus('declined'));
       
       socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
       socket.on('receive_draw', (point) => setIncomingDrawPoint(point));
       socket.on('receive_guess', (guess) => setGameGuesses(prev => [...prev, guess]));
       
       socket.on('receive_artillery_move', (move) => setIncomingArtilleryMove(move));
       socket.on('partner_game_update', (status) => setPartnerGameSession(status));
       socket.on('turn_update', (seat) => setActiveTurnSeat(seat));
       socket.on('partner_disconnected', () => setHasPartnerLeft(true));
       
    ========================================================= */

    return () => {
      clearTimeout(welcomeTimeout);
      clearTimeout(guessTimeout);
      // socket.off(...) listeners go here tomorrow
    };
  }, [isMatched, roomName, partnerSeat]);

  // NEW: Sending the request to find a match
  const sendMatchRequest = useCallback((surveyAnswers: any) => {
    setMatchRequestStatus('pending');
    
    // MOCK: Simulate waiting 3.5 seconds, then the partner clicks "Accept"
    setTimeout(() => {
      setMatchRequestStatus('accepted');
    }, 3500);

    // [BACKEND NOTE]: socket.emit('request_match', { seat: mySeat, survey: surveyAnswers });
  }, []);

  // NEW: Responding to someone else's request
  const respondToMatchRequest = useCallback((accept: boolean) => {
    setIncomingMatchRequest(null);
    // [BACKEND NOTE]: socket.emit('respond_to_match', { accept, fromSeat: mySeat, toSeat: partnerSeat });
  }, [mySeat, partnerSeat]);

  // DEV TOOL: Trigger the incoming modal locally
  const simulateIncomingRequest = useCallback(() => {
    setIncomingMatchRequest({ fromSeat: partnerSeat });
  }, [partnerSeat]);

  const sendMessage = useCallback((text: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      sender: `You (${mySeat})`,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    // [BACKEND NOTE]: socket.emit('send_message', { room: roomName, message: newMessage });
  }, [mySeat, roomName]);

  const sendDrawStroke = useCallback((point: DrawPoint) => {
    // [BACKEND NOTE]: socket.emit('draw_stroke', { room: roomName, point });
  }, [roomName]);

  const sendGameGuess = useCallback((text: string) => {
    const newGuess: GameGuess = {
      id: Math.random().toString(),
      sender: `You`,
      text
    };
    setGameGuesses(prev => [...prev, newGuess]);
    // [BACKEND NOTE]: socket.emit('send_guess', { room: roomName, guess: newGuess });
  }, [roomName]);

  const sendArtilleryMove = useCallback((move: ArtilleryMove) => {
    // [BACKEND NOTE]: socket.emit('send_artillery_move', { room: roomName, move });
  }, [roomName]);

  const sendGameSessionUpdate = useCallback((game: 'draw' | 'artillery', action: 'start' | 'quit') => {
    // [BACKEND NOTE]: socket.emit('game_session_update', { room: roomName, game, action, seat: mySeat });
  }, [roomName, mySeat]);

  const simulatePartnerDisconnect = useCallback(() => {
    setHasPartnerLeft(true);
  }, []);

  return {
    isConnected,
    messages,
    hasPartnerLeft,
    incomingDrawPoint,
    gameGuesses,
    incomingArtilleryMove,  
    partnerGameSession,     
    activeTurnSeat,         
    matchRequestStatus,       // NEW
    incomingMatchRequest,     // NEW
    sendMatchRequest,         // NEW
    respondToMatchRequest,    // NEW
    simulateIncomingRequest,  // NEW
    simulatePartnerDisconnect,
    sendMessage,
    sendDrawStroke,
    sendGameGuess,
    sendArtilleryMove,      
    sendGameSessionUpdate   
  };
};