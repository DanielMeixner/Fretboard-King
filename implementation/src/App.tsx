

import React, { useState } from 'react';
import './global-modern.css';
import { theme } from './theme';
// Settings keys
const SETTINGS_KEY = 'fbk_settings';

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

function getNoteName(openNote: string, fret: number) {
  const openIdx = NOTE_NAMES.indexOf(openNote);
  return NOTE_NAMES[(openIdx + fret) % 12];
}


function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function getRandomQuiz() {
  // Pick a random string and fret (not open string)
  const stringIdx = getRandomInt(STRINGS.length);
  const fretIdx = 1 + getRandomInt(FRETS); // 1..12
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
  // Persist settings
  React.useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);
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
  const [quiz, setQuiz] = useState(getRandomQuiz());
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
    setQuiz(getRandomQuiz());
    // Timer will be set by the next useEffect once roundActive is true
    setSelected(null);
    setFeedback(null);
  }, []);

  const endRound = React.useCallback(() => {
    setRoundActive(false);
    setFeedback(`🎉 Round completed! You scored ${roundScore}/${QUESTIONS_PER_ROUND}`);
    // Add round score to total score
    setScore((s) => s + roundScore);
  }, [roundScore, QUESTIONS_PER_ROUND]);

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
          setQuiz(getRandomQuiz());
          setTimer(getCalculatedTimer());
        }
      }, 1200);
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, selected, roundActive, questionsInRound, endRound, getCalculatedTimer]);

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
        setQuiz(getRandomQuiz());
        setTimer(getCalculatedTimer());
      }
    }, 1200);
  }, [selected, roundActive, quiz.correctNote, questionsInRound, QUESTIONS_PER_ROUND, endRound, getCalculatedTimer]);

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
        <span>Total Score: <b style={{ color: 'var(--secondary)' }}>{score}</b></span>
        {roundActive && (
          <span>Round: <b style={{ color: 'var(--primary)' }}>{roundScore}/{questionsInRound}/{QUESTIONS_PER_ROUND}</b></span>
        )}
        <span style={{ color: '#888', fontSize: 16 }}>Yesterday: {yesterdayScore}</span>
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
              <BarChart history={history} getLast30Days={getLast30Days} compact={true} />
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
            </div>
          </div>
        </div>
      )}
    </div>
  );

// Simple SVG bar chart for last 30 days
function BarChart({ history, getLast30Days, compact = false }: { history: { [date: string]: number }, getLast30Days: () => string[], compact?: boolean }) {
  const days = getLast30Days();
  const values = days.map((d) => history[d] || 0);
  const max = Math.max(1, ...values);
  return (
    <div style={{
      width: compact ? '100%' : '90vw',
      maxWidth: compact ? 'none' : 700,
      margin: compact ? '0 auto 12px auto' : '0 auto 28px auto',
      height: compact ? 90 : 110,
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 2px 12px #0002',
      padding: compact ? '12px 12px 6px 12px' : '18px 18px 8px 18px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: 'background 0.2s',
    }}>
      <svg width="100%" height={compact ? 60 : 80} viewBox={`0 0 ${days.length * 16} ${compact ? 60 : 80}`} style={{ display: 'block' }}>
        {values.map((v, i) => (
          <g key={i}>
            <rect
              x={i * 16 + 2}
              y={(compact ? 60 : 80) - (v / max) * (compact ? 45 : 60)}
              width={12}
              height={(v / max) * (compact ? 45 : 60)}
              fill="var(--secondary)"
              rx={4}
              style={{ transition: 'height 0.3s, y 0.3s' }}
            />
            <title>{`${days[i]}: ${v}`}</title>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: compact ? 11 : 13, color: '#aaa', textAlign: 'center', marginTop: 2, letterSpacing: '0.2px' }}>
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
