import {
  KiCadPCBParser,
  KiCadSchematicParser,
  LegacyKiCadSchematicParser,
} from '../kicad/kicad-project-parser';
import { EaglePCBParser, EagleSchematicParser } from '../eagle/eagle-xml-parser';
import { EagleBinaryPCBParser, EagleBinarySchematicParser } from '../eagle/eagle-binary-parser';

export interface DesignImportFile {
  name: string;
  content: string;
  binaryLike: boolean;
}

export interface DesignImportResult {
  projectName?: string;
  schematicDocument?: any;
  pcbDocument?: any;
  warnings: string[];
}

interface DesignFormatDriver {
  id: string;
  priority: number;
  canHandle(file: DesignImportFile): boolean;
  parse(files: DesignImportFile[]): DesignImportResult;
}

const looksLikeLegacyEagleBinary = (content: string): boolean => {
  if (!content || content.length < 4) return false;
  const b0 = content.charCodeAt(0);
  const b2 = content.charCodeAt(2);
  return b0 === 0x10 && (b2 === 0x60 || b2 === 0x61 || b2 === 0x6a || b2 === 0x6d || b2 === 0x45);
};

class FormatRegistry {
  private drivers: DesignFormatDriver[] = [];

  register(driver: DesignFormatDriver): void {
    this.drivers.push(driver);
    this.drivers.sort((left, right) => right.priority - left.priority);
  }

  parse(files: DesignImportFile[]): DesignImportResult {
    const combined: DesignImportResult = { warnings: [] };

    for (const driver of this.drivers) {
      const relevant = files.filter((file) => driver.canHandle(file));
      if (relevant.length === 0) continue;

      const parsed = driver.parse(relevant);

      if (!combined.projectName && parsed.projectName) {
        combined.projectName = parsed.projectName;
      }
      if (!combined.schematicDocument && parsed.schematicDocument) {
        combined.schematicDocument = parsed.schematicDocument;
      }
      if (!combined.pcbDocument && parsed.pcbDocument) {
        combined.pcbDocument = parsed.pcbDocument;
      }

      combined.warnings.push(...parsed.warnings);

      if (combined.schematicDocument && combined.pcbDocument) {
        break;
      }
    }

    return combined;
  }
}

const getExtension = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.kicad_pro')) return '.kicad_pro';
  if (lower.endsWith('.kicad_sch')) return '.kicad_sch';
  if (lower.endsWith('.sch')) return '.sch';
  if (lower.endsWith('.schm')) return '.schm';
  if (lower.endsWith('.kicad_pcb')) return '.kicad_pcb';
  if (lower.endsWith('.pcb')) return '.pcb';
  if (lower.endsWith('.brd')) return '.brd';
  if (lower.endsWith('.opencad')) return '.opencad';
  if (lower.endsWith('.json')) return '.json';
  return '';
};

const getBaseName = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0) return fileName;
  return fileName.slice(0, dotIndex);
};

class KiCadAndJsonDriver implements DesignFormatDriver {
  id = 'kicad-json';
  priority = 100;

  canHandle(file: DesignImportFile): boolean {
    const extension = getExtension(file.name);
    return extension === '.kicad_pro'
      || extension === '.kicad_sch'
      || extension === '.kicad_pcb'
      || extension === '.sch'
      || extension === '.schm'
      || extension === '.brd'
      || extension === '.pcb'
      || extension === '.opencad'
      || extension === '.json';
  }

