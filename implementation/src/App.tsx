

import React, { useState } from 'react';
import './global-modern.css';
import { theme } from './theme';
// Settings keys
const SETTINGS_KEY = 'fbk_settings';
const PLAYER_LEVEL_KEY = 'fbk_player_level';

type Settings = {
  showStringNames: boolean;
  fretboardColor: string;
  baseTimer: number; // Base timer in seconds (will be adjusted based on performance)
  adaptiveTiming: boolean; // Whether to adjust timing based on score
};

function getDefaultSettings(): Settings {
  return {
    showStringNames: true,
    fretboardColor: '#222',
    baseTimer: 5,
    adaptiveTiming: true,
  };
}

import ColorModeToggle from './components/ColorModeToggle';
import { useContext } from 'react';
import { ColorModeContext } from './components/ColorModeContext';
import './App.css';
import logo from './logo.svg';


const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E']; // Standard tuning, low E at bottom
const FRETS = 12;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Level progression: determines which strings and frets are available at each level
// Level 0: String 0 (high E), frets 0-2
// Level 1: Strings 0-1 (high E, B), frets 0-2
// Level 2: Strings 0-1, frets 0-3
// Level 3: Strings 0-1, frets 0-4
// Level 4: Strings 0-2 (high E, B, G), frets 0-4
// ... and so on
function getLevelConstraints(level: number): { maxString: number; maxFret: number } {
  if (level === 0) return { maxString: 0, maxFret: 2 }; // First string, first 3 notes (0-2)
  if (level === 1) return { maxString: 1, maxFret: 2 }; // Two strings, first 3 notes
  if (level === 2) return { maxString: 1, maxFret: 3 }; // Two strings, 4 frets
  if (level === 3) return { maxString: 1, maxFret: 4 }; // Two strings, 5 frets
  if (level === 4) return { maxString: 2, maxFret: 4 }; // Three strings, 5 frets
  if (level === 5) return { maxString: 2, maxFret: 5 }; // Three strings, 6 frets
  if (level === 6) return { maxString: 3, maxFret: 5 }; // Four strings, 6 frets
  if (level === 7) return { maxString: 3, maxFret: 6 }; // Four strings, 7 frets
  if (level === 8) return { maxString: 4, maxFret: 6 }; // Five strings, 7 frets
  if (level === 9) return { maxString: 4, maxFret: 7 }; // Five strings, 8 frets
  if (level === 10) return { maxString: 5, maxFret: 7 }; // All strings, 8 frets
  if (level === 11) return { maxString: 5, maxFret: 8 }; // All strings, 9 frets
  if (level === 12) return { maxString: 5, maxFret: 9 }; // All strings, 10 frets
  if (level === 13) return { maxString: 5, maxFret: 10 }; // All strings, 11 frets
  if (level === 14) return { maxString: 5, maxFret: 11 }; // All strings, 12 frets
  // Level 15+: All strings and frets
  return { maxString: 5, maxFret: 12 };
}

// Calculate required score to pass a level (percentage-based on round)
function getRequiredScoreForLevel(_level: number): number {
  // Require 80% correct answers in a round to pass
  return Math.ceil(15 * 0.8); // 12 out of 15
}

function getNoteName(openNote: string, fret: number) {
  const openIdx = NOTE_NAMES.indexOf(openNote);
  return NOTE_NAMES[(openIdx + fret) % 12];
}


function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function getRandomQuiz(level: number = 15) {
  // Get constraints for this level
  const constraints = getLevelConstraints(level);
  
  // Pick a random string and fret within level constraints
  const stringIdx = getRandomInt(constraints.maxString + 1);
  const fretIdx = 1 + getRandomInt(constraints.maxFret); // 1..maxFret (not including open string in quiz)
  const correctNote = getNoteName(STRINGS[stringIdx], fretIdx);
  // Pick 2 random incorrect notes
  let options = [correctNote];
  while (options.length < 3) {
    const n = NOTE_NAMES[getRandomInt(12)];
    if (!options.includes(n)) options.push(n);
  }
  // Shuffle options
  options = options.sort(() => Math.random() - 0.5);
  return { stringIdx, fretIdx, correctNote, options };
}

