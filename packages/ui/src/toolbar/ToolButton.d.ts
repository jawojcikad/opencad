import React from 'react';
import { IconName } from '../common/Icon';
interface ToolButtonProps {
    icon: IconName;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}
export declare const ToolButton: React.FC<ToolButtonProps>;
export default ToolButton;
//# sourceMappingURL=ToolButton.d.ts.map