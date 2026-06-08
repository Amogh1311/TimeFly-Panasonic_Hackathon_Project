import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatPanel.module.css';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface ChatPanelProps {
  messages?: Message[];
  onSendMessage?: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages = [], onSendMessage }) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // NEW: Grab the current seat from the URL so we know which messages belong to us!
  const currentSeat = new URLSearchParams(window.location.search).get('seat') || '12A';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (onSendMessage) onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.statusIndicator}>
          <div className={styles.ping}></div>
        </div>
        <div>
          <h3>Chat with the Buddy</h3>
          <p className={styles.subStatus}>Your chats will only be visible to your buddy and will be be lost if connection gets terminated</p>
        </div>
      </div>

      <div className={styles.messageList}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <p>Connection established.<br/>Say hi to your Buddy!</p>
          </div>
        ) : (
          messages.map((msg) => {
            // FIXED: Now it dynamically checks if the sender matches YOUR current seat
            const isMe = msg.sender.includes('You') || msg.sender.includes(currentSeat);
            
            return (
              <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.meRow : styles.themRow}`}>
                <div className={styles.msgBubble}>
                  <div className={styles.senderTag}>{isMe ? 'You' : msg.sender}</div>
                  <p className={styles.msgText}>{msg.text}</p>
                  <span className={styles.timestamp}>{msg.timestamp}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.chatInput}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className={styles.sendButton} disabled={!input.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};