  parse(files: DesignImportFile[]): DesignImportResult {
    const result: DesignImportResult = { warnings: [] };

    const proEntry = files.find((file) => getExtension(file.name) === '.kicad_pro');
    const schEntries = files.filter((file) => {
      const ext = getExtension(file.name);
      return ext === '.kicad_sch' || ext === '.sch' || ext === '.schm';
    });
    const pcbEntries = files.filter((file) => {
      const ext = getExtension(file.name);
      return ext === '.kicad_pcb' || ext === '.brd' || ext === '.pcb';
    });
    const jsonEntries = files.filter((file) => {
      const extension = getExtension(file.name);
      return extension === '.opencad' || extension === '.json';
    });

    if (proEntry) {
      result.projectName = getBaseName(proEntry.name);
      try {
        const proJson = JSON.parse(proEntry.content);
        const jsonName =
          (typeof proJson?.name === 'string' && proJson.name)
          || (typeof proJson?.project?.name === 'string' && proJson.project.name)
          || (typeof proJson?.meta?.name === 'string' && proJson.meta.name);
        if (jsonName) {
          result.projectName = jsonName;
        }
      } catch {
        // Optional metadata only.
      }
    }

    if (schEntries.length > 0) {
      const parser = new KiCadSchematicParser();
      const legacyParser = new LegacyKiCadSchematicParser();
      for (const entry of schEntries) {
        if (entry.binaryLike) {
          result.warnings.push(`Skipped binary schematic in KiCad driver: ${entry.name}`);
          continue;
        }
        try {
          const trimmed = entry.content.trimStart();
          if (trimmed.includes('(kicad_sch')) {
            result.schematicDocument = parser.parse(entry.content);
          } else if (trimmed.startsWith('EESchema Schematic File Version')) {
            result.schematicDocument = legacyParser.parse(entry.content);
          } else {
            continue;
          }
          if (!result.projectName) {
            result.projectName = getBaseName(entry.name);
          }
          break;
        } catch (error) {
          result.warnings.push(`KiCad schematic parse failed for ${entry.name}: ${(error as Error).message}`);
        }
      }
    }

    if (pcbEntries.length > 0) {
      const parser = new KiCadPCBParser();
      for (const entry of pcbEntries) {
        if (entry.binaryLike) {
          result.warnings.push(`Skipped binary board in KiCad driver: ${entry.name}`);
          continue;
        }
        try {
          result.pcbDocument = parser.parse(entry.content);
          if (!result.projectName) {
            result.projectName = getBaseName(entry.name);
          }
          break;
        } catch (error) {
          result.warnings.push(`KiCad PCB parse failed for ${entry.name}: ${(error as Error).message}`);
        }
      }
    }

    if (jsonEntries.length > 0 && (!result.schematicDocument || !result.pcbDocument)) {
      for (const entry of jsonEntries) {
        if (entry.binaryLike) {
          result.warnings.push(`Skipped binary JSON/OpenCAD file: ${entry.name}`);
          continue;
        }
        try {
          const parsed = JSON.parse(entry.content);
          const project = parsed?.project ?? parsed;

          if (project?.schematic && !result.schematicDocument) {
            result.schematicDocument = project.schematic;
          }
          if (project?.pcb && !result.pcbDocument) {
            result.pcbDocument = project.pcb;
          }

          if (!result.projectName) {
            result.projectName = project?.metadata?.name ?? parsed?.metadata?.name ?? getBaseName(entry.name);
          }

          if (result.schematicDocument || result.pcbDocument) {
            break;
          }
        } catch (error) {
          result.warnings.push(`JSON/OpenCAD parse failed for ${entry.name}: ${(error as Error).message}`);
        }
      }
    }

    return result;
  }
}

/**
 * Catch-all driver for binary files with EDA extensions that no other driver can parse.
 * Produces a clear warning instead of fake/heuristic geometry.
 */
class UnsupportedBinaryDriver implements DesignFormatDriver {
  id = 'unsupported-binary';
  priority = 10;

  canHandle(file: DesignImportFile): boolean {
    const extension = getExtension(file.name);
    return file.binaryLike
      && !looksLikeLegacyEagleBinary(file.content)
      && (extension === '.brd' || extension === '.pcb' || extension === '.sch' || extension === '.schm');
  }

  parse(files: DesignImportFile[]): DesignImportResult {
    const result: DesignImportResult = { warnings: [] };

    for (const file of files) {
      result.warnings.push(
        `"${file.name}" is a binary file in a legacy/proprietary format that is not yet supported. ` +
        'Only text-based KiCad (.kicad_sch/.kicad_pcb) and Eagle XML (.sch/.brd) files can be imported.',
      );
    }

    return result;
  }
}

/**
 * Eagle XML format driver for .brd and .sch files.
 * Handles text-based Eagle XML files (identified by `<?xml` + `<eagle` markers).
 */
class EagleXMLDriver implements DesignFormatDriver {
  id = 'eagle-xml';
  priority = 75;

  canHandle(file: DesignImportFile): boolean {
    if (file.binaryLike) return false;
    const extension = getExtension(file.name);
    if (extension !== '.brd' && extension !== '.pcb' && extension !== '.sch' && extension !== '.schm') return false;
    // Quick content sniff for Eagle XML markers
    return file.content.includes('<eagle') && file.content.includes('<!DOCTYPE eagle');
  }

