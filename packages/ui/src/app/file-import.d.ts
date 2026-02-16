export type ImportResult = {
    projectName?: string;
    schematicDocument?: any;
    pcbDocument?: any;
    preferredMode?: 'schematic' | 'pcb';
    message?: string;
};
export declare function importFiles(files: File[]): Promise<ImportResult>;
export declare function applyImportResult(result: ImportResult): void;
//# sourceMappingURL=file-import.d.ts.map