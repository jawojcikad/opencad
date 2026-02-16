import React from 'react';
type ExportFormat = 'gerber' | 'bom' | 'pdf' | 'svg' | 'pick-and-place';
interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
    onExport: (format: ExportFormat, options: Record<string, any>) => void;
}
export declare const ExportDialog: React.FC<ExportDialogProps>;
export default ExportDialog;
//# sourceMappingURL=ExportDialog.d.ts.map