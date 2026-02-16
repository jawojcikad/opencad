import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';

interface LibraryComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  symbolPreview: string; // placeholder for SVG path
  footprint: string;
}

const SAMPLE_COMPONENTS: LibraryComponent[] = [
  { id: 'r1', name: 'Resistor', category: 'Passive', description: 'Standard resistor', symbolPreview: 'R', footprint: '0402 / 0603 / 0805' },
  { id: 'c1', name: 'Capacitor', category: 'Passive', description: 'Standard capacitor', symbolPreview: 'C', footprint: '0402 / 0603 / 0805' },
  { id: 'l1', name: 'Inductor', category: 'Passive', description: 'Standard inductor', symbolPreview: 'L', footprint: '0603 / 0805 / 1206' },
  { id: 'd1', name: 'Diode', category: 'Semiconductor', description: 'General purpose diode', symbolPreview: 'D', footprint: 'SOD-123' },
  { id: 'led1', name: 'LED', category: 'Semiconductor', description: 'Light emitting diode', symbolPreview: 'LED', footprint: '0603 / 0805' },
  { id: 'q1', name: 'NPN Transistor', category: 'Semiconductor', description: 'NPN BJT', symbolPreview: 'Q', footprint: 'SOT-23' },
  { id: 'q2', name: 'PNP Transistor', category: 'Semiconductor', description: 'PNP BJT', symbolPreview: 'Q', footprint: 'SOT-23' },
  { id: 'q3', name: 'N-MOSFET', category: 'Semiconductor', description: 'N-Channel MOSFET', symbolPreview: 'M', footprint: 'SOT-23 / DPAK' },
  { id: 'u1', name: '74HC00', category: 'Logic', description: 'Quad 2-input NAND gate', symbolPreview: 'U', footprint: 'SOIC-14 / DIP-14' },
  { id: 'u2', name: '74HC04', category: 'Logic', description: 'Hex Inverter', symbolPreview: 'U', footprint: 'SOIC-14 / DIP-14' },
  { id: 'u3', name: 'ATmega328', category: 'Microcontroller', description: 'AVR 8-bit MCU', symbolPreview: 'U', footprint: 'TQFP-32 / DIP-28' },
  { id: 'u4', name: 'STM32F103', category: 'Microcontroller', description: 'ARM Cortex-M3 MCU', symbolPreview: 'U', footprint: 'LQFP-48' },
  { id: 'u5', name: 'LM7805', category: 'Power', description: '5V voltage regulator', symbolPreview: 'U', footprint: 'TO-220' },
  { id: 'u6', name: 'AMS1117-3.3', category: 'Power', description: '3.3V LDO regulator', symbolPreview: 'U', footprint: 'SOT-223' },
  { id: 'j1', name: 'USB-C Connector', category: 'Connector', description: 'USB Type-C receptacle', symbolPreview: 'J', footprint: 'USB-C-SMD' },
  { id: 'j2', name: 'Pin Header 1x10', category: 'Connector', description: '10-pin header', symbolPreview: 'J', footprint: '2.54mm pitch' },
  { id: 'sw1', name: 'Tactile Switch', category: 'Mechanical', description: 'Push button', symbolPreview: 'SW', footprint: '6x6mm' },
  { id: 'y1', name: 'Crystal 8MHz', category: 'Passive', description: 'Quartz crystal', symbolPreview: 'Y', footprint: 'HC-49' },
];

type ViewMode = 'grid' | 'list';

