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

export interface ArtilleryMove {
  angle: number;
  power: number;
  nextObstacle: number;
}

export const useSeatSyncSocket = ( isMatched: boolean, mySeat: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasPartnerLeft, setHasPartnerLeft] = useState(false);
  
  // NEW: Dynamic Partner State (No more hardcoded 14B!)
  const [partnerSeat, setPartnerSeat] = useState<string | null>(null);
  
  // Game States
  const [incomingDrawPoint, setIncomingDrawPoint] = useState<DrawPoint | null>(null);
  const [gameGuesses, setGameGuesses] = useState<GameGuess[]>([]);
  const [activeTurnSeat, setActiveTurnSeat] = useState<string>(mySeat);
  const [incomingArtilleryMove, setIncomingArtilleryMove] = useState<ArtilleryMove | null>(null);
  const [incomingArtilleryPosition, setIncomingArtilleryPosition] = useState<{seat: string, x: number} | null>(null);
  const [partnerGameSession, setPartnerGameSession] = useState<{ game: 'draw' | 'artillery', action: 'start' | 'quit' } | null>(null);

  // Matchmaking Handshake States (Updated to include AI Score)
  const [matchRequestStatus, setMatchRequestStatus] = useState<'idle' | 'pending' | 'accepted' | 'declined'>('idle');
  const [incomingMatchRequest, setIncomingMatchRequest] = useState<{fromSeat: string, score?: number} | null>(null);

  const [incomingClear, setIncomingClear] = useState<number>(0);

  // 1. INITIAL REGISTRATION & HANDSHAKE LISTENER
  useEffect(() => {
    socket.emit('register_seat', mySeat);

    // Listen for incoming requests from the AI Waiting Pool
    socket.on('receive_match_request', (data: {fromSeat: string, score: number}) => setIncomingMatchRequest(data));
    
    socket.on('match_request_accepted', (data: {partnerSeat: string}) => {
      if (data && data.partnerSeat) setPartnerSeat(data.partnerSeat); // Save dynamic partner
      setMatchRequestStatus('accepted');
    });
    
    socket.on('match_request_declined', () => setMatchRequestStatus('declined'));
    socket.on('match_request_cancelled', () => setIncomingMatchRequest(null));

    return () => {
      socket.off('receive_match_request');
      socket.off('match_request_accepted');
      socket.off('match_request_declined');
      socket.off('match_request_cancelled');
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
      return;
    }

    setIsConnected(true);
    setHasPartnerLeft(false);
    
    socket.on('receive_message', (msg: ChatMessage) => setMessages(prev => [...prev, msg]));
    socket.on('receive_draw', (point: DrawPoint) => setIncomingDrawPoint(point));
    socket.on('receive_clear_board', () => setIncomingClear(prev => prev + 1));
    socket.on('receive_guess', (guess: GameGuess) => setGameGuesses(prev => [...prev, guess]));
    socket.on('receive_artillery_move', (move: ArtilleryMove) => setIncomingArtilleryMove(move));
    socket.on('receive_artillery_position', (pos: {seat: string, x: number}) => setIncomingArtilleryPosition(pos));
    socket.on('partner_game_update', (status) => setPartnerGameSession(status));
    socket.on('turn_update', (seat: string) => setActiveTurnSeat(seat));
    
    socket.on('partner_disconnected', () => {
      setHasPartnerLeft(true);
      setMatchRequestStatus('idle');
      setPartnerSeat(null); // Wipe partner memory

      setPartnerGameSession(null);
      setIncomingDrawPoint(null);
      setGameGuesses([]);
      setIncomingArtilleryMove(null);
      setIncomingArtilleryPosition(null);
    });
    
    return () => {
      socket.off('receive_message');
      socket.off('receive_draw');
      socket.off('receive_clear_board');
      socket.off('receive_guess');
      socket.off('receive_artillery_move');
      socket.off('receive_artillery_position');
      socket.off('partner_game_update');
      socket.off('turn_update');
      socket.off('partner_disconnected');
    };
  }, [isMatched]);

  const submitSurvey = useCallback((surveyAnswers: any) => {
    socket.emit('submit_survey', { seat: mySeat, survey: surveyAnswers });
  }, [mySeat]);

  const sendMatchRequest = useCallback(() => {
    setMatchRequestStatus('pending');
    setHasPartnerLeft(false);
    socket.emit('request_match', { seat: mySeat });
  }, [mySeat]);

  const respondToMatchRequest = useCallback((accept: boolean) => {
    if (!incomingMatchRequest) return;
    const toSeat = incomingMatchRequest.fromSeat;

    if (accept) {
      setHasPartnerLeft(false);
      setPartnerSeat(toSeat); // Lock in the dynamic partner!
      setMatchRequestStatus('accepted');
    } else {
      setMatchRequestStatus('declined');
    }
    
    socket.emit('respond_to_match', { accept, fromSeat: mySeat, toSeat });
    setIncomingMatchRequest(null);
  }, [mySeat, incomingMatchRequest]);

  const simulateIncomingRequest = useCallback(() => {
    setIncomingMatchRequest({ fromSeat: '15C', score: 88.5 }); // Updated test mock
  }, []);

  const cancelMatchRequest = useCallback(() => {
    setMatchRequestStatus('idle');
    socket.emit('cancel_match_request', { seat: mySeat });
  }, [mySeat]);

  // LIVE TRANSMISSION EMITTERS
  const sendMessage = useCallback((text: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      sender: `Seat ${mySeat}`, 
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    socket.emit('send_message', { message: newMessage });
  }, [mySeat]);

  const sendDrawStroke = useCallback((point: DrawPoint) => {
    socket.emit('draw_stroke', { point });
  }, []);

  const sendClearBoard = useCallback(() => {
    socket.emit('clear_board', {});
  }, []);

  const sendGameGuess = useCallback((text: string) => {
    const newGuess: GameGuess = {
      id: Math.random().toString(),
      sender: `Seat ${mySeat}`,
      text
    };
    setGameGuesses(prev => [...prev, newGuess]);
    socket.emit('send_guess', { guess: newGuess });
  }, [mySeat]);

  const sendArtilleryMove = useCallback((move: ArtilleryMove) => {
    socket.emit('send_artillery_move', { move });
  }, []);

  const sendArtilleryPosition = useCallback((position: {seat: string, x: number}) => {
    socket.emit('send_artillery_position', { position });
  }, []);

  const passTurn = useCallback(() => {
    if (partnerSeat) {
      socket.emit('switch_turn', { nextSeat: partnerSeat }); // Dynamic next turn!
    }
  }, [partnerSeat]);

  const sendGameSessionUpdate = useCallback((game: 'draw' | 'artillery', action: 'start' | 'quit') => {
    socket.emit('game_session_update', { game, action, seat: mySeat });
  }, [mySeat]);

  const simulatePartnerDisconnect = useCallback(() => {
    setHasPartnerLeft(true);
  }, []);

  const terminateConnection = useCallback(() => {
    // Elegant disconnect: Tells the server to break the match and auto-sweep the partner!
    socket.emit('terminate_match', { seat: mySeat });
    
    setMatchRequestStatus('idle');
    setIncomingMatchRequest(null);
    setMessages([]);
    setGameGuesses([]);
    setPartnerSeat(null); 

    setMessages([]);
    setGameGuesses([]);
    setPartnerGameSession(null);
    setIncomingDrawPoint(null);
    setIncomingArtilleryMove(null);
    setIncomingArtilleryPosition(null);
  }, [mySeat]);

  const resetGameState = useCallback(() => {
    setIncomingDrawPoint(null);
    setGameGuesses([]);
    setIncomingArtilleryMove(null);
    setIncomingArtilleryPosition(null);
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
    submitSurvey,   
    sendMatchRequest,         
    respondToMatchRequest,    
    simulateIncomingRequest,  
    simulatePartnerDisconnect,
    cancelMatchRequest,
    sendMessage,
    sendDrawStroke,
    sendGameGuess,
    sendArtilleryMove, 
    incomingArtilleryPosition,
    sendArtilleryPosition,
    passTurn,      
    sendGameSessionUpdate,
    terminateConnection,
    resetGameState, 
    incomingClear,
    sendClearBoard,
    partnerSeat // <--- NEW EXPORT!
  };
};