function App() {
  const { colorMode } = useContext(ColorModeContext);
  // Detect portrait mode on small mobile devices
  const [showRotateMsg, setShowRotateMsg] = useState(false);
  React.useEffect(() => {
    function checkOrientation() {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700;
      setShowRotateMsg(isPortrait && isSmall);
    }
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Settings state
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      return { ...getDefaultSettings(), ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch {
      return getDefaultSettings();
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Player level state
  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(PLAYER_LEVEL_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });
  
  // Persist settings
  React.useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);
  
  // Persist player level
  React.useEffect(() => {
    localStorage.setItem(PLAYER_LEVEL_KEY, playerLevel.toString());
  }, [playerLevel]);
  // Settings handlers
  function handleToggleStringNames() {
    setSettings((s) => ({ ...s, showStringNames: !s.showStringNames }));
  }
  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSettings((s) => ({ ...s, fretboardColor: e.target.value }));
  }
  function handleTimerChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSettings((s) => ({ ...s, baseTimer: parseInt(e.target.value, 10) || 5 }));
  }
  function handleAdaptiveTimingToggle() {
    setSettings((s) => ({ ...s, adaptiveTiming: !s.adaptiveTiming }));
  }
  
  function handleResetLevel() {
    if (confirm('Are you sure you want to reset your level to 0? This cannot be undone.')) {
      setPlayerLevel(0);
      localStorage.setItem(PLAYER_LEVEL_KEY, '0');
    }
  }

  // Local storage keys
  const SCORE_KEY = 'fbk_score';
  const YESTERDAY_KEY = 'fbk_yesterday';
  const DATE_KEY = 'fbk_date';
  const HISTORY_KEY = 'fbk_history'; // { 'YYYY-MM-DD': score, ... }

  // Get today's date as YYYY-MM-DD
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  // State
  const [score, setScore] = useState(() => {
    const storedDate = localStorage.getItem(DATE_KEY);
    const storedScore = localStorage.getItem(SCORE_KEY);
    if (storedDate === todayStr() && storedScore) {
      return parseInt(storedScore, 10);
    }
    return 0;
  });
  const [yesterdayScore, setYesterdayScore] = useState(() => {
    const storedDate = localStorage.getItem(DATE_KEY);
    const storedYesterday = localStorage.getItem(YESTERDAY_KEY);
    if (storedDate === todayStr() && storedYesterday) {
      return parseInt(storedYesterday, 10);
    }
    return 0;
  });
  // Score history: { 'YYYY-MM-DD': score, ... }
  const [history, setHistory] = useState<{ [date: string]: number }>(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    } catch {
      return {};
    }
  });
  const [quiz, setQuiz] = useState(getRandomQuiz(0)); // Start with level 0 constraints
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(5);

  // Round state
  const [roundActive, setRoundActive] = useState(false);
  const [questionsInRound, setQuestionsInRound] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const QUESTIONS_PER_ROUND = 15;

  // Calculate dynamic timer based on score and settings
  const getCalculatedTimer = React.useCallback((): number => {
    if (!settings.adaptiveTiming) {
      return settings.baseTimer;
    }
    
    // Adjust timer based on recent performance
    // If score is low (beginner), give more time
    // Base calculation: more time for lower scores
    const recentPerformance = roundActive ? (roundScore / Math.max(questionsInRound, 1)) : (score / Math.max(score + 10, 1));
    
    // Scale from 2x base time (for beginners) to 0.7x base time (for experts)
    const multiplier = Math.max(0.7, Math.min(2.0, 2.0 - recentPerformance * 1.3));
    
    return Math.round(settings.baseTimer * multiplier);
  }, [settings.adaptiveTiming, settings.baseTimer, roundActive, roundScore, questionsInRound, score]);

  // Round management functions
  const startRound = React.useCallback(() => {
    setRoundActive(true);
    setQuestionsInRound(0);
    setRoundScore(0);
    setQuiz(getRandomQuiz(playerLevel));
    // Timer will be set by the next useEffect once roundActive is true
    setSelected(null);
    setFeedback(null);
  }, [playerLevel]);

  const endRound = React.useCallback(() => {
    setRoundActive(false);
    const requiredScore = getRequiredScoreForLevel(playerLevel);
    const passed = roundScore >= requiredScore;
    
    if (passed && playerLevel < 15) {
      setFeedback(`🎉 Round completed! You scored ${roundScore}/${QUESTIONS_PER_ROUND} - Level up! 🎉`);
      setPlayerLevel((level) => level + 1);
    } else if (passed) {
      setFeedback(`🎉 Round completed! You scored ${roundScore}/${QUESTIONS_PER_ROUND} - Maximum level reached! 🎉`);
    } else {
      setFeedback(`Round completed! You scored ${roundScore}/${QUESTIONS_PER_ROUND} - Need ${requiredScore} to level up. Try again!`);
    }
    
    // Add round score to total score
    setScore((s) => s + roundScore);
  }, [roundScore, QUESTIONS_PER_ROUND, playerLevel]);

  const stopRound = React.useCallback(() => {
    setRoundActive(false);
    setQuestionsInRound(0);
    setRoundScore(0);
    setFeedback('Round stopped');
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  // On mount, check if date changed and reset scores if needed
  React.useEffect(() => {
    const storedDate = localStorage.getItem(DATE_KEY);
    if (storedDate !== todayStr()) {
      // Store the previous day's score before resetting
      const previousScore = localStorage.getItem(SCORE_KEY) || '0';
      
      // Move yesterday's score
      localStorage.setItem(YESTERDAY_KEY, previousScore);
      localStorage.setItem(SCORE_KEY, '0');
      localStorage.setItem(DATE_KEY, todayStr());
      setYesterdayScore(parseInt(previousScore, 10));
      setScore(0);
      // Add yesterday's score to history
      setHistory((prev) => {
        const newHist = { ...prev };
        const yest = storedDate || todayStr();
        newHist[yest] = parseInt(previousScore, 10);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHist));
        return newHist;
      });
    }
  }, []);

  // Persist score, date, and history on change
  React.useEffect(() => {
    localStorage.setItem(SCORE_KEY, score.toString());
    localStorage.setItem(DATE_KEY, todayStr());
    setHistory((prev) => {
      const newHist = { ...prev, [todayStr()]: score };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHist));
      return newHist;
    });
  }, [score]);

  // Timer effect
  React.useEffect(() => {
    if (!roundActive || selected !== null) return;
    if (timer === 0) {
      setFeedback('⏰ Time up!');
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
        
        // Move to next question in round
        const nextQuestionNum = questionsInRound + 1;
        if (nextQuestionNum >= QUESTIONS_PER_ROUND) {
          endRound();
        } else {
          setQuestionsInRound(nextQuestionNum);
          setQuiz(getRandomQuiz(playerLevel));
          setTimer(getCalculatedTimer());
        }
      }, 1200);
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, selected, roundActive, questionsInRound, endRound, getCalculatedTimer, playerLevel]);

  // Set initial timer when round starts
  React.useEffect(() => {
    if (roundActive && questionsInRound === 0) {
      setTimer(getCalculatedTimer());
    }
  }, [roundActive, questionsInRound, getCalculatedTimer]);

  const handleSelect = React.useCallback((option: string) => {
    if (selected !== null || !roundActive) return;
    setSelected(option);
    const isCorrect = option === quiz.correctNote;
    
    if (isCorrect) {
      setRoundScore((s) => s + 1);
      setFeedback('✅ Correct!');
    } else {
      setFeedback(`❌ Wrong! The correct answer was: ${quiz.correctNote}`);
    }
    
    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      
      // Move to next question in round
      const nextQuestionNum = questionsInRound + 1;
      if (nextQuestionNum >= QUESTIONS_PER_ROUND) {
        endRound();
      } else {
        setQuestionsInRound(nextQuestionNum);
        setQuiz(getRandomQuiz(playerLevel));
        setTimer(getCalculatedTimer());
      }
    }, 1200);
  }, [selected, roundActive, quiz.correctNote, questionsInRound, QUESTIONS_PER_ROUND, endRound, getCalculatedTimer, playerLevel]);

  // Get last 30 days for chart
  function getLast30Days() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  return (
    <div className="App" style={{ minHeight: '100vh', background: 'var(--background)' }} data-color-mode={colorMode}>
      {/* Only block the UI if on a small portrait device, otherwise render the app as normal */}
      {showRotateMsg && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(24,26,32,0.96)',
          color: 'var(--on-primary)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontSize: 22,
          textAlign: 'center',
          letterSpacing: '-0.5px',
        }}>
          <div style={{ marginBottom: 20, fontSize: 40 }}>
            <span role="img" aria-label="rotate">🔄</span>
          </div>
          <div style={{ fontWeight: 600 }}>Please rotate your device to landscape mode for the best Fretboard-King experience.</div>
        </div>
      )}

      {/* Settings button */}
      <button
        aria-label="Settings"
        onClick={() => setSettingsOpen(true)}
        style={{
          position: 'fixed',
          top: theme.spacing(2),
          left: theme.spacing(2),
          background: 'var(--surface)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 28,
          zIndex: 10,
          color: 'var(--on-surface)',
          borderRadius: '50%',
          width: 48,
          height: 48,
          boxShadow: 'var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseOver={e => (e.currentTarget.style.background = 'var(--primary)')}
        onMouseOut={e => (e.currentTarget.style.background = 'var(--surface)')}
      >
        <span role="img" aria-label="Settings">⚙️</span>
      </button>

      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: `${theme.spacing(4)} 0 ${theme.spacing(2)} 0`,
        justifyContent: 'center',
      }}>
        <img src={logo} alt="Fretboard-King logo" style={{ width: 48, height: 48, borderRadius: 12, boxShadow: '0 2px 8px #0004' }} />
        <h1 style={{
          fontSize: 36,
          fontWeight: theme.font.headingWeight,
          margin: 0,
          color: 'var(--on-primary)',
          letterSpacing: '-1px',
        }}>Fretboard-King</h1>
      </header>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
        marginBottom: theme.spacing(2),
        fontSize: 20,
        color: 'var(--on-surface)',
      }}>
        <span>Level: <b style={{ color: 'var(--primary)' }}>{playerLevel}</b></span>
        <span>Total Score: <b style={{ color: 'var(--secondary)' }}>{score}</b></span>
        {roundActive && (
          <span>Round: <b style={{ color: 'var(--primary)' }}>{roundScore}/{questionsInRound}/{QUESTIONS_PER_ROUND}</b></span>
        )}
        <span style={{ color: '#888', fontSize: 16 }}>Yesterday: {yesterdayScore}</span>
      </div>
      <div style={{
        textAlign: 'center',
        fontSize: 14,
        color: '#888',
        marginBottom: theme.spacing(1),
      }}>
        {(() => {
          const constraints = getLevelConstraints(playerLevel);
          const stringCount = constraints.maxString + 1;
          const fretCount = constraints.maxFret + 1; // Including open string for display
          return `Unlocked: ${stringCount} string${stringCount > 1 ? 's' : ''}, ${fretCount} fret${fretCount > 1 ? 's' : ''} (Need ${getRequiredScoreForLevel(playerLevel)}/${QUESTIONS_PER_ROUND} to level up)`;
        })()}
      </div>
      <BarChart history={history} getLast30Days={getLast30Days} />
      <Fretboard
        highlight={{ stringIdx: quiz.stringIdx, fretIdx: quiz.fretIdx }}
        showStringNames={settings.showStringNames}
        fretboardColor={settings.fretboardColor}
      />
      
      {/* Round Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        margin: `${theme.spacing(2)} 0`,
      }}>
        {!roundActive ? (
          <button
            onClick={startRound}
            style={{
              padding: '12px 24px',
              fontSize: 18,
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: 'var(--shadow)',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--secondary)')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--primary)')}
          >
            🎯 Start Round (15 questions)
          </button>
        ) : (
          <button
            onClick={stopRound}
            style={{
              padding: '12px 24px',
              fontSize: 18,
              background: 'var(--error)',
              color: 'var(--on-primary)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: 'var(--shadow)',
              transition: 'background 0.2s',
            }}
          >
            🛑 Stop Round
          </button>
        )}
      </div>

      <main style={{ margin: `${theme.spacing(3)} 0` }}>
        {roundActive ? (
          <>
            <div style={{
              fontSize: 22,
              marginBottom: 12,
              textAlign: 'center',
              fontWeight: 500,
              color: 'var(--on-primary)',
            }}>
              Which note is this? <b style={{ color: 'var(--primary)' }}>({timer})</b>
            </div>
            <div style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              {quiz.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={selected !== null}
                  style={{
                    padding: '16px 36px',
                    fontSize: 22,
                    background: selected === opt
                      ? (opt === quiz.correctNote ? 'var(--secondary)' : 'var(--error)')
                      : 'var(--surface)',
                    color: 'var(--on-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: selected === null ? 'pointer' : 'default',
                    opacity: selected !== null && selected !== opt ? 0.7 : 1,
                    boxShadow: selected === opt ? '0 2px 12px #0004' : 'none',
                    fontWeight: 500,
                    marginBottom: 8,
                    transition: 'background 0.2s, box-shadow 0.2s',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{
            fontSize: 22,
            textAlign: 'center',
            fontWeight: 500,
            color: 'var(--on-surface)',
            padding: theme.spacing(4),
          }}>
            {feedback?.includes('Round completed') ? feedback : 'Click "Start Round" to begin a new 15-question challenge!'}
          </div>
        )}
        {feedback && roundActive && (
          <div style={{
            marginTop: 16,
            fontSize: 22,
            color: feedback.startsWith('✅') ? 'var(--secondary)' : feedback.startsWith('❌') ? 'var(--error)' : 'var(--primary)',
            fontWeight: 600,
            minHeight: 32,
            textAlign: 'center',
            letterSpacing: '-0.5px',
            transition: 'color 0.2s',
          }}>{feedback}</div>
        )}
      </main>

      {/* Settings Modal */}
      {settingsOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(24,26,32,0.7)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s',
          }}
          onClick={() => setSettingsOpen(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              color: 'var(--on-surface)',
              borderRadius: 'var(--radius)',
              minWidth: 320,
              maxWidth: 400,
              padding: theme.spacing(4),
              boxShadow: 'var(--shadow)',
              position: 'relative',
              animation: 'popIn 0.22s cubic-bezier(.4,2,.6,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={() => setSettingsOpen(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                color: 'var(--on-surface)',
                fontSize: 26,
                cursor: 'pointer',
                borderRadius: '50%',
                width: 36,
                height: 36,
                transition: 'background 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--primary)')}
              onMouseOut={e => (e.currentTarget.style.background = 'none')}
            >✖️</button>
            <h2 style={{ marginTop: 0, color: 'var(--on-primary)', fontWeight: 600, fontSize: 26 }}>Settings & Stats</h2>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ margin: '12px 0 6px 0', fontSize: 16, color: 'var(--on-surface)' }}>Stats</h3>
              <BarChart history={history} getLast30Days={getLast30Days} />
            </div>
            <div>
              <h3 style={{ margin: '12px 0 6px 0', fontSize: 16, color: 'var(--on-surface)' }}>Settings</h3>
              <div style={{ marginBottom: 14 }}>
                <ColorModeToggle />
              </div>
              <label style={{ display: 'block', marginBottom: 14, fontSize: 16 }}>
                <input
                  type="checkbox"
                  checked={settings.showStringNames}
                  onChange={handleToggleStringNames}
                  style={{ marginRight: 10 }}
                />
                Show string names on fretboard
              </label>
              <label style={{ display: 'block', marginBottom: 14, fontSize: 16 }}>
                Fretboard color:
                <input
                  type="color"
                  value={settings.fretboardColor}
                  onChange={handleColorChange}
                  style={{ marginLeft: 10, verticalAlign: 'middle', border: '1px solid var(--border)' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 14, fontSize: 16 }}>
                Base timer (seconds):
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={settings.baseTimer}
                  onChange={handleTimerChange}
                  style={{ marginLeft: 10, marginRight: 10 }}
                />
                <span style={{ fontWeight: 600 }}>{settings.baseTimer}s</span>
              </label>
              <label style={{ display: 'block', marginBottom: 10, fontSize: 16 }}>
                <input
                  type="checkbox"
                  checked={settings.adaptiveTiming}
                  onChange={handleAdaptiveTimingToggle}
                  style={{ marginRight: 10 }}
                />
                Adaptive timing (adjust based on performance)
              </label>
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 16, color: 'var(--on-surface)' }}>Level Progress</h4>
                <p style={{ fontSize: 14, color: '#888', margin: '0 0 10px 0' }}>
                  Current level: <b style={{ color: 'var(--primary)' }}>{playerLevel}</b>
                </p>
                <button
                  onClick={handleResetLevel}
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    background: 'var(--error)',
                    color: 'var(--on-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    boxShadow: 'var(--shadow)',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.opacity = '0.8')}
                  onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                >
                  Reset Level to 0
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

