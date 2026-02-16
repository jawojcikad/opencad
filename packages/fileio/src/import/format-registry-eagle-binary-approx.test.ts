import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDesignFiles } from './format-registry';

describe('format registry legacy Eagle binary approximate support', () => {
  it('imports binary Eagle schematic as approximate document', () => {
    const filePath = path.join(
      process.cwd(),
      'Test data',
      'A10S-OLinuXino-MICRO',
      'A10S-OLinuXino-MICRO_Rev_C.sch',
    );

    const content = fs.readFileSync(filePath, 'utf8');

    const result = parseDesignFiles([
      {
        name: path.basename(filePath),
        content,
        binaryLike: true,
      },
    ]);

    expect(result.schematicDocument).toBeTruthy();
    expect((result.schematicDocument as any).metadata?.approximateImport).toBe(true);
    expect((result.schematicDocument as any).sheets?.length ?? 0).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('approximate token extraction'))).toBe(true);
  });

  it('imports binary Eagle board as approximate document', () => {
    const filePath = path.join(
      process.cwd(),
      'Test data',
      'A10S-OLinuXino-MICRO',
      'A10S-OLinuXino-MICRO_Rev_C.brd',
    );

    const content = fs.readFileSync(filePath, 'utf8');

    const result = parseDesignFiles([
      {
        name: path.basename(filePath),
        content,
        binaryLike: true,
      },
    ]);

    expect(result.pcbDocument).toBeTruthy();
    expect((result.pcbDocument as any).metadata?.approximateImport).toBe(true);
    expect(Array.isArray((result.pcbDocument as any).boardOutline?.points)).toBe(true);
    expect(result.warnings.some((w) => w.includes('approximate token extraction'))).toBe(true);
  });

  it('imports alternate legacy binary schematic signature variant', () => {
    const filePath = path.join(
      process.cwd(),
      'Test data',
      'A33-OLinuXino',
      '1. Latest hardware revision',
      'A33-OLinuXino_Rev_C.sch',
    );

    const content = fs.readFileSync(filePath, 'utf8');

    const result = parseDesignFiles([
      {
        name: path.basename(filePath),
        content,
        binaryLike: true,
      },
    ]);

    expect(result.schematicDocument).toBeTruthy();
    expect((result.schematicDocument as any).metadata?.approximateImport).toBe(true);
    expect(result.warnings.some((w) => w.includes('approximate token extraction'))).toBe(true);
  });
});
