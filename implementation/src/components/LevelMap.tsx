import React from 'react';

interface LevelMapProps {
  currentLevel: number;
  maxLevel: number;
}

const LevelMap: React.FC<LevelMapProps> = ({ currentLevel, maxLevel }) => {
  // Create an array of all levels (0 to maxLevel)
  const levels = Array.from({ length: maxLevel + 1 }, (_, i) => i);

  // Calculate grid layout - 4 columns for better visual flow
  const columns = 4;

  return (
    <div
      style={{
        background: 'var(--surface)',
        color: 'var(--on-surface)',
        borderRadius: 'var(--radius)',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '32px',
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* Header */}
      <h2
        style={{
          marginTop: 0,
          marginBottom: 8,
          color: 'var(--on-primary)',
          fontWeight: 600,
          fontSize: 28,
          textAlign: 'center',
        }}
      >
        🗺️ Level Map
      </h2>
      <p
        style={{
          textAlign: 'center',
          color: 'var(--on-surface)',
          fontSize: 16,
          marginBottom: 32,
        }}
      >
        Your Progress: Level <strong style={{ color: 'var(--primary)' }}>{currentLevel}</strong> / {maxLevel}
      </p>

      {/* Level Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '16px',
          marginBottom: 24,
        }}
      >
        {levels.map((level) => {
          const isCompleted = level < currentLevel;
          const isCurrent = level === currentLevel;
          const isLocked = level > currentLevel;

          return (
            <div
              key={level}
              style={{
                position: 'relative',
                aspectRatio: '1',
                background: isCompleted
                  ? 'var(--secondary)'
                  : isCurrent
                  ? 'var(--primary)'
                  : 'var(--surface-variant)',
                border: `2px solid ${
                  isCompleted
                    ? 'var(--secondary)'
                    : isCurrent
                    ? 'var(--primary)'
                    : 'var(--border)'
                }`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default',
                transition: 'all 0.2s',
                boxShadow: isCurrent ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              {/* Level Number */}
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: isCompleted || isCurrent ? 'var(--on-primary)' : 'var(--on-surface)',
                }}
              >
                {level}
              </div>

              {/* Status Icon */}
              <div
                style={{
                  fontSize: 20,
                  marginTop: 4,
                }}
              >
                {isCompleted ? '✓' : isCurrent ? '👑' : '🔒'}
              </div>

              {/* Current indicator */}
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -8,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Current
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          flexWrap: 'wrap',
          fontSize: 14,
          color: 'var(--on-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 16,
              height: 16,
              background: 'var(--secondary)',
              borderRadius: '4px',
              display: 'inline-block',
            }}
          />
          <span>Completed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 16,
              height: 16,
              background: 'var(--primary)',
              borderRadius: '4px',
              display: 'inline-block',
            }}
          />
          <span>Current Level</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 16,
              height: 16,
              background: 'var(--surface-variant)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              display: 'inline-block',
            }}
          />
          <span>Locked</span>
        </div>
      </div>
    </div>
  );
};

export default LevelMap;
