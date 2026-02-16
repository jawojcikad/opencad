import React, { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  tooltip?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, style }) => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: `2px solid ${theme.colors.border}`,
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.tooltip ?? tab.label}
            aria-label={tab.tooltip ?? tab.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              border: 'none',
              borderBottom: isActive ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
              marginBottom: -2,
              background: isActive ? theme.colors.surfaceHover : 'transparent',
              color: isActive ? theme.colors.text : theme.colors.textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: theme.fonts.sans,
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  theme.colors.surfaceHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
