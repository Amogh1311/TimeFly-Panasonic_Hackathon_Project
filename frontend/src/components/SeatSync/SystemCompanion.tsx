import React from 'react';

interface Props {
  isMatched: boolean;
  partnerSeat: string;
}

export const SystemCompanion: React.FC<Props> = ({ isMatched, partnerSeat }) => {
  return (
    <div style={{
        background: 'rgba(15, 20, 35, 0.6)',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        borderRadius: '20px',
        padding: '2.5rem',
        color: 'white',
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)',
        overflowY: 'auto' 
    }}>
      {!isMatched ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
          <div>
            <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem', fontSize: '1.6rem', letterSpacing: '0.5px' }}>
              Travel Buddy Matchmaking
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1.05rem', margin: 0 }}>
              Welcome to the TimeFly interactive network. Long flights don't have to be isolating. Our smart 
              matchmaking engine evaluates the passenger cabin to find your perfect co-pilot based on shared interests and travel vibes.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              How to Connect:
            </h4>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>
                <strong style={{ color: 'var(--accent-cyan)' }}>1. Initialize:</strong> Fill out the survey to set your mood.
              </li>
              <li>
                <strong style={{ color: 'var(--accent-cyan)' }}>2. Enter Pool:</strong> Let the AI find your highest compatibility score.
              </li>
              <li>
                <strong style={{ color: 'var(--accent-cyan)' }}>3. Link Up:</strong> Accept a request to establish a secure P2P network.
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              Unlock Co-Op Features:
            </h4>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li>
                <span style={{ fontSize: '1.1rem', marginRight: '0.4rem' }}>💬</span>
                <strong style={{ color: 'white' }}>Live Chat:</strong> Secure, real-time messaging across the aisle.
              </li>
              <li>
                <span style={{ fontSize: '1.1rem', marginRight: '0.4rem' }}>🎮</span>
                <strong style={{ color: 'white' }}>Interactive Games:</strong>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.4rem', listStyleType: 'circle', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  <li style={{ marginBottom: '0.3rem' }}><strong style={{ color: '#ccc' }}>Canvas Guessing:</strong> Take turns sketching prompts and guessing words.</li>
                  <li><strong style={{ color: '#ccc' }}>Neon Artillery:</strong> Compete in tactical, turn-based grid battles.</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* NEW: Vision & Guidelines Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ color: 'white', marginBottom: '0.8rem', fontSize: '1.05rem' }}>
              Our Vision & Flight Rules
            </h4>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>The IFE Mission:</strong> We built TimeFly to revolutionize In-Flight Entertainment. We want to break the monotony of long-haul travel by transforming passive screen-staring into highly engaging, shared human experiences. 
            </p>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.95rem' }}>
              <li><strong style={{ color: '#ccc' }}>Be Courteous:</strong> All live chats must remain polite, respectful, and family-friendly.</li>
              <li><strong style={{ color: '#ccc' }}>Play Fair:</strong> Good sportsmanship is required for all games and activities.</li>
              <li><strong style={{ color: '#ccc' }}>Privacy First:</strong> You have full control. You can terminate the connection at any time to return to solo media mode.</li>
            </ul>
          </div>

        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
          <div>
            <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem', fontSize: '1.6rem', letterSpacing: '0.5px' }}>
              Active Comms Link Established
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1.05rem', margin: 0 }}>
              Connection secured. You are currently synced with <strong style={{ color: 'white', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>Seat {partnerSeat}</strong>. 
              Your local network is ready for collaboration. Select an activity below to begin sharing your journey.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              Available Network Modules:
            </h4>
            <ul style={{ paddingLeft: '0', margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <li style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', borderLeft: '3px solid #ff007f' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>💬</span>
                  <strong style={{ color: 'white', fontSize: '1.05rem' }}>Live Secure Chat</strong>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Instantly exchange messages across the aisle. Perfect for coordinating game strategies, discussing the flight, or simply saying hello.
                </p>
              </li>
              
              <li style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', borderLeft: '3px solid var(--accent-cyan)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🖌️</span>
                  <strong style={{ color: 'white', fontSize: '1.05rem' }}>Canvas Guessing</strong>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Load up the synchronized digital drawing board. Take turns sketching visual prompts while your partner tries to guess the word in real-time.
                </p>
              </li>

              <li style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', borderLeft: '3px solid #00ff88' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🎯</span>
                  <strong style={{ color: 'white', fontSize: '1.05rem' }}>Neon Artillery</strong>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Engage in a tactical, turn-based grid battle. Guess the coordinates of your partner's defenses and launch digital strikes to claim victory.
                </p>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};