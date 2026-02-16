import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDesignFiles } from './format-registry';

describe('format registry legacy KiCad schematic support', () => {
  it('imports legacy KiCad .sch through registry', () => {
    const filePath = path.join(
      process.cwd(),
      'Test data',
      'A10-OLinuXino-LIME',
      '3. Templates and more',
      'A10-OLinuXino-LIME revision B SHIELD TEMPLATE KiCAD',
      'A10_OLinuXino_Lime_Rev-B_SHIELD_TEMPLATE.sch',
    );

    const content = fs.readFileSync(filePath, 'utf8');

    const result = parseDesignFiles([
      {
        name: path.basename(filePath),
        content,
        binaryLike: false,
      },
    ]);

    expect(result.schematicDocument).toBeTruthy();
    expect((result.schematicDocument as any).sheets?.length ?? 0).toBeGreaterThan(0);
    expect((result.schematicDocument as any).sheets?.[0]?.components?.length ?? 0).toBeGreaterThan(0);
  });
});
