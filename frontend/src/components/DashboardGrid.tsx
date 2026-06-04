import React, { useState } from 'react';
import styles from './DashboardGrid.module.css';

// 1. Define the Media Types
type MediaType = 'Movie' | 'Music' | 'TV Show' | 'Audiobook' | 'Documentary';

interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  matchScore: number;
  thumbnail: string;
}

// 2. The 50-Item Master Database
const MOCK_MEDIA: MediaItem[] = [
  // MOVIES
  { id: 'm1', title: 'Dune: Part Two', type: 'Movie', matchScore: 98, thumbnail: 'https://picsum.photos/seed/m1/400/300' },
  { id: 'm2', title: 'Oppenheimer', type: 'Movie', matchScore: 95, thumbnail: 'https://picsum.photos/seed/m2/400/300' },
  { id: 'm3', title: 'Spider-Man: Across the Spider-Verse', type: 'Movie', matchScore: 92, thumbnail: 'https://picsum.photos/seed/m3/400/300' },
  { id: 'm4', title: 'Everything Everywhere All at Once', type: 'Movie', matchScore: 89, thumbnail: 'https://picsum.photos/seed/m4/400/300' },
  { id: 'm5', title: 'John Wick: Chapter 4', type: 'Movie', matchScore: 88, thumbnail: 'https://picsum.photos/seed/m5/400/300' },
  { id: 'm6', title: 'Top Gun: Maverick', type: 'Movie', matchScore: 85, thumbnail: 'https://picsum.photos/seed/m6/400/300' },
  { id: 'm7', title: 'The Batman', type: 'Movie', matchScore: 82, thumbnail: 'https://picsum.photos/seed/m7/400/300' },
  { id: 'm8', title: 'Knives Out', type: 'Movie', matchScore: 79, thumbnail: 'https://picsum.photos/seed/m8/400/300' },
  { id: 'm9', title: 'Parasite', type: 'Movie', matchScore: 78, thumbnail: 'https://picsum.photos/seed/m9/400/300' },
  { id: 'm10', title: 'Mad Max: Fury Road', type: 'Movie', matchScore: 75, thumbnail: 'https://picsum.photos/seed/m10/400/300' },

  // TV SHOWS
  { id: 'tv1', title: 'Succession', type: 'TV Show', matchScore: 97, thumbnail: 'https://picsum.photos/seed/tv1/400/300' },
  { id: 'tv2', title: 'The Bear', type: 'TV Show', matchScore: 94, thumbnail: 'https://picsum.photos/seed/tv2/400/300' },
  { id: 'tv3', title: 'Severance', type: 'TV Show', matchScore: 91, thumbnail: 'https://picsum.photos/seed/tv3/400/300' },
  { id: 'tv4', title: 'The Last of Us', type: 'TV Show', matchScore: 88, thumbnail: 'https://picsum.photos/seed/tv4/400/300' },
  { id: 'tv5', title: 'Stranger Things', type: 'TV Show', matchScore: 86, thumbnail: 'https://picsum.photos/seed/tv5/400/300' },
  { id: 'tv6', title: 'Better Call Saul', type: 'TV Show', matchScore: 84, thumbnail: 'https://picsum.photos/seed/tv6/400/300' },
  { id: 'tv7', title: 'House of the Dragon', type: 'TV Show', matchScore: 81, thumbnail: 'https://picsum.photos/seed/tv7/400/300' },
  { id: 'tv8', title: 'Ted Lasso', type: 'TV Show', matchScore: 79, thumbnail: 'https://picsum.photos/seed/tv8/400/300' },
  { id: 'tv9', title: 'The White Lotus', type: 'TV Show', matchScore: 77, thumbnail: 'https://picsum.photos/seed/tv9/400/300' },
  { id: 'tv10', title: 'Peaky Blinders', type: 'TV Show', matchScore: 73, thumbnail: 'https://picsum.photos/seed/tv10/400/300' },

  // MUSIC
  { id: 'mu1', title: 'Midnight Lo-Fi Beats', type: 'Music', matchScore: 96, thumbnail: 'https://picsum.photos/seed/mu1/400/300' },
  { id: 'mu2', title: 'Acoustic Chill', type: 'Music', matchScore: 93, thumbnail: 'https://picsum.photos/seed/mu2/400/300' },
  { id: 'mu3', title: 'Top 50 Pop Hits', type: 'Music', matchScore: 90, thumbnail: 'https://picsum.photos/seed/mu3/400/300' },
  { id: 'mu4', title: 'Synthwave 2084', type: 'Music', matchScore: 87, thumbnail: 'https://picsum.photos/seed/mu4/400/300' },
  { id: 'mu5', title: 'Classical Focus', type: 'Music', matchScore: 85, thumbnail: 'https://picsum.photos/seed/mu5/400/300' },
  { id: 'mu6', title: '90s Hip Hop Classics', type: 'Music', matchScore: 83, thumbnail: 'https://picsum.photos/seed/mu6/400/300' },
  { id: 'mu7', title: 'Jazz Evening', type: 'Music', matchScore: 80, thumbnail: 'https://picsum.photos/seed/mu7/400/300' },
  { id: 'mu8', title: 'Workout EDM Mix', type: 'Music', matchScore: 78, thumbnail: 'https://picsum.photos/seed/mu8/400/300' },
  { id: 'mu9', title: 'Indie Folk Journey', type: 'Music', matchScore: 76, thumbnail: 'https://picsum.photos/seed/mu9/400/300' },
  { id: 'mu10', title: 'Heavy Metal Anthems', type: 'Music', matchScore: 72, thumbnail: 'https://picsum.photos/seed/mu10/400/300' },

  // AUDIOBOOKS
  { id: 'a1', title: 'Atomic Habits', type: 'Audiobook', matchScore: 95, thumbnail: 'https://picsum.photos/seed/a1/400/300' },
  { id: 'a2', title: 'Project Hail Mary', type: 'Audiobook', matchScore: 92, thumbnail: 'https://picsum.photos/seed/a2/400/300' },
  { id: 'a3', title: 'The Psychology of Money', type: 'Audiobook', matchScore: 89, thumbnail: 'https://picsum.photos/seed/a3/400/300' },
  { id: 'a4', title: 'Dune (Unabridged)', type: 'Audiobook', matchScore: 86, thumbnail: 'https://picsum.photos/seed/a4/400/300' },
  { id: 'a5', title: 'Steve Jobs Biography', type: 'Audiobook', matchScore: 84, thumbnail: 'https://picsum.photos/seed/a5/400/300' },
  { id: 'a6', title: 'Sapiens: A Brief History', type: 'Audiobook', matchScore: 82, thumbnail: 'https://picsum.photos/seed/a6/400/300' },
  { id: 'a7', title: 'The Subtle Art of Not Giving a F*ck', type: 'Audiobook', matchScore: 79, thumbnail: 'https://picsum.photos/seed/a7/400/300' },
  { id: 'a8', title: 'Thinking, Fast and Slow', type: 'Audiobook', matchScore: 77, thumbnail: 'https://picsum.photos/seed/a8/400/300' },
  { id: 'a9', title: '1984 by George Orwell', type: 'Audiobook', matchScore: 75, thumbnail: 'https://picsum.photos/seed/a9/400/300' },
  { id: 'a10', title: 'The Hobbit', type: 'Audiobook', matchScore: 71, thumbnail: 'https://picsum.photos/seed/a10/400/300' },

  // DOCUMENTARIES
  { id: 'd1', title: 'Planet Earth III', type: 'Documentary', matchScore: 98, thumbnail: 'https://picsum.photos/seed/d1/400/300' },
  { id: 'd2', title: 'Free Solo', type: 'Documentary', matchScore: 94, thumbnail: 'https://picsum.photos/seed/d2/400/300' },
  { id: 'd3', title: 'The Last Dance', type: 'Documentary', matchScore: 91, thumbnail: 'https://picsum.photos/seed/d3/400/300' },
  { id: 'd4', title: 'My Octopus Teacher', type: 'Documentary', matchScore: 88, thumbnail: 'https://picsum.photos/seed/d4/400/300' },
  { id: 'd5', title: '14 Peaks: Nothing Is Impossible', type: 'Documentary', matchScore: 85, thumbnail: 'https://picsum.photos/seed/d5/400/300' },
  { id: 'd6', title: 'The Social Dilemma', type: 'Documentary', matchScore: 83, thumbnail: 'https://picsum.photos/seed/d6/400/300' },
  { id: 'd7', title: 'Cosmos: A Spacetime Odyssey', type: 'Documentary', matchScore: 81, thumbnail: 'https://picsum.photos/seed/d7/400/300' },
  { id: 'd8', title: 'F1: Drive to Survive', type: 'Documentary', matchScore: 78, thumbnail: 'https://picsum.photos/seed/d8/400/300' },
  { id: 'd9', title: 'Making a Murderer', type: 'Documentary', matchScore: 76, thumbnail: 'https://picsum.photos/seed/d9/400/300' },
  { id: 'd10', title: 'Apollo 11', type: 'Documentary', matchScore: 72, thumbnail: 'https://picsum.photos/seed/d10/400/300' }
];

const FILTERS = ['All', 'Movie', 'TV Show', 'Music', 'Audiobook', 'Documentary'];

export const DashboardGrid: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter the massive array based on the selected pill
  const filteredMedia = MOCK_MEDIA.filter(item => 
    activeFilter === 'All' || item.type === activeFilter
  );

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h2>Curated For You</h2>
        
        {/* NEW: Dynamic Category Filtering Navigation */}
        <div className={styles.filterBar}>
          {FILTERS.map(filter => (
            <button 
              key={filter} 
              className={`${styles.filterPill} ${activeFilter === filter ? styles.activePill : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {filteredMedia.map(item => (
          <div key={item.id} className={styles.mediaCard}>
            
            <div className={styles.thumbnailWrapper}>
              <img src={item.thumbnail} alt={item.title} className={styles.thumbnail} />
              
              {/* NEW: The Glassmorphism Play Overlay */}
              <div className={styles.playOverlay}>
                <button className={styles.playButton}>▶ Play Now</button>
              </div>
            </div>

            <div className={styles.cardInfo}>
              <h4 className={styles.title}>{item.title}</h4>
              <p className={styles.type}>{item.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};