import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// Connect to the Python server running on your localhost port 8000
const socket = io('http://localhost:8000');

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
  const [incomingDrawPoint, setIncomingDrawPoint] = useState<DrawPoint | null>(null);
  const [gameGuesses, setGameGuesses] = useState<GameGuess[]>([]);
  const [activeTurnSeat, setActiveTurnSeat] = useState<string>(mySeat);
  const [incomingArtilleryMove, setIncomingArtilleryMove] = useState<ArtilleryMove | null>(null);
  const [partnerGameSession, setPartnerGameSession] = useState<{ game: 'draw' | 'artillery', action: 'start' | 'quit' } | null>(null);

  // Matchmaking Handshake States
  const [matchRequestStatus, setMatchRequestStatus] = useState<'idle' | 'pending' | 'accepted' | 'declined'>('idle');
  const [incomingMatchRequest, setIncomingMatchRequest] = useState<{fromSeat: string} | null>(null);

  const partnerSeat = mySeat === '12A' ? '14B' : '12A';

  // 1. INITIAL REGISTRATION & HANDSHAKE LISTENER
  useEffect(() => {
    // Tell the backend exactly which seat we are sitting in the second the app opens
    socket.emit('register_seat', mySeat);

    // Listen for incoming requests from the backend
    socket.on('receive_match_request', (data) => setIncomingMatchRequest(data));
    socket.on('match_request_accepted', () => setMatchRequestStatus('accepted'));
    socket.on('match_request_declined', () => setMatchRequestStatus('declined'));

    return () => {
      socket.off('receive_match_request');
      socket.off('match_request_accepted');
      socket.off('match_request_declined');
    };
  }, [mySeat]);

  // 2. LIVE REAL-TIME DATA SYNC
  useEffect(() => {
    if (!isMatched) {
      setIsConnected(false);
      setMessages([]);
      setGameGuesses([]);
      setHasPartnerLeft(false);
      setIncomingArtilleryMove(null);
      setPartnerGameSession(null);
      setMatchRequestStatus('idle'); 
      return;
    }

    setIsConnected(true);
    setHasPartnerLeft(false);
    
    // ACTIVE REAL-TIME LISTENERS FROM PRATHAMESH'S BACKEND
    socket.on('receive_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('receive_draw', (point: DrawPoint) => {
      setIncomingDrawPoint(point);
    });

    socket.on('receive_guess', (guess: GameGuess) => {
      setGameGuesses(prev => [...prev, guess]);
    });
    
    socket.on('receive_artillery_move', (move: ArtilleryMove) => {
      setIncomingArtilleryMove(move);
    });

    socket.on('partner_game_update', (status) => {
      setPartnerGameSession(status);
    });

    socket.on('turn_update', (seat: string) => {
      setActiveTurnSeat(seat);
    });

    socket.on('partner_disconnected', () => {
      setHasPartnerLeft(true);
    });
    
    return () => {
      socket.off('receive_message');
      socket.off('receive_draw');
      socket.off('receive_guess');
      socket.off('receive_artillery_move');
      socket.off('partner_game_update');
      socket.off('turn_update');
      socket.off('partner_disconnected');
    };
  }, [isMatched]);

  // Sending the request to find a match
  const sendMatchRequest = useCallback((surveyAnswers: any) => {
    setMatchRequestStatus('pending');
    socket.emit('request_match', { seat: mySeat, survey: surveyAnswers });
  }, [mySeat]);

  // Responding to someone else's request
  const respondToMatchRequest = useCallback((accept: boolean) => {
    setIncomingMatchRequest(null);
    socket.emit('respond_to_match', { accept, fromSeat: mySeat, toSeat: partnerSeat });
  }, [mySeat, partnerSeat]);

  // DEV TOOL: Trigger the incoming modal locally
  const simulateIncomingRequest = useCallback(() => {
    setIncomingMatchRequest({ fromSeat: partnerSeat });
  }, [partnerSeat]);

  // LIVE TRANSMISSION EMITTERS
  const sendMessage = useCallback((text: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      sender: `Seat ${mySeat}`, // Cleaned up for presentation view
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    socket.emit('send_message', { room: roomName, message: newMessage });
  }, [mySeat, roomName]);

  const sendDrawStroke = useCallback((point: DrawPoint) => {
    socket.emit('draw_stroke', { room: roomName, point });
  }, [roomName]);

  const sendGameGuess = useCallback((text: string) => {
    const newGuess: GameGuess = {
      id: Math.random().toString(),
      sender: `Seat ${mySeat}`,
      text
    };
    setGameGuesses(prev => [...prev, newGuess]);
    socket.emit('send_guess', { room: roomName, guess: newGuess });
  }, [roomName, mySeat]);

  const sendArtilleryMove = useCallback((move: ArtilleryMove) => {
    socket.emit('send_artillery_move', { room: roomName, move });
  }, [roomName]);

  // Pass the turn to the other player
  const passTurn = useCallback(() => {
    const nextSeat = mySeat === '12A' ? '14B' : '12A';
    socket.emit('switch_turn', { nextSeat });
  }, [mySeat]);

  const sendGameSessionUpdate = useCallback((game: 'draw' | 'artillery', action: 'start' | 'quit') => {
    socket.emit('game_session_update', { room: roomName, game, action, seat: mySeat });
  }, [roomName, mySeat]);

  const simulatePartnerDisconnect = useCallback(() => {
    setHasPartnerLeft(true);
  }, []);

  const terminateConnection = useCallback(() => {
    socket.disconnect(); // Triggers the backend partner_disconnected event!
    
    // Clear out the session data
    setMatchRequestStatus('idle');
    setIncomingMatchRequest(null);
    setMessages([]);
    setGameGuesses([]);
    
    // Reconnect half a second later so they aren't permanently offline
    setTimeout(() => {
      socket.connect();
      socket.emit('register_seat', mySeat);
    }, 500);
  }, [mySeat]);

  // NEW: Wipes the game memory when a new game starts
  const resetGameState = useCallback(() => {
    setIncomingDrawPoint(null);
    setGameGuesses([]);
    setIncomingArtilleryMove(null);
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
    matchRequestStatus,       
    incomingMatchRequest,     
    sendMatchRequest,         
    respondToMatchRequest,    
    simulateIncomingRequest,  
    simulatePartnerDisconnect,
    sendMessage,
    sendDrawStroke,
    sendGameGuess,
    sendArtilleryMove, 
    passTurn,      
    sendGameSessionUpdate,
    terminateConnection,
    resetGameState // <--- Exported here!
  };
};