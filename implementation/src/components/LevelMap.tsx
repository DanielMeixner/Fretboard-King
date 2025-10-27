import React, { useEffect, useRef } from 'react';

interface LevelMapProps {
  currentLevel: number;
  maxLevel: number;
}

const LevelMap: React.FC<LevelMapProps> = ({ currentLevel, maxLevel }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate completed levels (all levels below current)
  const completedLevels = Array.from({ length: currentLevel }, (_, i) => i + 1).join(',');
  
  useEffect(() => {
    // Create and mount the web component
    if (mapContainerRef.current) {
      // Clear any existing content
      mapContainerRef.current.innerHTML = '';
      
      // Create the web component element
      const levelMapElement = document.createElement('game-level-map');
      levelMapElement.setAttribute('levels', String(maxLevel + 1));
      levelMapElement.setAttribute('current-level', String(currentLevel + 1));
      levelMapElement.setAttribute('completed-levels', completedLevels);
      levelMapElement.setAttribute('marker-size', '50');
      levelMapElement.setAttribute('spacing', '100');
      
      // Append to container
      mapContainerRef.current.appendChild(levelMapElement);
    }
  }, [currentLevel, maxLevel, completedLevels]);

  return (
    <div
      style={{
        background: 'var(--surface)',
        color: 'var(--on-surface)',
        borderRadius: 'var(--radius)',
        width: '100%',
        maxWidth: '1200px',
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
          color: 'var(--on-surface)',
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
      <p
        style={{
          textAlign: 'center',
          color: '#888',
          fontSize: 14,
          marginBottom: 24,
        }}
      >
        Total Levels Available: <strong>{maxLevel + 1}</strong> (Levels 0-{maxLevel})
      </p>

      {/* Game Level Map Web Component Container */}
      <div ref={mapContainerRef} style={{ width: '100%', overflow: 'auto' }} />
      
      {/* Info text */}
      <div
        style={{
          marginTop: 24,
          textAlign: 'center',
          fontSize: 14,
          color: 'var(--on-surface)',
        }}
      >
        <p style={{ margin: '8px 0' }}>
          Complete rounds with at least 12/15 correct answers to unlock the next level!
        </p>
      </div>
    </div>
  );
};

export default LevelMap;
