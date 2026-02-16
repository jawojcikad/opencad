import React, { useState, useMemo } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';

interface Net {
  id: string;
  name: string;
  pinCount: number;
  routed: boolean;
  partiallyRouted: boolean;
}

const SAMPLE_NETS: Net[] = [
  { id: 'n1', name: 'VCC', pinCount: 12, routed: true, partiallyRouted: false },
  { id: 'n2', name: 'GND', pinCount: 18, routed: true, partiallyRouted: false },
  { id: 'n3', name: '3V3', pinCount: 6, routed: true, partiallyRouted: false },
  { id: 'n4', name: 'SDA', pinCount: 4, routed: true, partiallyRouted: false },
  { id: 'n5', name: 'SCL', pinCount: 4, routed: true, partiallyRouted: false },
  { id: 'n6', name: 'MOSI', pinCount: 3, routed: false, partiallyRouted: true },
  { id: 'n7', name: 'MISO', pinCount: 3, routed: false, partiallyRouted: true },
  { id: 'n8', name: 'SCK', pinCount: 3, routed: false, partiallyRouted: false },
  { id: 'n9', name: 'CS', pinCount: 2, routed: false, partiallyRouted: false },
  { id: 'n10', name: 'TX', pinCount: 2, routed: true, partiallyRouted: false },
  { id: 'n11', name: 'RX', pinCount: 2, routed: true, partiallyRouted: false },
  { id: 'n12', name: 'RESET', pinCount: 3, routed: false, partiallyRouted: false },
  { id: 'n13', name: 'D0', pinCount: 2, routed: false, partiallyRouted: false },
  { id: 'n14', name: 'D1', pinCount: 2, routed: false, partiallyRouted: false },
  { id: 'n15', name: 'A0', pinCount: 2, routed: true, partiallyRouted: false },
];

export const NetInspectorPanel: React.FC = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNet, setHighlightedNet] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'routed' | 'unrouted'>('all');

  const filteredNets = useMemo(() => {
    return SAMPLE_NETS.filter((net) => {
      const matchesSearch =
        !searchQuery || net.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterMode === 'all' ||
        (filterMode === 'routed' && net.routed) ||
        (filterMode === 'unrouted' && !net.routed);
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterMode]);

  const stats = useMemo(() => {
    const total = SAMPLE_NETS.length;
    const routed = SAMPLE_NETS.filter((n) => n.routed).length;
    return { total, routed, unrouted: total - routed };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.surface,
        borderRight: `1px solid ${theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${theme.colors.border}`,
          fontSize: 12,
          fontWeight: 600,
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Net Inspector
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '6px 12px',
          borderBottom: `1px solid ${theme.colors.border}`,
          fontSize: 11,
        }}
      >
        <span style={{ color: theme.colors.text }}>
          Total: <strong>{stats.total}</strong>
        </span>
        <span style={{ color: theme.colors.success }}>
          Routed: <strong>{stats.routed}</strong>
        </span>
        <span style={{ color: theme.colors.warning }}>
          Unrouted: <strong>{stats.unrouted}</strong>
        </span>
      </div>

      {/* Search & Filter */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.colors.border}` }}>
        <div style={{ position: 'relative', marginBottom: 6 }}>
          <Icon
            name="search"
            size={14}
            color={theme.colors.textSecondary}
            style={{ position: 'absolute', left: 8, top: 7 }}
          />
          <input
            type="text"
            placeholder="Filter nets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px 6px 28px',
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: theme.fonts.sans,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'routed', 'unrouted'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                padding: '3px 8px',
                fontSize: 11,
                border: `1px solid ${filterMode === mode ? theme.colors.primary : theme.colors.border}`,
                borderRadius: 3,
                backgroundColor: filterMode === mode ? theme.colors.primary : 'transparent',
                color: filterMode === mode ? '#fff' : theme.colors.textSecondary,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Net list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Column header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 70px',
            padding: '4px 12px',
            fontSize: 10,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            borderBottom: `1px solid ${theme.colors.border}`,
            position: 'sticky',
            top: 0,
            backgroundColor: theme.colors.surface,
          }}
        >
          <span>Net</span>
          <span style={{ textAlign: 'center' }}>Pins</span>
          <span style={{ textAlign: 'center' }}>Status</span>
        </div>

        {filteredNets.map((net) => (
          <div
            key={net.id}
            onClick={() => setHighlightedNet(net.id === highlightedNet ? null : net.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 60px 70px',
              padding: '5px 12px',
              cursor: 'pointer',
              backgroundColor: highlightedNet === net.id ? theme.colors.surfaceHover : 'transparent',
              borderLeft:
                highlightedNet === net.id
                  ? `3px solid ${theme.colors.primary}`
                  : '3px solid transparent',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={(e) => {
              if (highlightedNet !== net.id)
                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
            }}
            onMouseLeave={(e) => {
              if (highlightedNet !== net.id)
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: theme.colors.text,
                fontFamily: theme.fonts.mono,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {net.name}
            </span>
            <span
              style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {net.pinCount}
            </span>
            <span
              style={{
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {net.routed ? (
                <>
                  <Icon name="check" size={12} color={theme.colors.success} />
                  <span style={{ fontSize: 10, color: theme.colors.success }}>Routed</span>
                </>
              ) : net.partiallyRouted ? (
                <>
                  <Icon name="warning" size={12} color={theme.colors.warning} />
                  <span style={{ fontSize: 10, color: theme.colors.warning }}>Partial</span>
                </>
              ) : (
                <>
                  <Icon name="close" size={12} color={theme.colors.error} />
                  <span style={{ fontSize: 10, color: theme.colors.error }}>Open</span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetInspectorPanel;