export const LibraryPanel: React.FC = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<LibraryComponent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const categories = useMemo(() => {
    const cats = new Set(SAMPLE_COMPONENTS.map((c) => c.category));
    return Array.from(cats).sort();
  }, []);

  const filteredComponents = useMemo(() => {
    return SAMPLE_COMPONENTS.filter((comp) => {
      const matchesCategory = !selectedCategory || comp.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, component: LibraryComponent) => {
      e.dataTransfer.setData('application/opencad-component', JSON.stringify(component));
      e.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Library</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              background: viewMode === 'grid' ? theme.colors.primary : 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              borderRadius: 3,
            }}
          >
            <Icon name="grid" size={14} color={viewMode === 'grid' ? '#fff' : theme.colors.textSecondary} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              background: viewMode === 'list' ? theme.colors.primary : 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              borderRadius: 3,
            }}
          >
            <Icon name="component" size={14} color={viewMode === 'list' ? '#fff' : theme.colors.textSecondary} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.colors.border}` }}>
        <div style={{ position: 'relative' }}>
          <Icon
            name="search"
            size={14}
            color={theme.colors.textSecondary}
            style={{ position: 'absolute', left: 8, top: 7 }}
          />
          <input
            type="text"
            placeholder="Search components..."
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
      </div>

      {/* Category tree */}
      <div
        style={{
          padding: '4px 0',
          borderBottom: `1px solid ${theme.colors.border}`,
          flexShrink: 0,
        }}
      >
        <div
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            cursor: 'pointer',
            color: selectedCategory === null ? theme.colors.primary : theme.colors.text,
            fontWeight: selectedCategory === null ? 600 : 400,
            backgroundColor: selectedCategory === null ? theme.colors.surfaceHover : 'transparent',
          }}
        >
          All Components ({SAMPLE_COMPONENTS.length})
        </div>
        {categories.map((cat) => {
          const count = SAMPLE_COMPONENTS.filter((c) => c.category === cat).length;
          const isActive = selectedCategory === cat;
          return (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '4px 12px 4px 24px',
                fontSize: 12,
                cursor: 'pointer',
                color: isActive ? theme.colors.primary : theme.colors.text,
                fontWeight: isActive ? 600 : 400,
                backgroundColor: isActive ? theme.colors.surfaceHover : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon name="chevron-right" size={10} color={theme.colors.textSecondary} />
              {cat}
              <span style={{ color: theme.colors.textSecondary, marginLeft: 'auto' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Component list/grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {viewMode === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: 6,
            }}
          >
            {filteredComponents.map((comp) => (
              <div
                key={comp.id}
                draggable
                onDragStart={(e) => handleDragStart(e, comp)}
                onClick={() => setSelectedComponent(comp)}
                style={{
                  padding: 8,
                  backgroundColor:
                    selectedComponent?.id === comp.id
                      ? theme.colors.surfaceHover
                      : theme.colors.background,
                  border: `1px solid ${
                    selectedComponent?.id === comp.id ? theme.colors.primary : theme.colors.border
                  }`,
                  borderRadius: 4,
                  cursor: 'grab',
                  textAlign: 'center',
                  transition: 'border-color 0.1s',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    color: theme.colors.primary,
                    fontFamily: theme.fonts.mono,
                  }}
                >
                  {comp.symbolPreview}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.colors.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 4,
                  }}
                >
                  {comp.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredComponents.map((comp) => (
              <div
                key={comp.id}
                draggable
                onDragStart={(e) => handleDragStart(e, comp)}
                onClick={() => setSelectedComponent(comp)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px',
                  cursor: 'grab',
                  borderRadius: 3,
                  backgroundColor:
                    selectedComponent?.id === comp.id ? theme.colors.surfaceHover : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  if (selectedComponent?.id !== comp.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span
                  style={{
                    width: 28,
                    textAlign: 'center',
                    fontWeight: 700,
                    color: theme.colors.primary,
                    fontFamily: theme.fonts.mono,
                    fontSize: 13,
                  }}
                >
                  {comp.symbolPreview}
                </span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, color: theme.colors.text }}>{comp.name}</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: theme.colors.textSecondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {comp.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {selectedComponent && (
        <div
          style={{
            borderTop: `1px solid ${theme.colors.border}`,
            padding: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.text }}>
            {selectedComponent.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: theme.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {selectedComponent.description}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 8,
            }}
          >
            {/* Symbol preview box */}
            <div
              style={{
                flex: 1,
                height: 60,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: theme.colors.primary, fontFamily: theme.fonts.mono }}>
                {selectedComponent.symbolPreview}
              </span>
              <span style={{ fontSize: 9, color: theme.colors.textSecondary }}>Symbol</span>
            </div>
            {/* Footprint preview box */}
            <div
              style={{
                flex: 1,
                height: 60,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 10, color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>
                {selectedComponent.footprint}
              </span>
              <span style={{ fontSize: 9, color: theme.colors.textSecondary }}>Footprint</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPanel;
