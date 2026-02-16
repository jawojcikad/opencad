import React, { useMemo } from 'react';
import { useAppStore } from '../store/app-store';
import { useTheme } from '../theme/ThemeProvider';

interface PropertyField {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  readOnly?: boolean;
}

/* ── Helpers to find elements by id in the raw document structures ─── */

function findPCBElement(doc: any, id: string): { kind: string; data: any } | null {
  if (!doc) return null;
  for (const fp of doc.footprints ?? []) {
    if (fp.id === id) return { kind: 'footprint', data: fp };
  }
  for (const t of doc.tracks ?? []) {
    if (t.id === id) return { kind: 'track', data: t };
  }
  for (const v of doc.vias ?? []) {
    if (v.id === id) return { kind: 'via', data: v };
  }
  return null;
}

function findSchematicElement(doc: any, id: string): { kind: string; data: any } | null {
  if (!doc) return null;
  for (const sheet of doc.sheets ?? []) {
    for (const comp of sheet.components ?? []) {
      if (comp.id === id) return { kind: 'component', data: comp };
    }
    for (const wire of sheet.wires ?? []) {
      if (wire.id === id) return { kind: 'wire', data: wire };
    }
    for (const label of sheet.netLabels ?? []) {
      if (label.id === id) return { kind: 'label', data: label };
    }
  }
  return null;
}

function propsForPCBFootprint(fp: any): PropertyField[] {
  return [
    { key: 'reference', label: 'Reference', value: fp.reference ?? fp.name ?? '', type: 'text', readOnly: true },
    { key: 'value', label: 'Value', value: fp.value ?? '', type: 'text', readOnly: true },
    { key: 'footprint', label: 'Footprint', value: fp.footprintName ?? fp.name ?? '', type: 'text', readOnly: true },
    { key: 'x', label: 'Position X (mm)', value: String(fp.position?.x ?? 0), type: 'number', readOnly: true },
    { key: 'y', label: 'Position Y (mm)', value: String(fp.position?.y ?? 0), type: 'number', readOnly: true },
    { key: 'rotation', label: 'Rotation (°)', value: String(fp.rotation ?? 0), type: 'number', readOnly: true },
    { key: 'layer', label: 'Layer', value: fp.layer ?? 'F.Cu', type: 'text', readOnly: true },
    { key: 'pads', label: 'Pad count', value: String((fp.pads ?? []).length), type: 'number', readOnly: true },
  ];
}

function propsForPCBTrack(t: any): PropertyField[] {
  return [
    { key: 'type', label: 'Type', value: 'Track', type: 'text', readOnly: true },
    { key: 'startX', label: 'Start X (mm)', value: String(t.start?.x ?? 0), type: 'number', readOnly: true },
    { key: 'startY', label: 'Start Y (mm)', value: String(t.start?.y ?? 0), type: 'number', readOnly: true },
    { key: 'endX', label: 'End X (mm)', value: String(t.end?.x ?? 0), type: 'number', readOnly: true },
    { key: 'endY', label: 'End Y (mm)', value: String(t.end?.y ?? 0), type: 'number', readOnly: true },
    { key: 'width', label: 'Width (mm)', value: String(t.width ?? 0), type: 'number', readOnly: true },
    { key: 'layer', label: 'Layer', value: t.layer ?? '', type: 'text', readOnly: true },
    { key: 'net', label: 'Net', value: t.net ?? '', type: 'text', readOnly: true },
  ];
}

function propsForPCBVia(v: any): PropertyField[] {
  return [
    { key: 'type', label: 'Type', value: 'Via', type: 'text', readOnly: true },
    { key: 'x', label: 'Position X (mm)', value: String(v.position?.x ?? 0), type: 'number', readOnly: true },
    { key: 'y', label: 'Position Y (mm)', value: String(v.position?.y ?? 0), type: 'number', readOnly: true },
    { key: 'diameter', label: 'Diameter (mm)', value: String(v.diameter ?? 0), type: 'number', readOnly: true },
    { key: 'drill', label: 'Drill (mm)', value: String(v.drill ?? 0), type: 'number', readOnly: true },
    { key: 'layers', label: 'Layers', value: (v.layers ?? []).join(', '), type: 'text', readOnly: true },
    { key: 'net', label: 'Net', value: v.net ?? '', type: 'text', readOnly: true },
  ];
}

