import React, { useState, useCallback } from 'react';
import { useAppStore } from '../store/app-store';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';

interface PCBLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

const DEFAULT_LAYERS: PCBLayer[] = [
  { id: 'f-cu', name: 'F.Cu', color: '#ff3333', visible: true },
  { id: 'b-cu', name: 'B.Cu', color: '#3333ff', visible: true },
  { id: 'f-silks', name: 'F.SilkS', color: '#cccc00', visible: true },
  { id: 'b-silks', name: 'B.SilkS', color: '#cc00cc', visible: true },
  { id: 'f-mask', name: 'F.Mask', color: '#990044', visible: true },
  { id: 'b-mask', name: 'B.Mask', color: '#004499', visible: true },
  { id: 'f-paste', name: 'F.Paste', color: '#dd6666', visible: false },
  { id: 'b-paste', name: 'B.Paste', color: '#6666dd', visible: false },
  { id: 'f-courtyard', name: 'F.CrtYd', color: '#888888', visible: true },
  { id: 'b-courtyard', name: 'B.CrtYd', color: '#777777', visible: false },
  { id: 'edge-cuts', name: 'Edge.Cuts', color: '#cccc00', visible: true },
  { id: 'dwgs-user', name: 'Dwgs.User', color: '#999999', visible: true },
  { id: 'cmts-user', name: 'Cmts.User', color: '#666666', visible: false },
  { id: 'in1-cu', name: 'In1.Cu', color: '#cc6600', visible: false },
  { id: 'in2-cu', name: 'In2.Cu', color: '#00cc66', visible: false },
];

export const LayerPanel: React.FC = () => {
  const { theme } = useTheme();
  const activeLayer = useAppStore((s) => s.activeLayer);
  const setActiveLayer = useAppStore((s) => s.setActiveLayer);

  const [layers, setLayers] = useState<PCBLayer[]>(DEFAULT_LAYERS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const toggleVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    setLayers((prev) => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, dragged);
      return updated;
    });
    setDragIndex(index);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.surface,
        borderLeft: `1px solid ${theme.colors.border}`,
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
        Layers
      </div>

      {/* Layer list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {layers.map((layer, index) => {
          const isActive = layer.name === activeLayer;
          return (
            <div
              key={layer.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => setActiveLayer(layer.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                cursor: 'pointer',
                backgroundColor: isActive ? theme.colors.surfaceHover : 'transparent',
                borderLeft: isActive ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    theme.colors.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              {/* Drag handle */}
              <Icon name="drag" size={12} color={theme.colors.textSecondary} />

              {/* Color swatch */}
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 2,
                  backgroundColor: layer.color,
                  border: `1px solid ${theme.colors.border}`,
                  flexShrink: 0,
                }}
              />

              {/* Layer name */}
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: layer.visible ? theme.colors.text : theme.colors.textSecondary,
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: layer.visible ? 'none' : 'line-through',
                  fontFamily: theme.fonts.mono,
                }}
              >
                {layer.name}
              </span>

              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(layer.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon
                  name={layer.visible ? 'eye' : 'eye-off'}
                  size={14}
                  color={layer.visible ? theme.colors.text : theme.colors.textSecondary}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel;
