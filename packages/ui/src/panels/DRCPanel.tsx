import React, { useMemo } from 'react';
import { useAppStore } from '../store/app-store';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';

interface Violation {
  id: string;
  severity: 'error' | 'warning' | 'info';
  type: string;
  message: string;
  location: { x: number; y: number };
  items?: string[];
}

const SAMPLE_VIOLATIONS: Violation[] = [
  {
    id: 'v1',
    severity: 'error',
    type: 'clearance',
    message: 'Clearance violation between track and pad (0.15mm < 0.20mm)',
    location: { x: 32.5, y: 48.2 },
    items: ['Track on F.Cu', 'Pad U1-3'],
  },
  {
    id: 'v2',
    severity: 'error',
    type: 'short',
    message: 'Short circuit between nets VCC and GND',
    location: { x: 45.0, y: 22.5 },
    items: ['Via at (45.0, 22.5)', 'Zone GND'],
  },
  {
    id: 'v3',
    severity: 'warning',
    type: 'width',
    message: 'Track width below minimum (0.10mm < 0.15mm)',
    location: { x: 18.3, y: 55.1 },
    items: ['Track on B.Cu'],
  },
  {
    id: 'v4',
    severity: 'warning',
    type: 'unconnected',
    message: 'Unconnected net: RESET (2 pads)',
    location: { x: 60.0, y: 35.0 },
    items: ['R3-1', 'U1-14'],
  },
  {
    id: 'v5',
    severity: 'info',
    type: 'courtyard',
    message: 'Courtyard overlap between C1 and C2',
    location: { x: 28.0, y: 40.0 },
    items: ['C1 F.CrtYd', 'C2 F.CrtYd'],
  },
];

export const DRCPanel: React.FC = () => {
  const { theme } = useTheme();
  const violations = useAppStore((s) => s.violations);
  const setViolations = useAppStore((s) => s.setViolations);
  const mode = useAppStore((s) => s.mode);

  const displayViolations = violations.length > 0 ? violations : SAMPLE_VIOLATIONS;

  const stats = useMemo(() => {
    const errors = displayViolations.filter((v: Violation) => v.severity === 'error').length;
    const warnings = displayViolations.filter((v: Violation) => v.severity === 'warning').length;
    const infos = displayViolations.filter((v: Violation) => v.severity === 'info').length;
    return { errors, warnings, infos, total: displayViolations.length };
  }, [displayViolations]);

  const severityIcon = (severity: Violation['severity']) => {
    switch (severity) {
      case 'error':
        return <Icon name="error" size={14} color={theme.colors.error} />;
      case 'warning':
        return <Icon name="warning" size={14} color={theme.colors.warning} />;
      case 'info':
        return <Icon name="info" size={14} color={theme.colors.primary} />;
    }
  };

  const handleZoomToViolation = (violation: Violation) => {
    // In a real app, this would tell the editor to pan/zoom to the location
    console.log('Zoom to violation:', violation.location);
  };

  const handleRunCheck = () => {
    // In a real app, trigger DRC or ERC
    setViolations(SAMPLE_VIOLATIONS);
  };

  const handleClear = () => {
    setViolations([]);
  };

  const title = mode === 'schematic' ? 'ERC Results' : 'DRC Results';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.surface,
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {title}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleRunCheck}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              border: `1px solid ${theme.colors.primary}`,
              borderRadius: 3,
              backgroundColor: theme.colors.primary,
              color: '#fff',
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
            }}
          >
            {mode === 'schematic' ? 'Run ERC' : 'Run DRC'}
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 3,
              backgroundColor: 'transparent',
              color: theme.colors.textSecondary,
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '6px 12px',
          borderBottom: `1px solid ${theme.colors.border}`,
          fontSize: 11,
        }}
      >
        <span style={{ color: theme.colors.error, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="error" size={12} color={theme.colors.error} />
          {stats.errors} Errors
        </span>
        <span style={{ color: theme.colors.warning, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="warning" size={12} color={theme.colors.warning} />
          {stats.warnings} Warnings
        </span>
        <span style={{ color: theme.colors.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="info" size={12} color={theme.colors.primary} />
          {stats.infos} Info
        </span>
      </div>

      {/* Violation list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayViolations.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 32,
              color: theme.colors.success,
              fontSize: 13,
            }}
          >
            <Icon name="check" size={32} color={theme.colors.success} />
            <div style={{ marginTop: 12 }}>No violations found.</div>
            <div style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 }}>
              Design passes all checks.
            </div>
          </div>
        ) : (
          displayViolations.map((violation: Violation) => (
            <div
              key={violation.id}
              onClick={() => handleZoomToViolation(violation)}
              style={{
                display: 'flex',
                gap: 8,
                padding: '8px 12px',
                borderBottom: `1px solid ${theme.colors.border}`,
                cursor: 'pointer',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ flexShrink: 0, paddingTop: 2 }}>
                {severityIcon(violation.severity)}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, color: theme.colors.text, marginBottom: 2 }}>
                  {violation.message}
                </div>
                {violation.items && (
                  <div style={{ fontSize: 10, color: theme.colors.textSecondary }}>
                    {violation.items.join(' ↔ ')}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 10,
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fonts.mono,
                    marginTop: 2,
                  }}
                >
                  ({violation.location.x.toFixed(2)}, {violation.location.y.toFixed(2)}) mm
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DRCPanel;