function propsForSchematicComponent(comp: any): PropertyField[] {
  return [
    { key: 'reference', label: 'Reference', value: comp.reference ?? '', type: 'text', readOnly: true },
    { key: 'value', label: 'Value', value: comp.value ?? '', type: 'text', readOnly: true },
    { key: 'x', label: 'Position X (mm)', value: String(comp.position?.x ?? 0), type: 'number', readOnly: true },
    { key: 'y', label: 'Position Y (mm)', value: String(comp.position?.y ?? 0), type: 'number', readOnly: true },
    { key: 'rotation', label: 'Rotation (°)', value: String(comp.rotation ?? 0), type: 'number', readOnly: true },
  ];
}

function propsForGenericElement(kind: string, data: any): PropertyField[] {
  return [
    { key: 'type', label: 'Type', value: kind, type: 'text', readOnly: true },
    { key: 'id', label: 'ID', value: data?.id ?? '(no id)', type: 'text', readOnly: true },
  ];
}

function getPropertiesForElement(
  mode: string,
  element: { kind: string; data: any } | null,
): PropertyField[] {
  if (!element) return [];
  const { kind, data } = element;
  if (mode === 'pcb') {
    if (kind === 'footprint') return propsForPCBFootprint(data);
    if (kind === 'track') return propsForPCBTrack(data);
    if (kind === 'via') return propsForPCBVia(data);
  } else {
    if (kind === 'component') return propsForSchematicComponent(data);
  }
  return propsForGenericElement(kind, data);
}

export const PropertiesPanel: React.FC = () => {
  const { theme } = useTheme();
  const selectedIds = useAppStore((s) => s.selectedIds);
  const mode = useAppStore((s) => s.mode);
  const pcbDocument = useAppStore((s) => s.pcbDocument);
  const schematicDocument = useAppStore((s) => s.schematicDocument);

  const displayProps = useMemo<PropertyField[]>(() => {
    if (selectedIds.size === 0) return [];
    // For single selection, show full properties
    const firstId = selectedIds.values().next().value as string;
    const element =
      mode === 'pcb'
        ? findPCBElement(pcbDocument, firstId)
        : findSchematicElement(schematicDocument, firstId);
    return getPropertiesForElement(mode, element);
  }, [selectedIds, mode, pcbDocument, schematicDocument]);

  const noSelection = selectedIds.size === 0;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px 6px',
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 3,
    fontSize: 12,
    fontFamily: theme.fonts.mono,
    outline: 'none',
    boxSizing: 'border-box',
  };

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
        Properties
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {noSelection ? (
          <div
            style={{
              color: theme.colors.textSecondary,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            No item selected.
            <br />
            <span style={{ fontSize: 11 }}>
              Click an item in the canvas to view its properties.
            </span>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 11,
                color: theme.colors.textSecondary,
                marginBottom: 8,
              }}
            >
              {selectedIds.size === 1
                ? '1 item selected'
                : `${selectedIds.size} items selected`}
            </div>

            {displayProps.map((prop) => (
              <div key={prop.key} style={{ marginBottom: 8 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    color: theme.colors.textSecondary,
                    marginBottom: 2,
                  }}
                >
                  {prop.label}
                </label>
                <input
                  type={prop.type === 'number' ? 'text' : prop.type}
                  value={prop.value}
                  readOnly
                  style={{
                    ...inputStyle,
                    opacity: 0.85,
                    cursor: 'default',
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor =
                      theme.colors.primary;
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor =
                      theme.colors.border;
                  }}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