  parse(files: DesignImportFile[]): DesignImportResult {
    const result: DesignImportResult = { warnings: [] };

    const schEntries = files.filter((f) => {
      const ext = getExtension(f.name);
      return ext === '.sch' || ext === '.schm';
    });
    const brdEntries = files.filter((f) => {
      const ext = getExtension(f.name);
      return ext === '.brd' || ext === '.pcb';
    });

    if (schEntries.length > 0 && !result.schematicDocument) {
      const parser = new EagleSchematicParser();
      for (const entry of schEntries) {
        try {
          result.schematicDocument = parser.parse(entry.content);
          if (!result.projectName) {
            result.projectName = getBaseName(entry.name);
          }
          break;
        } catch (error) {
          result.warnings.push(`Eagle schematic parse failed for ${entry.name}: ${(error as Error).message}`);
        }
      }
    }

    if (brdEntries.length > 0 && !result.pcbDocument) {
      const parser = new EaglePCBParser();
      for (const entry of brdEntries) {
        try {
          result.pcbDocument = parser.parse(entry.content);
          if (!result.projectName) {
            result.projectName = getBaseName(entry.name);
          }
          break;
        } catch (error) {
          result.warnings.push(`Eagle PCB parse failed for ${entry.name}: ${(error as Error).message}`);
        }
      }
    }

    return result;
  }
}

/**
 * Experimental legacy Eagle binary support.
 *
 * This parser provides an approximate import by extracting probable design
 * tokens from binary payloads. It intentionally emits warnings so users know
 * the result is non-authoritative until a full binary decoder is implemented.
 */
class EagleBinaryApproxDriver implements DesignFormatDriver {
  id = 'eagle-binary-approx';
  priority = 50;

  canHandle(file: DesignImportFile): boolean {
    const extension = getExtension(file.name);
    if (!file.binaryLike) return false;
    if (extension !== '.brd' && extension !== '.pcb' && extension !== '.sch' && extension !== '.schm') return false;
    return looksLikeLegacyEagleBinary(file.content);
  }

  parse(files: DesignImportFile[]): DesignImportResult {
    const result: DesignImportResult = { warnings: [] };

    const schEntries = files.filter((f) => {
      const ext = getExtension(f.name);
      return ext === '.sch' || ext === '.schm';
    });
    const brdEntries = files.filter((f) => {
      const ext = getExtension(f.name);
      return ext === '.brd' || ext === '.pcb';
    });

    if (schEntries.length > 0 && !result.schematicDocument) {
      const parser = new EagleBinarySchematicParser();
      for (const entry of schEntries) {
        try {
          result.schematicDocument = parser.parse(entry.content, getBaseName(entry.name));
          if (!result.projectName) {
            result.projectName = getBaseName(entry.name);
          }
          result.warnings.push(
            `Loaded legacy binary Eagle schematic "${entry.name}" using approximate token extraction. ` +
            'Geometry/connectivity can be incomplete; verify against the original design.',
          );
          break;
        } catch (error) {
          result.warnings.push(`Legacy Eagle binary schematic parse failed for ${entry.name}: ${(error as Error).message}`);
        }
      }
    }

    if (brdEntries.length > 0 && !result.pcbDocument) {
      const parser = new EagleBinaryPCBParser();
      for (const entry of brdEntries) {
        try {
          result.pcbDocument = parser.parse(entry.content, getBaseName(entry.name));
          if (!result.projectName) {
            result.projectName = getBaseName(entry.name);
          }
          result.warnings.push(
            `Loaded legacy binary Eagle board "${entry.name}" using approximate token extraction. ` +
            'Board geometry/routing can be incomplete; verify against the original design.',
          );
          break;
        } catch (error) {
          result.warnings.push(`Legacy Eagle binary PCB parse failed for ${entry.name}: ${(error as Error).message}`);
        }
      }
    }

    return result;
  }
}

export function parseDesignFiles(files: DesignImportFile[]): DesignImportResult {
  const registry = new FormatRegistry();
  registry.register(new KiCadAndJsonDriver());
  registry.register(new EagleXMLDriver());
  registry.register(new EagleBinaryApproxDriver());
  registry.register(new UnsupportedBinaryDriver());
  return registry.parse(files);
}
