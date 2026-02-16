import { KiCadPCBParser, KiCadSchematicParser } from '@opencad/fileio';
import { useAppStore } from '../store/app-store';
const getExtension = (fileName) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.kicad_pro'))
        return '.kicad_pro';
    if (lower.endsWith('.kicad_sch'))
        return '.kicad_sch';
    if (lower.endsWith('.kicad_pcb'))
        return '.kicad_pcb';
    if (lower.endsWith('.opencad'))
        return '.opencad';
    if (lower.endsWith('.json'))
        return '.json';
    return '';
};
const getBaseName = (fileName) => {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex <= 0)
        return fileName;
    return fileName.slice(0, dotIndex);
};
export async function importFiles(files) {
    const result = {};
    const supportedFiles = files
        .map((file) => ({ file, extension: getExtension(file.name) }))
        .filter((item) => item.extension);
    const fileTextMap = new Map();
    await Promise.all(supportedFiles.map(async ({ file }) => {
        const text = await file.text();
        fileTextMap.set(file, text);
    }));
    const proEntry = supportedFiles.find((item) => item.extension === '.kicad_pro');
    const schEntry = supportedFiles.find((item) => item.extension === '.kicad_sch');
    const pcbEntry = supportedFiles.find((item) => item.extension === '.kicad_pcb');
    const openCadEntry = supportedFiles.find((item) => item.extension === '.opencad' || item.extension === '.json');
    if (proEntry) {
        const proText = fileTextMap.get(proEntry.file) ?? '';
        result.projectName = getBaseName(proEntry.file.name);
        try {
            const proJson = JSON.parse(proText);
            const jsonName = (typeof proJson?.name === 'string' && proJson.name) ||
                (typeof proJson?.project?.name === 'string' && proJson.project.name) ||
                (typeof proJson?.meta?.name === 'string' && proJson.meta.name);
            if (jsonName) {
                result.projectName = jsonName;
            }
        }
        catch {
            // Best-effort parse only; fallback name already assigned.
        }
    }
    if (schEntry) {
        const parser = new KiCadSchematicParser();
        const schText = fileTextMap.get(schEntry.file) ?? '';
        result.schematicDocument = parser.parse(schText);
        if (!result.projectName) {
            result.projectName = getBaseName(schEntry.file.name);
        }
    }
    if (pcbEntry) {
        const parser = new KiCadPCBParser();
        const pcbText = fileTextMap.get(pcbEntry.file) ?? '';
        result.pcbDocument = parser.parse(pcbText);
        if (!result.projectName) {
            result.projectName = getBaseName(pcbEntry.file.name);
        }
    }
    if (openCadEntry) {
        const openCadText = fileTextMap.get(openCadEntry.file) ?? '';
        const parsed = JSON.parse(openCadText);
        const project = parsed?.project ?? parsed;
        if (project?.schematic) {
            result.schematicDocument = project.schematic;
        }
        if (project?.pcb) {
            result.pcbDocument = project.pcb;
        }
        if (!result.projectName) {
            result.projectName = project?.metadata?.name ?? parsed?.metadata?.name ?? openCadEntry.file.name;
        }
    }
    if (result.pcbDocument) {
        result.preferredMode = 'pcb';
    }
    else if (result.schematicDocument) {
        result.preferredMode = 'schematic';
    }
    if (proEntry && !schEntry && !pcbEntry) {
        result.message =
            'Loaded KiCad project metadata. Add .kicad_sch and/or .kicad_pcb to import design content.';
    }
    return result;
}
export function applyImportResult(result) {
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
//# sourceMappingURL=file-import.js.map