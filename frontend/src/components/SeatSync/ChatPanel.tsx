import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatPanel.module.css';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

// NEW: This interface tells TypeScript to expect data from App.tsx!
interface ChatPanelProps {
  messages?: Message[];
  onSendMessage?: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages = [], onSendMessage }) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        <div className={styles.statusIndicator}></div>
        <h3>In-Flight Chat (Private Room)</h3>
      </div>

      <div className={styles.messageList}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>No messages yet. Say hi to your neighbor!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.includes('You');
            return (
              <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.meRow : styles.themRow}`}>
                <div className={styles.msgBubble}>
                  <div className={styles.senderTag}>{msg.sender}</div>
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
        <input
          type="text"
          className={styles.chatInput}
          placeholder="Type your encrypted response here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className={styles.sendButton}>Send</button>
      </form>
    </div>
  );
};