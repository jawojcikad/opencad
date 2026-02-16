import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LegacyKiCadSchematicParser } from './kicad-project-parser';

describe('Legacy KiCad schematic parser', () => {
  it('parses legacy .sch sample from Test data', () => {
    const samplePath = path.join(
      process.cwd(),
      'Test data',
      'A10-OLinuXino-LIME',
      '3. Templates and more',
      'A10-OLinuXino-LIME revision B SHIELD TEMPLATE KiCAD',
      'A10_OLinuXino_Lime_Rev-B_SHIELD_TEMPLATE.sch',
    );

    const content = fs.readFileSync(samplePath, 'utf8');
    const parser = new LegacyKiCadSchematicParser();
    const doc = parser.parse(content);

    expect(doc).toBeTruthy();
    expect(Array.isArray((doc as any).sheets)).toBe(true);
    expect((doc as any).sheets.length).toBeGreaterThan(0);

    const sheet = (doc as any).sheets[0];
    expect(Array.isArray(sheet.wires)).toBe(true);
    expect(Array.isArray(sheet.components)).toBe(true);
    expect(Array.isArray(sheet.netLabels)).toBe(true);

    expect(sheet.wires.length).toBeGreaterThan(0);
    expect(sheet.components.length).toBeGreaterThan(0);
  });
});
