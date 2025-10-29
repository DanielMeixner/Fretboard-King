import React, { useEffect, useRef } from 'react';

interface LevelMapProps {
  currentLevel: number;
  maxLevel: number;
}

const LevelMap: React.FC<LevelMapProps> = ({ currentLevel, maxLevel }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Create and mount the web component
    if (mapContainerRef.current) {
      // Clear any existing content
      mapContainerRef.current.innerHTML = '';
      
      // Calculate completed levels: all levels from 1 to currentLevel (0-based to 1-based conversion)
      // If currentLevel is 0, no levels are completed
      // If currentLevel is 5, levels 1-5 are completed, and level 6 is current
      const completedLevels = currentLevel > 0 
        ? Array.from({ length: currentLevel }, (_, i) => i + 1).join(',')
        : '';
      
      // Calculate repetition levels (every 3rd level: 3, 6, 9, 12, 15, 18, 21, 24, 27)
      // This corresponds to 0-based levels 2, 5, 8, 11, 14, 17, 20, 23, 26
      const repetitionLevels = [];
      for (let i = 3; i <= maxLevel + 1; i += 3) {
        repetitionLevels.push(i);
      }
      
      // Define sections for level grouping
      // Each section contains 2 regular levels + 1 repetition level (3 total)
      const sections = [
        { name: 'Foundation', levels: '1-3', color: '#B3E5FC' },      // Light Blue
        { name: 'Elementary', levels: '4-6', color: '#C8E6C9' },      // Light Green
        { name: 'Intermediate', levels: '7-9', color: '#FFF9C4' },    // Light Yellow
        { name: 'Advanced', levels: '10-12', color: '#FFCCBC' },      // Light Orange
        { name: 'Expert', levels: '13-15', color: '#F8BBD0' },        // Light Pink
        { name: 'Master I', levels: '16-18', color: '#E1BEE7' },      // Light Purple
        { name: 'Master II', levels: '19-21', color: '#D1C4E9' },     // Light Indigo
        { name: 'Master III', levels: '22-24', color: '#C5CAE9' },    // Light Blue-Grey
        { name: 'Grand Master', levels: '25-27', color: '#B2DFDB' },  // Light Teal
      ];
      
      // Create the web component element
      const levelMapElement = document.createElement('game-level-map');
      levelMapElement.setAttribute('levels', String(maxLevel + 1));
      levelMapElement.setAttribute('current-level', String(currentLevel + 1)); // Convert 0-based to 1-based
      levelMapElement.setAttribute('completed-levels', completedLevels);
      levelMapElement.setAttribute('repetition-levels', repetitionLevels.join(','));
      levelMapElement.setAttribute('sections', JSON.stringify(sections));
      levelMapElement.setAttribute('marker-size', '50');
      levelMapElement.setAttribute('spacing', '100');
      levelMapElement.setAttribute('height', '250');
      
      // Append to container
      mapContainerRef.current.appendChild(levelMapElement);
    }
  }, [currentLevel, maxLevel]);

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
      <div ref={mapContainerRef} style={{ width: '100%', overflow: 'visible' }} />
      
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
        <p style={{ margin: '8px 0', color: '#FF6B6B', fontWeight: 600 }}>
          🔄 Repetition levels (every 3rd level, marked with dashed borders) test the previous 2 levels!
        </p>
        <p style={{ margin: '8px 0', color: '#888', fontSize: 12 }}>
          Tip: Scroll horizontally to see all levels
        </p>
      </div>
    </div>
  );
};

export default LevelMap;