// Simple SVG bar chart for last 30 days
function BarChart({ history, getLast30Days }: { history: { [date: string]: number }, getLast30Days: () => string[] }) {
  const days = getLast30Days();
  const values = days.map((d) => history[d] || 0);
  const max = Math.max(1, ...values);
  return (
    <div style={{
      width: '90vw',
      maxWidth: 700,
      margin: '0 auto 28px auto',
      height: 110,
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 2px 12px #0002',
      padding: '18px 18px 8px 18px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: 'background 0.2s',
    }}>
      <svg width="100%" height="80" viewBox={`0 0 ${days.length * 16} 80`} style={{ display: 'block' }}>
        {values.map((v, i) => (
          <g key={i}>
            <rect
              x={i * 16 + 2}
              y={80 - (v / max) * 60}
              width={12}
              height={(v / max) * 60}
              fill="var(--secondary)"
              rx={4}
              style={{ transition: 'height 0.3s, y 0.3s' }}
            />
            <title>{`${days[i]}: ${v}`}</title>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 2, letterSpacing: '0.2px' }}>
        Last 30 days
      </div>
    </div>
  );
}
}


function Fretboard({ highlight, showStringNames = true, fretboardColor = '#222' }: {
  highlight?: { stringIdx: number; fretIdx: number };
  showStringNames?: boolean;
  fretboardColor?: string;
}) {
  // For each marked fret, render a dot only once, centered vertically
  const markerFrets = [3, 5, 7, 9, 12];
  return (
    <div style={{
      position: 'relative',
      width: '95vw',
      maxWidth: '1200px',
      margin: '0 auto',
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 2px 12px #0002',
      padding: '18px 0 18px 0',
      overflowX: 'auto',
      transition: 'background 0.2s',
    }}>
      <table
        className="fretboard"
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          tableLayout: 'fixed',
        }}
      >
        <tbody>
          {STRINGS.map((string, sIdx) => (
            <tr key={sIdx}>
              {[...Array(FRETS + 1)].map((_, fIdx) => {
                const isHighlight =
                  highlight && sIdx === highlight.stringIdx && fIdx === highlight.fretIdx;
                return (
                  <td
                    key={fIdx}
                    style={{
                      border: '1px solid var(--border)',
                      width: fIdx === 0 ? 44 : 'auto',
                      height: 44,
                      background: fIdx === 0
                        ? 'var(--surface)'
                        : isHighlight
                          ? 'var(--primary)'
                          : fretboardColor,
                      color: fIdx === 0 ? 'var(--on-primary)' : '#b0b0b0',
                      textAlign: 'center',
                      position: 'relative',
                      padding: 0,
                      fontWeight: fIdx === 0 ? 600 : 400,
                      fontSize: fIdx === 0 ? 18 : 16,
                      transition: 'background 0.2s',
                    }}
                  >
                    {fIdx === 0 && showStringNames ? string : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Render marker dots absolutely over the table, one per marked fret, two for 12th fret */}
      {markerFrets.map((fret) => {
        if (fret === 12) {
          // 12th fret gets 2 dots at 1/3 and 2/3 positions
          return (
            <React.Fragment key={fret}>
              <span
                style={{
                  position: 'absolute',
                  left: `calc(${((fret) / (FRETS + 1)) * 100}% + 44px / 2)`, // 44px for string label col
                  top: '33.33%',
                  transform: 'translate(-50%, -50%)',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 4px #0006',
                  opacity: 0.92,
                  zIndex: 2,
                  pointerEvents: 'none',
                  transition: 'box-shadow 0.2s',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: `calc(${((fret) / (FRETS + 1)) * 100}% + 44px / 2)`, // 44px for string label col
                  top: '66.67%',
                  transform: 'translate(-50%, -50%)',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 4px #0006',
                  opacity: 0.92,
                  zIndex: 2,
                  pointerEvents: 'none',
                  transition: 'box-shadow 0.2s',
                }}
              />
            </React.Fragment>
          );
        } else {
          // All other frets get single centered dot
          return (
            <span
              key={fret}
              style={{
                position: 'absolute',
                left: `calc(${((fret) / (FRETS + 1)) * 100}% + 44px / 2)`, // 44px for string label col
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 0 4px #0006',
                opacity: 0.92,
                zIndex: 2,
                pointerEvents: 'none',
                transition: 'box-shadow 0.2s',
              }}
            />
          );
        }
      })}
    </div>
  );
}

export default App;
