import React, { ReactNode } from 'react';
interface TooltipProps {
    text: string;
    children: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}
export declare const Tooltip: React.FC<TooltipProps>;
export default Tooltip;
//# sourceMappingURL=Tooltip.d.ts.map