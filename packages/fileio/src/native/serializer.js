const CURRENT_VERSION = '1.0.0';
export class NativeSerializer {
    /**
     * Serialize an OpenCAD project to a JSON string.
     * Updates the `modified` timestamp automatically.
     */
    static serialize(project) {
        const output = {
            ...project,
            version: project.version || CURRENT_VERSION,
            modified: new Date().toISOString(),
        };
        return JSON.stringify(output, null, 2);
    }
    /**
     * Deserialize a JSON string into a validated OpenCADProjectFile.
     * Throws on invalid JSON or missing required fields.
     */
    static deserialize(json) {
        let data;
        try {
            data = JSON.parse(json);
        }
        catch (err) {
            throw new Error(`Failed to parse OpenCAD project JSON: ${err.message}`);
        }
        if (!NativeSerializer.validateProject(data)) {
            throw new Error('Invalid OpenCAD project file: missing or malformed required fields');
        }
        return data;
    }
    /**
     * Runtime type‑guard that verifies the top‑level shape of a project file.
     * Does *not* deep‑validate every nested object – that is the job of the
     * domain model constructors – but it ensures all required top‑level
     * properties exist and are roughly the right type.
     */
    static validateProject(data) {
        if (data === null || typeof data !== 'object')
            return false;
        const obj = data;
        // Required string fields
        if (typeof obj['version'] !== 'string')
            return false;
        if (typeof obj['name'] !== 'string')
            return false;
        if (typeof obj['created'] !== 'string')
            return false;
        if (typeof obj['modified'] !== 'string')
            return false;
        // Schematic & PCB must be objects
        if (obj['schematic'] === null || typeof obj['schematic'] !== 'object')
            return false;
        if (obj['pcb'] === null || typeof obj['pcb'] !== 'object')
            return false;
        // Library section
        const lib = obj['library'];
        if (lib === null || typeof lib !== 'object')
            return false;
        const libObj = lib;
        if (!Array.isArray(libObj['symbols']))
            return false;
        if (!Array.isArray(libObj['footprints']))
            return false;
        if (!Array.isArray(libObj['components']))
            return false;
        // Settings section
        const settings = obj['settings'];
        if (settings === null || typeof settings !== 'object')
            return false;
        const settingsObj = settings;
        if (settingsObj['designRules'] === null ||
            typeof settingsObj['designRules'] !== 'object')
            return false;
        // Version compatibility check
        const [major] = obj['version']
            .toString()
            .split('.')
            .map(Number);
        const [currentMajor] = CURRENT_VERSION.split('.').map(Number);
        if (major > currentMajor) {
            // Forward compatibility: allow but warn — do not reject
            console.warn(`Project version ${obj['version']} is newer than supported ${CURRENT_VERSION}`);
        }
        return true;
    }
}
//# sourceMappingURL=serializer.js.map