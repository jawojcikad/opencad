import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { KiCadPCBParser, KiCadSchematicParser } from './kicad-project-parser';

type ParseOutcome = {
  filePath: string;
  kind: 'schematic' | 'pcb';
  detectedAsKiCad: boolean;
  parsed: boolean;
  error?: string;
};

const workspaceRoot = process.cwd();
const testDataRoot = path.join(workspaceRoot, 'Test data');
const knownMalformedKiCadFiles = new Set([
  'LCDs/LCD-OLinuXino-5CTS/Hardware revision B/LCD-OLinuXino-5TS_Rev.B.kicad_pcb',
]);

function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];

  const out: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        out.push(fullPath);
      }
    }
  }

  return out;
}

function detectKind(filePath: string): 'schematic' | 'pcb' | null {
  const lower = filePath.toLowerCase();

  if (
    lower.endsWith('.kicad_sch') ||
    lower.endsWith('.sch') ||
    lower.endsWith('.schm')
  ) {
    return 'schematic';
  }

  if (
    lower.endsWith('.kicad_pcb') ||
    lower.endsWith('.pcb') ||
    lower.endsWith('.brd')
  ) {
    return 'pcb';
  }

  return null;
}

function isDetectedAsKiCad(content: string, kind: 'schematic' | 'pcb'): boolean {
  const marker = kind === 'schematic' ? '(kicad_sch' : '(kicad_pcb';
  return content.includes(marker);
}

describe('KiCad bulk loading against Test data', () => {
  it('parses all detected KiCad schematic/pcb files and reports unsupported legacy files separately', () => {
    const allFiles = walkFiles(testDataRoot);
    const candidates = allFiles
      .map((filePath) => ({ filePath, kind: detectKind(filePath) }))
      .filter((x): x is { filePath: string; kind: 'schematic' | 'pcb' } => x.kind !== null);

    expect(candidates.length).toBeGreaterThan(0);

    const schParser = new KiCadSchematicParser();
    const pcbParser = new KiCadPCBParser();

    const outcomes: ParseOutcome[] = [];

    for (const candidate of candidates) {
      const content = fs.readFileSync(candidate.filePath, 'utf8');
      const detectedAsKiCad = isDetectedAsKiCad(content, candidate.kind);

      if (!detectedAsKiCad) {
        outcomes.push({
          filePath: candidate.filePath,
          kind: candidate.kind,
          detectedAsKiCad,
          parsed: false,
        });
        continue;
      }

      try {
        if (candidate.kind === 'schematic') {
          const doc = schParser.parse(content);
          expect(Array.isArray((doc as any).sheets)).toBe(true);
        } else {
          const doc = pcbParser.parse(content);
          expect(Array.isArray((doc as any).tracks)).toBe(true);
        }

        outcomes.push({
          filePath: candidate.filePath,
          kind: candidate.kind,
          detectedAsKiCad,
          parsed: true,
        });
      } catch (error) {
        outcomes.push({
          filePath: candidate.filePath,
          kind: candidate.kind,
          detectedAsKiCad,
          parsed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const kicadSchematics = outcomes.filter(
      (o) => o.kind === 'schematic' && o.detectedAsKiCad,
    );
    const kicadPcbs = outcomes.filter((o) => o.kind === 'pcb' && o.detectedAsKiCad);

    const failedKiCad = outcomes.filter((o) => o.detectedAsKiCad && !o.parsed);
    const expectedMalformedFailures = failedKiCad.filter((f) =>
      knownMalformedKiCadFiles.has(path.relative(testDataRoot, f.filePath)),
    );
    const unexpectedFailures = failedKiCad.filter(
      (f) => !knownMalformedKiCadFiles.has(path.relative(testDataRoot, f.filePath)),
    );
    const unsupportedLegacy = outcomes.filter((o) => !o.detectedAsKiCad);

    if (unsupportedLegacy.length > 0) {
      console.log(
        `[fileio] Unsupported legacy/non-KiCad files skipped: ${unsupportedLegacy.length}`,
      );
    }

    console.log(
      `[fileio] Parsed KiCad schematics: ${kicadSchematics.filter((o) => o.parsed).length}/${kicadSchematics.length}`,
    );
    console.log(
      `[fileio] Parsed KiCad pcbs: ${kicadPcbs.filter((o) => o.parsed).length}/${kicadPcbs.length}`,
    );

    if (expectedMalformedFailures.length > 0) {
      console.log(
        `[fileio] Known malformed KiCad samples: ${expectedMalformedFailures.length}`,
      );
    }

    if (unexpectedFailures.length > 0) {
      const details = unexpectedFailures
        .slice(0, 20)
        .map((f) => `${path.relative(testDataRoot, f.filePath)} :: ${f.error ?? 'unknown parse error'}`)
        .join('\n');
      throw new Error(`Unexpected KiCad parse failures (${unexpectedFailures.length}):\n${details}`);
    }

    if (kicadSchematics.length + kicadPcbs.length === 0) {
      console.log('[fileio] No KiCad-root files detected in corpus; dataset appears legacy/non-KiCad.');
    }
  });
});
