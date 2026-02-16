import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EaglePCBParser, EagleSchematicParser } from './eagle-xml-parser';

type ParseOutcome = {
  filePath: string;
  kind: 'schematic' | 'pcb';
  format: 'eagle-xml' | 'eagle-binary' | 'unknown';
  parsed: boolean;
  error?: string;
  stats?: { footprints?: number; tracks?: number; sheets?: number; components?: number };
};

const workspaceRoot = process.cwd();
const testDataRoot = path.join(workspaceRoot, 'Test data');

function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile()) out.push(fullPath);
    }
  }
  return out;
}

function detectKind(filePath: string): 'schematic' | 'pcb' | null {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.sch') || lower.endsWith('.schm')) return 'schematic';
  if (lower.endsWith('.brd') || lower.endsWith('.pcb')) return 'pcb';
  return null;
}

function detectFormat(content: string): 'eagle-xml' | 'eagle-binary' | 'kicad' | 'unknown' {
  if (content.includes('(kicad_pcb') || content.includes('(kicad_sch')) return 'kicad';
  if (content.includes('<eagle') && content.includes('<!DOCTYPE eagle')) return 'eagle-xml';
  // Check for binary: high NUL ratio in sample
  const sample = content.slice(0, 2048);
  let nulCount = 0;
  for (let i = 0; i < sample.length; i++) {
    if (sample.charCodeAt(i) === 0) nulCount++;
  }
  if (sample.length > 0 && nulCount / sample.length > 0.02) return 'eagle-binary';
  return 'unknown';
}

describe('Eagle XML bulk loading against Test data', () => {
  it('parses all Eagle XML board and schematic files', () => {
    const allFiles = walkFiles(testDataRoot);
    const candidates = allFiles
      .map((filePath) => ({ filePath, kind: detectKind(filePath) }))
      .filter((x): x is { filePath: string; kind: 'schematic' | 'pcb' } => x.kind !== null);

    expect(candidates.length).toBeGreaterThan(0);

    const brdParser = new EaglePCBParser();
    const schParser = new EagleSchematicParser();
    const outcomes: ParseOutcome[] = [];

    for (const candidate of candidates) {
      let content: string;
      try {
        content = fs.readFileSync(candidate.filePath, 'utf8');
      } catch {
        continue;
      }

      const format = detectFormat(content);
      if (format !== 'eagle-xml') {
        // Skip non-Eagle-XML files (KiCad, binary, unknown)
        continue;
      }

      try {
        if (candidate.kind === 'pcb') {
          const doc = brdParser.parse(content);
          expect(Array.isArray(doc.tracks)).toBe(true);
          expect(Array.isArray(doc.footprints)).toBe(true);
          outcomes.push({
            filePath: candidate.filePath,
            kind: candidate.kind,
            format: 'eagle-xml',
            parsed: true,
            stats: {
              footprints: doc.footprints.length,
              tracks: doc.tracks.length,
            },
          });
        } else {
          const doc = schParser.parse(content);
          expect(Array.isArray(doc.sheets)).toBe(true);
          const totalComponents = doc.sheets.reduce(
            (sum: number, s: any) => sum + (s.components?.length ?? 0),
            0,
          );
          outcomes.push({
            filePath: candidate.filePath,
            kind: candidate.kind,
            format: 'eagle-xml',
            parsed: true,
            stats: {
              sheets: doc.sheets.length,
              components: totalComponents,
            },
          });
        }
      } catch (error) {
        outcomes.push({
          filePath: candidate.filePath,
          kind: candidate.kind,
          format: 'eagle-xml',
          parsed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const eagleBoards = outcomes.filter((o) => o.kind === 'pcb');
    const eagleSchematics = outcomes.filter((o) => o.kind === 'schematic');
    const failed = outcomes.filter((o) => !o.parsed);

    console.log(
      `[eagle] Parsed Eagle XML boards: ${eagleBoards.filter((o) => o.parsed).length}/${eagleBoards.length}`,
    );
    console.log(
      `[eagle] Parsed Eagle XML schematics: ${eagleSchematics.filter((o) => o.parsed).length}/${eagleSchematics.length}`,
    );

    // Print some stats from successful parses
    for (const o of outcomes.filter((o) => o.parsed).slice(0, 5)) {
      const rel = path.relative(testDataRoot, o.filePath);
      console.log(`  ${rel}: ${JSON.stringify(o.stats)}`);
    }

    if (failed.length > 0) {
      const details = failed
        .slice(0, 20)
        .map((f) => `${path.relative(testDataRoot, f.filePath)} :: ${f.error ?? 'unknown'}`)
        .join('\n');
      console.error(`Eagle XML parse failures (${failed.length}):\n${details}`);
    }

    // We expect all detected Eagle XML files to parse successfully
    expect(failed.length).toBe(0);
    // We expect at least some Eagle XML files to exist
    expect(outcomes.length).toBeGreaterThan(0);
  });
});
