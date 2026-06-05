import React, { useState, useEffect } from 'react';
import styles from './DashboardGrid.module.css';

// We redefine the interface here so we don't have to worry about import paths
export interface FlightTelemetry {
  weather: string;
  flightPhase: string;
  passengerProfile: string;
  passengerAge: string;
}

interface DashboardGridProps {
  telemetry?: FlightTelemetry;
}

type MediaType = 'Movie' | 'Music' | 'TV Show' | 'Audiobook' | 'Documentary';

interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  matchScore: number;
  thumbnail: string;
}

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

export const DashboardGrid: React.FC<DashboardGridProps> = ({ telemetry }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  
  // NEW: State for adaptive ML fetching
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [adaptiveMedia, setAdaptiveMedia] = useState<MediaItem[]>(MOCK_MEDIA);

  // NEW: Listen to Telemetry Changes!
  useEffect(() => {
    if (!telemetry) return;

    // Show the loading state
    setIsRecalculating(true);

    // [BACKEND NOTE]: Tomorrow, replace this setTimeout with your fetch() to FastAPI!
    // Example: fetch('/api/recommend', { method: 'POST', body: JSON.stringify(telemetry) })
    const mockNetworkCall = setTimeout(() => {
      
      // For now, we mock the AI by shuffling the array to simulate a newly curated list
      const mockReorderedMedia = [...MOCK_MEDIA].sort(() => 0.5 - Math.random());
      
      setAdaptiveMedia(mockReorderedMedia);
      setIsRecalculating(false);
      
    }, 800); // 800ms gives just enough time to see the cool loading animation

    return () => clearTimeout(mockNetworkCall);
  }, [telemetry]); // <-- This array ensures it runs every time telemetry changes

  // Filter the dynamically adaptive array based on the selected pill
  const filteredMedia = adaptiveMedia.filter(item => 
    activeFilter === 'All' || item.type === activeFilter
  );

  return (
    <div className={styles.dashboardContainer} style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2>Curated For You</h2>
          {/* Subtle live indicator showing the active AI context */}
          {telemetry && (
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', background: 'rgba(0, 210, 255, 0.1)', padding: '0.3rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
              Best Content suited for: {telemetry.flightPhase} / {telemetry.weather}
            </span>
          )}
        </div>
        
        <div className={styles.filterBar}>
          {FILTERS.map(filter => (
            <button 
              key={filter} 
              className={`${styles.filterPill} ${activeFilter === filter ? styles.activePill : ''}`}
              onClick={() => setActiveFilter(filter)}
              disabled={isRecalculating} // Prevent clicking while AI is "thinking"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* NEW: Buttery smooth AI Recalculating Overlay */}
      {isRecalculating ? (
        <div style={{ 
          flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          animation: 'fadeIn 0.3s ease-out' 
        }}>
          <div style={{
            width: '60px', height: '60px', border: '4px solid rgba(0, 210, 255, 0.1)', 
            borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', 
            animation: 'spin 1s linear infinite', marginBottom: '1.5rem'
          }} />
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>AI Processing...</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Adapting media to {telemetry?.weather} conditions.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredMedia.map(item => (
            <div key={item.id} className={styles.mediaCard} style={{ animation: 'fadeIn 0.5s ease-out' }}>
              
              <div className={styles.thumbnailWrapper}>
                <img src={item.thumbnail} alt={item.title} className={styles.thumbnail} />
                
                <div className={styles.playOverlay}>
                  <button className={styles.playButton}>▶ Play Now</button>
                </div>
              </div>

              <div className={styles.cardInfo}>
                <h4 className={styles.title}>{item.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className={styles.type}>{item.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Fallback keyframes just in case your CSS doesn't have it globally */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};