import React from 'react';
import styles from './RecommendationModal.module.css';

const DEFAULT_THUMBNAIL = 'https://via.placeholder.com/600x300/0a0e17/ffffff?text=Media';

// The exact data structure the AI backend will send us
export interface RecommendedItem {
  id: string;
  title: string;
  thumbnail_url: string;
  media_type: string;
}

export interface AiPayload {
  greeting: string;
  detected_vibe: string;
  items: RecommendedItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  payload: AiPayload | null;
}

export const RecommendationModal: React.FC<Props> = ({ isOpen, onClose, payload }) => {
  if (!isOpen || !payload) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        
        {/* Top Header Section with AI Greeting */}
        <div className={styles.modalHeader}>
          <div className={styles.aiBadge}>
            <span className={styles.pulseDot}></span>
            Recommendation Assistant
          </div>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.greetingSection}>
          <h2 className={styles.greetingText}>"{payload.greeting}"</h2>
          <p className={styles.vibeText}>Optimizing for: <span className={styles.highlight}>{payload.detected_vibe}</span></p>
        </div>

        {/* The 3 Recommended Items */}
        <div className={styles.recommendationGrid}>
          {payload.items.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              
              {/* NEW: Image Wrapper for the Hover Overlay */}
              <div className={styles.imageWrapper}>
                <img 
                  src={item.thumbnail_url || DEFAULT_THUMBNAIL} 
                  alt={item.title} 
                  className={styles.itemImage}
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_THUMBNAIL; }}
                />
                <div className={styles.playOverlay}>
                  <button className={styles.playButton}>▶ Play</button>
                </div>
              </div>

              <div className={styles.itemDetails}>
                <span className={styles.itemType}>{item.media_type}</span>
                <h4 className={styles.itemTitle}>{item.title}</h4>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};