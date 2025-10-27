import React from 'react';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ id: string; label: string; icon?: string }>;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        padding: '0 16px',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === tab.id ? 'var(--on-primary)' : 'var(--on-surface)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontWeight: activeTab === tab.id ? 600 : 400,
            boxShadow: activeTab === tab.id ? 'var(--shadow)' : 'none',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onMouseOver={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.background = 'var(--surface-variant)';
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.background = 'var(--surface)';
            }
          }}
        >
          {tab.icon && <span role="img" aria-label={tab.label}>{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;
