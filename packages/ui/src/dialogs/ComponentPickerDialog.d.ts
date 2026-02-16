import React from 'react';
interface ComponentEntry {
    id: string;
    name: string;
    category: string;
    description: string;
    symbolPreview: string;
    footprint: string;
    pins: number;
    datasheet?: string;
}
interface ComponentPickerDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (component: ComponentEntry) => void;
}
export declare const ComponentPickerDialog: React.FC<ComponentPickerDialogProps>;
export default ComponentPickerDialog;
//# sourceMappingURL=ComponentPickerDialog.d.ts.map