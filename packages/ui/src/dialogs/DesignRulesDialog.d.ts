import React from 'react';
interface DesignRulesDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (rules: DesignRules) => void;
}
interface NetClassRule {
    name: string;
    clearance: number;
    trackWidth: number;
    viaDiameter: number;
    viaDrill: number;
}
interface DesignRules {
    minClearance: number;
    minTrackWidth: number;
    minViaDiameter: number;
    minViaDrill: number;
    minHoleDiameter: number;
    copperToEdge: number;
    netClasses: NetClassRule[];
}
export declare const DesignRulesDialog: React.FC<DesignRulesDialogProps>;
export default DesignRulesDialog;
//# sourceMappingURL=DesignRulesDialog.d.ts.map