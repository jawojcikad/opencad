import { parseDesignFiles } from '@opencad/fileio';
import { useAppStore } from '../store/app-store';

export type ImportResult = {
  projectName?: string;
  schematicDocument?: any;
  pcbDocument?: any;
  preferredMode?: 'schematic' | 'pcb';
  message?: string;
};

const getExtension = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.kicad_pro')) return '.kicad_pro';
  if (lower.endsWith('.kicad_sch')) return '.kicad_sch';
  if (lower.endsWith('.sch')) return '.kicad_sch';
  if (lower.endsWith('.schm')) return '.kicad_sch';
  if (lower.endsWith('.kicad_pcb')) return '.kicad_pcb';
  if (lower.endsWith('.brd')) return '.kicad_pcb';
  if (lower.endsWith('.pcb')) return '.kicad_pcb';
  if (lower.endsWith('.opencad')) return '.opencad';
  if (lower.endsWith('.json')) return '.json';
  return '';
};

const getBaseName = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0) return fileName;
  return fileName.slice(0, dotIndex);
};

const decodeFileContent = async (file: File): Promise<{ text: string; binaryLike: boolean }> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const sampleLen = Math.min(bytes.length, 2048);

  let nulCount = 0;
  for (let index = 0; index < sampleLen; index++) {
    if (bytes[index] === 0) nulCount++;
  }

  const nulRatio = sampleLen > 0 ? nulCount / sampleLen : 0;
  const binaryLike = nulRatio > 0.02;

  const text = new TextDecoder('utf-8').decode(bytes);
  return { text, binaryLike };
};

export async function importFiles(files: File[]): Promise<ImportResult> {
  const result: ImportResult = {};

  const supportedFiles = files
    .map((file) => ({ file, extension: getExtension(file.name) }))
    .filter((item) => item.extension);

  if (!supportedFiles.length) {
    return {
      message:
        'No supported files found. Supported: .kicad_pro, .kicad_sch/.sch/.schm, .kicad_pcb/.pcb/.brd, .opencad, .json',
    };
  }

  const decodedFiles = new Map<File, { text: string; binaryLike: boolean }>();
  await Promise.all(
    supportedFiles.map(async ({ file }) => {
      const decoded = await decodeFileContent(file);
      decodedFiles.set(file, decoded);
    }),
  );

  const parsed = parseDesignFiles(
    supportedFiles.map(({ file }) => {
      const decoded = decodedFiles.get(file);
      return {
        name: file.name,
        content: decoded?.text ?? '',
        binaryLike: decoded?.binaryLike ?? false,
      };
    }),
  );

  result.projectName = parsed.projectName;
  result.schematicDocument = parsed.schematicDocument;
  result.pcbDocument = parsed.pcbDocument;

  if (result.pcbDocument) {
    result.preferredMode = 'pcb';
  } else if (result.schematicDocument) {
    result.preferredMode = 'schematic';
  }

  const warnings = parsed.warnings ?? [];

  const proEntry = supportedFiles.find((item) => item.extension === '.kicad_pro');
  const schEntries = supportedFiles.filter((item) => item.extension === '.kicad_sch');
  const pcbEntries = supportedFiles.filter((item) => item.extension === '.kicad_pcb');

  if (proEntry && schEntries.length === 0 && pcbEntries.length === 0) {
    result.message =
      'Loaded KiCad project metadata. Add .kicad_sch and/or .kicad_pcb to import design content.';
  }

  if (!result.schematicDocument && !result.pcbDocument && warnings.length > 0 && !result.message) {
    result.message = `No design content loaded. ${warnings[0]}`;
  } else if (warnings.length > 0) {
    const suffix = warnings.length > 1 ? ` (+${warnings.length - 1} more warnings)` : '';
    result.message = `Loaded with warnings: ${warnings[0]}${suffix}`;
  }

  return result;
}

export function applyImportResult(result: ImportResult): void {
  const store = useAppStore.getState();

  if (result.schematicDocument) {
    store.setSchematicDocument(result.schematicDocument);
  }

  if (result.pcbDocument) {
    store.setPCBDocument(result.pcbDocument);
  }

  if (result.projectName) {
    store.setProjectName(result.projectName);
  }

  if (result.preferredMode) {
    store.setMode(result.preferredMode);
  }
}