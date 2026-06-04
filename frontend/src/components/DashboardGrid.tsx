import React, { useEffect, useState } from 'react';
import styles from './DashboardGrid.module.css';

// 1. Define the exact shape of your JSON data
interface MediaItem {
  id: string;
  media_type: string;
  target_category: string;
  title: string;
  thumbnail_url: string;
  description: string;
  duration: string;
}

export const DashboardGrid: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 2. Fetch the mock data when the component loads
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // This looks in your public/data/ folder
        const response = await fetch('/data/content_database.json');
        const data = await response.json();
        setMediaItems(data);
      } catch (error) {
        console.error("Error loading media database:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  if (loading) {
    return <div className={styles.loadingState}>Loading In-Flight Entertainment...</div>;
  }

  return (
    <div className={styles.gridContainer}>
      <h2 className={styles.sectionTitle}>Curated For You</h2>
      
      {/* 3. Loop through the data and build a card for each item */}
      <div className={styles.mediaGrid}>
        {mediaItems.map((item) => (
          <div key={item.id} className={styles.mediaCard}>
            <div className={styles.imageWrapper}>
              <img src={item.thumbnail_url} alt={item.title} className={styles.thumbnail} />
              <span className={styles.mediaTypeBadge}>{item.media_type}</span>
              <span className={styles.durationBadge}>{item.duration}</span>
            </div>
            
            <div className={styles.cardContent}>
              <span className={styles.category}>{item.target_category}</span>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.description}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};