import React, { useState } from 'react';
import styles from './MatchSurvey.module.css';

interface SurveyAnswers { [key: string]: string; }

interface Props {
  onMatchReady: () => void;
  onEditStart: () => void;
  onDisconnect: () => void;
  hasPartnerLeft: boolean;          // NEW PROP
  onAcknowledgeDisconnect: () => void; // NEW PROP
}

const QUESTIONS = [
  { id: 'q1', label: '1. Primary reason for travel?', options: ['Business / Corporate', 'Leisure / Vacation', 'Visiting Family & Friends', 'Event / Concert / Sports', 'Academic / Research', 'Relocation', 'Tourism / Backpacking', 'Other'] },
  { id: 'q2', label: '2. Favorite media genre?', options: ['Action & Sci-Fi', 'Comedy & Sitcoms', 'Documentaries & Nature', 'Horror & Thriller', 'Romance & Drama', 'Anime & Animation', 'K-Drama', 'Music & Concerts', 'True Crime'] },
  { id: 'q3', label: '3. Ideal flight vibe?', options: ['Talkative & Social', 'Quiet & Relaxed', 'Gamer / Interactive', 'Collaborator / Networking', 'Movie-Binger', 'Bookworm', 'Sleeper'] },
  { id: 'q4', label: '4. Beverage of choice?', options: ['Black Coffee', 'Latte / Cappuccino', 'Green / Herbal Tea', 'Water (Stay Hydrated)', 'Cola / Soda', 'Fruit Juice', 'Beer / Wine', 'Cocktails / Spirits', 'Sparkling Water'] },
  { id: 'q5', label: '5. Seat preference?', options: ['Window (Views & Sleep)', 'Aisle (Freedom & Space)', 'Middle (Pure Chaos)'] },
  { id: 'q6', label: '6. Dream travel destination?', options: ['Tokyo, Japan', 'Paris, France', 'New York City, USA', 'Bali, Indonesia', 'Swiss Alps, Switzerland', 'Rome, Italy', 'Maldives', 'Dubai, UAE', 'London, UK', 'Sydney, Australia'] },
  { id: 'q7', label: '7. Favorite music genre?', options: ['Pop / Top 40', 'Hip-Hop / Rap', 'Rock / Indie', 'Classical / Instrumental', 'Jazz / Blues', 'EDM / House', 'Country', 'R&B / Soul', 'Lo-Fi / Chillhop', 'Heavy Metal'] },
  { id: 'q8', label: '8. In-flight food preference?', options: ['No Restrictions', 'Vegan / Plant-Based', 'Vegetarian', 'Halal', 'Kosher', 'Gluten-Free', 'Seafood Lover', 'Carnivore'] },
  { id: 'q9', label: '9. Your Zodiac Sign?', options: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] },
  { id: 'q10', label: '10. Favorite Hobby?', options: ['Photography', 'Reading / Literature', 'Gaming / Esports', 'Hiking / Outdoors', 'Cooking / Baking', 'Fitness / Gym', 'Tech / Coding', 'Art / Drawing', 'Writing / Blogging', 'Fashion / Styling'] }
];

export const MatchSurvey: React.FC<Props> = ({ onMatchReady, onEditStart, onDisconnect, hasPartnerLeft, onAcknowledgeDisconnect }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setOpenDropdownId(null); 
  };

  const handleSubmit = () => {
    setIsEditing(false);
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      onMatchReady(); 
    }, 1500);
  };

  const handleEdit = () => {
    setIsEditing(true);
    onEditStart();
  };

  const handleDisconnect = () => {
    const doubleCheck = window.confirm("Are you sure you want to terminate this secure connection? Your chat logs and co-op drawing canvas history will be permanently cleared.");
    if (doubleCheck) {
      setIsEditing(true); 
      onDisconnect();     
    }
  };

  if (!isEditing) {
    // --- NEW: THE PARTNER DISCONNECTED VIEW ---
    if (hasPartnerLeft) {
      return (
        <div className={styles.surveyContainer}>
          <div className={styles.matchResult}>
            <div className={styles.dangerBadge}>Connection Lost</div>
            <h2 className={styles.matchTitle}>Session Terminated</h2>
            <p className={styles.matchDesc}>The passenger in Seat 14B has ended the connection.</p>
            <div className={styles.actionButtons}>
              {/* This instantly fires the search again using the ALREADY SAVED answers! */}
              <button className={styles.submitButton} onClick={() => { onAcknowledgeDisconnect(); handleSubmit(); }}>
                🔍 Find New Match
              </button>
              <button className={styles.secondaryButton} onClick={() => { onAcknowledgeDisconnect(); handleEdit(); }}>
                ✏️ Edit Preferences
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.surveyContainer}>
        {isSearching ? (
          <div className={styles.searchingState}>
            <div className={styles.radarSpinner}></div>
            <h3>Finding Your Match...</h3>
            <p>Scanning the cabin for similar interests.</p>
          </div>
        ) : (
          <div className={styles.matchResult}>
            <div className={styles.matchBadge}>94% Match</div>
            <h2 className={styles.matchTitle}>Connected with Seat 14B</h2>
            <p className={styles.matchDesc}>
              They share your preference for <strong>{answers['q2'] || 'similar media'}</strong> and prefer a <strong>{answers['q3'] || 'similar'}</strong> flight.
            </p>
            <div className={styles.actionButtons}>
              <button className={styles.secondaryButton} onClick={handleEdit}>
                ✏️ Edit Preferences
              </button>
              <button className={styles.dangerButton} onClick={handleDisconnect}>
                🛑 Terminate Connection
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.surveyContainer}>
      <div className={styles.header}>
        <h2>Passenger Matchmaking</h2>
        <p>Find your perfect flight neighbor.</p>
      </div>

      <div className={styles.questionList}>
        {QUESTIONS.map((q) => (
          <div key={q.id} className={styles.questionBlock}>
            <label className={styles.questionLabel}>{q.label}</label>
            <div className={styles.customSelectWrapper}>
              <div className={`${styles.customSelectTrigger} ${openDropdownId === q.id ? styles.isOpen : ''}`} onClick={() => setOpenDropdownId(openDropdownId === q.id ? null : q.id)}>
                <span>{answers[q.id] || 'Select an option...'}</span>
                <span className={styles.chevron}>▼</span>
              </div>
              {openDropdownId === q.id && (
                <>
                  <div className={styles.backdrop} onClick={() => setOpenDropdownId(null)} />
                  <ul className={styles.customSelectMenu}>
                    {q.options.map(opt => (
                      <li key={opt} className={`${styles.customSelectOption} ${answers[q.id] === opt ? styles.selectedOption : ''}`} onClick={() => handleSelect(q.id, opt)}>
                        {opt}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className={styles.submitButton} onClick={handleSubmit} disabled={Object.keys(answers).length < QUESTIONS.length}>
        Find My Match
      </button>
    </div>
  );
};