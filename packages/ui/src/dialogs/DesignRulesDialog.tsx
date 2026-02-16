import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';

interface DesignRulesDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (rules: DesignRules) => void;
}

interface NetClassRule {
  name: string;
  clearance: number;
  trackWidth: number;
  viaDiameter: number;
  viaDrill: number;
}

interface DesignRules {
  minClearance: number;
  minTrackWidth: number;
  minViaDiameter: number;
  minViaDrill: number;
  minHoleDiameter: number;
  copperToEdge: number;
  netClasses: NetClassRule[];
}

const DEFAULT_RULES: DesignRules = {
  minClearance: 0.2,
  minTrackWidth: 0.15,
  minViaDiameter: 0.6,
  minViaDrill: 0.3,
  minHoleDiameter: 0.3,
  copperToEdge: 0.3,
  netClasses: [
    { name: 'Default', clearance: 0.2, trackWidth: 0.25, viaDiameter: 0.6, viaDrill: 0.3 },
    { name: 'Power', clearance: 0.3, trackWidth: 0.5, viaDiameter: 0.8, viaDrill: 0.4 },
    { name: 'Signal', clearance: 0.2, trackWidth: 0.15, viaDiameter: 0.6, viaDrill: 0.3 },
  ],
};

export const DesignRulesDialog: React.FC<DesignRulesDialogProps> = ({ open, onClose, onSave }) => {
  const { theme } = useTheme();
  const [rules, setRules] = useState<DesignRules>(DEFAULT_RULES);

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width: 80,
    padding: '4px 6px',
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 3,
    fontSize: 12,
    fontFamily: theme.fonts.mono,
    textAlign: 'right',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: theme.colors.text,
    minWidth: 140,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 0',
  };

  const updateRule = (key: keyof Omit<DesignRules, 'netClasses'>, value: string) => {
    setRules((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const updateNetClass = (index: number, key: keyof NetClassRule, value: string) => {
    setRules((prev) => ({
      ...prev,
      netClasses: prev.netClasses.map((nc, i) =>
        i === index
          ? { ...nc, [key]: key === 'name' ? value : parseFloat(value) || 0 }
          : nc
      ),
    }));
  };

  const addNetClass = () => {
    setRules((prev) => ({
      ...prev,
      netClasses: [
        ...prev.netClasses,
        { name: `Class ${prev.netClasses.length}`, clearance: 0.2, trackWidth: 0.25, viaDiameter: 0.6, viaDrill: 0.3 },
      ],
    }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 8,
          width: 560,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Title */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
            fontSize: 16,
            fontWeight: 600,
            color: theme.colors.text,
          }}
        >
          Design Rules
        </div>

        {/* Content */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* Global rules */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: theme.colors.textSecondary,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Global Constraints
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Min Clearance</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  step="0.01"
                  value={rules.minClearance}
                  onChange={(e) => updateRule('minClearance', e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>mm</span>
              </div>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Min Track Width</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  step="0.01"
                  value={rules.minTrackWidth}
                  onChange={(e) => updateRule('minTrackWidth', e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>mm</span>
              </div>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Min Via Diameter</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  step="0.01"
                  value={rules.minViaDiameter}
                  onChange={(e) => updateRule('minViaDiameter', e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>mm</span>
              </div>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Min Via Drill</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  step="0.01"
                  value={rules.minViaDrill}
                  onChange={(e) => updateRule('minViaDrill', e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>mm</span>
              </div>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Min Hole Diameter</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  step="0.01"
                  value={rules.minHoleDiameter}
                  onChange={(e) => updateRule('minHoleDiameter', e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>mm</span>
              </div>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Copper to Edge</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  step="0.01"
                  value={rules.copperToEdge}
                  onChange={(e) => updateRule('copperToEdge', e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>mm</span>
              </div>
            </div>
          </div>

          {/* Net class rules */}
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: theme.colors.textSecondary,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              Net Class Rules
              <button
                onClick={addNetClass}
                style={{
                  padding: '3px 10px',
                  fontSize: 11,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 3,
                  backgroundColor: 'transparent',
                  color: theme.colors.primary,
                  cursor: 'pointer',
                }}
              >
                + Add Class
              </button>
            </div>

            <div
              style={{
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 70px 70px 70px 70px',
                  gap: 4,
                  padding: '6px 8px',
                  fontSize: 10,
                  color: theme.colors.textSecondary,
                  textTransform: 'uppercase',
                  backgroundColor: theme.colors.background,
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >
                <span>Class</span>
                <span>Clear.</span>
                <span>Track W.</span>
                <span>Via Dia.</span>
                <span>Via Drill</span>
              </div>

              {rules.netClasses.map((nc, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 70px 70px 70px 70px',
                    gap: 4,
                    padding: '4px 8px',
                    borderBottom:
                      i < rules.netClasses.length - 1
                        ? `1px solid ${theme.colors.border}`
                        : 'none',
                  }}
                >
                  <input
                    type="text"
                    value={nc.name}
                    onChange={(e) => updateNetClass(i, 'name', e.target.value)}
                    style={{ ...inputStyle, width: '100%', textAlign: 'left' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={nc.clearance}
                    onChange={(e) => updateNetClass(i, 'clearance', e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={nc.trackWidth}
                    onChange={(e) => updateNetClass(i, 'trackWidth', e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={nc.viaDiameter}
                    onChange={(e) => updateNetClass(i, 'viaDiameter', e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={nc.viaDrill}
                    onChange={(e) => updateNetClass(i, 'viaDrill', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 20px',
              fontSize: 13,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
              backgroundColor: 'transparent',
              color: theme.colors.text,
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(rules);
              onClose();
            }}
            style={{
              padding: '6px 20px',
              fontSize: 13,
              border: 'none',
              borderRadius: 4,
              backgroundColor: theme.colors.primary,
              color: '#fff',
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignRulesDialog;
