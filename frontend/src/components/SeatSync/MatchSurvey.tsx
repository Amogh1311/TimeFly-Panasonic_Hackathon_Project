import { useEffect, useState } from 'react';
import styles from './MatchSurvey.module.css';

interface SurveyAnswers { [key: string]: string; }

interface Props {
  isMatched: boolean; 
  partnerSeat: string;
  matchRequestStatus: 'idle' | 'pending' | 'accepted' | 'declined'; 
  onSubmitProfile: (answers: any) => void;     // <--- NEW: Saves data to Python
  onSendMatchRequest: () => void;              // <--- UPDATED: Enters the pool (no args)
  onCancelRequest: () => void;                
  onEditStart: () => void;
  onDisconnect: () => void;
  hasPartnerLeft: boolean;          
  onAcknowledgeDisconnect: () => void; 
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

export const MatchSurvey: React.FC<Props> = ({ 
  isMatched, 
  partnerSeat,
  matchRequestStatus, 
  onSubmitProfile, 
  onSendMatchRequest, 
  onCancelRequest,
  onEditStart, 
  onDisconnect, 
  hasPartnerLeft, 
  onAcknowledgeDisconnect 
}) => {
  const [isEditing, setIsEditing] = useState(true);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (isMatched) {
      setIsEditing(false);
    }
  }, [isMatched]);

  const handleSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setOpenDropdownId(null); 
  };

  // STEP 1: Submit Profile Data
  const handleProfileSubmit = () => {
    setIsEditing(false);
    onSubmitProfile(answers);
  };

  const handleEdit = () => {
    setIsEditing(true);
    onEditStart();
  };

  const executeDisconnect = () => {
    setShowConfirmModal(false);
    // Note: We don't set isEditing to true here because we want them to 
    // land back in the "Waiting Room" rather than refilling the form!
    onDisconnect();     
  };

  if (!isEditing) {
    if (hasPartnerLeft) {
      return (
        <div className={styles.surveyContainer}>
          <div className={styles.matchResult}>
            <div className={styles.dangerBadge}>Connection Lost</div>
            <h2 className={styles.matchTitle}>Session Terminated</h2>
            <p className={styles.matchDesc}>The passenger in Seat {partnerSeat} has ended the connection.</p>
            <div className={styles.actionButtons}>
              <button className={styles.submitButton} onClick={() => { onAcknowledgeDisconnect(); onSendMatchRequest(); }}>
                🔍 Jump Back into Pool
              </button>
              <button className={styles.secondaryButton} onClick={() => { onAcknowledgeDisconnect(); handleEdit(); }}>
                ✏️ Edit Preferences
              </button>
            </div>
          </div>
        </div>
      );
    }

    // NEW: THE WAITING ROOM (Data is submitted, but not actively searching yet)
    if (matchRequestStatus === 'idle') {
      return (
        <div className={styles.surveyContainer}>
          <div className={styles.header}>
            <h2 style={{ color: 'var(--accent-cyan)' }}>Profile Saved! 🎒</h2>
            <p>Your travel data is securely locked in.</p>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>✈️</span>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Whenever you're ready to socialize, enter the live matchmaking pool. We will instantly pair you with the best available passenger.
            </p>
          </div>

          <div className={styles.actionButtons}>
            <button 
              className={styles.submitButton} 
              onClick={() => onSendMatchRequest()}
              style={{ width: '100%', fontSize: '1.2rem', padding: '1rem', boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)' }}
            >
              🔍 Enter Live Pool
            </button>
            <button 
              className={styles.secondaryButton} 
              onClick={handleEdit}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              ✏️ Edit Profile
            </button>
          </div>
        </div>
      );
    }

    if (matchRequestStatus === 'pending') {
      return (
        <div className={styles.surveyContainer}>
          <div className={styles.searchingState}>
            <div className={styles.radarSpinner}></div>
            <h3>Finding Your Match...</h3>
            <p>MatchMaker in progress, please wait while we connect you to your buddy</p>
            <p style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', marginTop: '1rem', animation: 'pulse 1.5s infinite' }}>
              Scanning Cabins...
            </p>
            
            <div className={styles.actionButtons} style={{ marginTop: '2rem' }}>
              <button 
                onClick={() => onCancelRequest()}
                style={{ 
                  width: '100%', background: '#ff4444', color: '#ffffff', 
                  border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem',
                  fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)'
                }}
              >
                Leave Pool
              </button>
            </div>

          </div>
        </div>
      );
    }

    if (matchRequestStatus === 'declined') {
      return (
        <div className={styles.surveyContainer}>
          <div className={styles.matchResult}>
            <div className={styles.dangerBadge} style={{ background: 'rgba(255, 68, 68, 0.2)', border: '1px solid #ff4444', color: '#ff4444' }}>
              Connection Refused
            </div>
            <h2 className={styles.matchTitle}>Request Declined</h2>
            <p className={styles.matchDesc}>
              Seat {partnerSeat} is currently busy or prefers not to connect right now. 
            </p>
            <div className={styles.actionButtons}>
              <button className={styles.submitButton} style={{ width: '100%' }} onClick={() => onSendMatchRequest()}>
                🔙 Jump Back into Pool
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback: CONNECTED STATE
    return (
      <div className={styles.surveyContainer} style={{ position: 'relative' }}>
        
        {showConfirmModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Terminate Connection?</h3>
              <p>Your chat logs and game history will be permanently wiped to protect your privacy.</p>
              <div className={styles.modalActions}>
                <button className={styles.modalCancelBtn} onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button className={styles.modalConfirmBtn} onClick={executeDisconnect}>Terminate</button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.matchResult}>
          <div className={styles.matchBadge}>AI Linked Link</div>
          <h2 className={styles.matchTitle}>Connected with Seat {partnerSeat}</h2>
          <div className={styles.actionButtons}>
            <button className={styles.secondaryButton} onClick={handleEdit}>
              ✏️ Edit Preferences
            </button>
            <button 
              onClick={() => setShowConfirmModal(true)}
              style={{ 
                background: '#ff4444', color: '#ffffff', 
                border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem',
                fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)'
              }}
            >
              Terminate Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.surveyContainer}>
      <div className={styles.header}>
        <h2>Passenger Matchmaking</h2>
        <p>Step 1: Fill out your profile.</p>
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

      {/* Button changed to say Submit Profile */}
      <button className={styles.submitButton} onClick={handleProfileSubmit} disabled={Object.keys(answers).length < QUESTIONS.length}>
        Submit Profile
      </button>
    </div>
  );
};