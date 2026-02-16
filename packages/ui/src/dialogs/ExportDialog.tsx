import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';

type ExportFormat = 'gerber' | 'bom' | 'pdf' | 'svg' | 'pick-and-place';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, options: Record<string, any>) => void;
}

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
}

const FORMATS: FormatOption[] = [
  { id: 'gerber', label: 'Gerber (RS-274X)', description: 'Industry-standard PCB fabrication format' },
  { id: 'bom', label: 'Bill of Materials', description: 'CSV component list with references and values' },
  { id: 'pdf', label: 'PDF', description: 'Print-ready schematic or PCB layout' },
  { id: 'svg', label: 'SVG', description: 'Scalable vector graphics for documentation' },
  { id: 'pick-and-place', label: 'Pick & Place', description: 'Component placement data for assembly' },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose, onExport }) => {
  const { theme } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('gerber');
  const [outputDir, setOutputDir] = useState('./output');

  // Format-specific options
  const [gerberOptions, setGerberOptions] = useState({
    includeTopCopper: true,
    includeBottomCopper: true,
    includeSilkscreen: true,
    includeSolderMask: true,
    includeDrill: true,
    includeEdgeCuts: true,
    useProtel: true,
  });

  const [bomOptions, setBomOptions] = useState({
    groupByValue: true,
    includeRefDes: true,
    includeFootprint: true,
    includeQuantity: true,
    delimiter: 'comma' as 'comma' | 'tab' | 'semicolon',
  });

  const [pdfOptions, setPdfOptions] = useState({
    pageSize: 'A4' as 'A4' | 'A3' | 'Letter',
    orientation: 'landscape' as 'portrait' | 'landscape',
    includeTitle: true,
    includeBorder: true,
    scale: 1.0,
  });

  if (!open) return null;

  const checkboxStyle: React.CSSProperties = {
    accentColor: theme.colors.primary,
    marginRight: 8,
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: theme.colors.text,
    display: 'flex',
    alignItems: 'center',
    padding: '3px 0',
    cursor: 'pointer',
  };

  const selectStyle: React.CSSProperties = {
    padding: '4px 8px',
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 3,
    fontSize: 12,
    outline: 'none',
    fontFamily: theme.fonts.sans,
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
          width: 520,
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Export
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <Icon name="close" size={18} color={theme.colors.textSecondary} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* Format selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
              Output Format
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FORMATS.map((fmt) => (
                <label
                  key={fmt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 4,
                    backgroundColor:
                      selectedFormat === fmt.id ? theme.colors.surfaceHover : 'transparent',
                    border: `1px solid ${
                      selectedFormat === fmt.id ? theme.colors.primary : 'transparent'
                    }`,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="format"
                    checked={selectedFormat === fmt.id}
                    onChange={() => setSelectedFormat(fmt.id)}
                    style={{ accentColor: theme.colors.primary, marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: theme.colors.text, fontWeight: 500 }}>
                      {fmt.label}
                    </div>
                    <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                      {fmt.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format-specific options */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
              Options
            </div>

            {selectedFormat === 'gerber' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { key: 'includeTopCopper', label: 'Top Copper (F.Cu)' },
                  { key: 'includeBottomCopper', label: 'Bottom Copper (B.Cu)' },
                  { key: 'includeSilkscreen', label: 'Silkscreen' },
                  { key: 'includeSolderMask', label: 'Solder Mask' },
                  { key: 'includeDrill', label: 'Drill File (Excellon)' },
                  { key: 'includeEdgeCuts', label: 'Board Outline (Edge.Cuts)' },
                ].map((opt) => (
                  <label key={opt.key} style={labelStyle}>
                    <input
                      type="checkbox"
                      checked={(gerberOptions as any)[opt.key]}
                      onChange={(e) =>
                        setGerberOptions((prev) => ({
                          ...prev,
                          [opt.key]: e.target.checked,
                        }))
                      }
                      style={checkboxStyle}
                    />
                    {opt.label}
                  </label>
                ))}
                <label style={{ ...labelStyle, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={gerberOptions.useProtel}
                    onChange={(e) =>
                      setGerberOptions((prev) => ({ ...prev, useProtel: e.target.checked }))
                    }
                    style={checkboxStyle}
                  />
                  Use Protel filename extensions
                </label>
              </div>
            )}

            {selectedFormat === 'bom' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { key: 'groupByValue', label: 'Group by value' },
                  { key: 'includeRefDes', label: 'Include reference designators' },
                  { key: 'includeFootprint', label: 'Include footprints' },
                  { key: 'includeQuantity', label: 'Include quantity' },
                ].map((opt) => (
                  <label key={opt.key} style={labelStyle}>
                    <input
                      type="checkbox"
                      checked={(bomOptions as any)[opt.key]}
                      onChange={(e) =>
                        setBomOptions((prev) => ({
                          ...prev,
                          [opt.key]: e.target.checked,
                        }))
                      }
                      style={checkboxStyle}
                    />
                    {opt.label}
                  </label>
                ))}
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: theme.colors.text }}>Delimiter:</span>
                  <select
                    value={bomOptions.delimiter}
                    onChange={(e) =>
                      setBomOptions((prev) => ({
                        ...prev,
                        delimiter: e.target.value as any,
                      }))
                    }
                    style={selectStyle}
                  >
                    <option value="comma">Comma (,)</option>
                    <option value="tab">Tab</option>
                    <option value="semicolon">Semicolon (;)</option>
                  </select>
                </div>
              </div>
            )}

            {selectedFormat === 'pdf' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: theme.colors.text, minWidth: 90 }}>Page Size:</span>
                  <select
                    value={pdfOptions.pageSize}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({ ...prev, pageSize: e.target.value as any }))
                    }
                    style={selectStyle}
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="Letter">Letter</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: theme.colors.text, minWidth: 90 }}>Orientation:</span>
                  <select
                    value={pdfOptions.orientation}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({
                        ...prev,
                        orientation: e.target.value as any,
                      }))
                    }
                    style={selectStyle}
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
                <label style={labelStyle}>
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeTitle}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({ ...prev, includeTitle: e.target.checked }))
                    }
                    style={checkboxStyle}
                  />
                  Include title block
                </label>
                <label style={labelStyle}>
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeBorder}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({
                        ...prev,
                        includeBorder: e.target.checked,
                      }))
                    }
                    style={checkboxStyle}
                  />
                  Include border
                </label>
              </div>
            )}

            {selectedFormat === 'svg' && (
              <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                SVG output will include all visible layers in the current view.
              </div>
            )}

            {selectedFormat === 'pick-and-place' && (
              <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                Generates CSV with component reference, value, footprint, position (X, Y), side, and rotation.
              </div>
            )}
          </div>

          {/* Output directory */}
          <div>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: 600 }}>
              Output Directory
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 4,
                  fontSize: 12,
                  outline: 'none',
                  fontFamily: theme.fonts.mono,
                }}
              />
              <button
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 4,
                  backgroundColor: 'transparent',
                  color: theme.colors.text,
                  cursor: 'pointer',
                  fontFamily: theme.fonts.sans,
                }}
              >
                Browse...
              </button>
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
              const options: Record<string, any> =
                selectedFormat === 'gerber'
                  ? gerberOptions
                  : selectedFormat === 'bom'
                  ? bomOptions
                  : selectedFormat === 'pdf'
                  ? pdfOptions
                  : {};
              onExport(selectedFormat, { ...options, outputDir });
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
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name="export" size={14} color="#fff" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
