import React from 'react';
type IconName = 'file-new' | 'file-open' | 'file-save' | 'export' | 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'delete' | 'select' | 'wire' | 'component' | 'net-label' | 'power' | 'erc' | 'route' | 'via' | 'zone' | 'footprint' | 'measure' | 'drc' | 'gerber' | 'top-view' | 'bottom-view' | 'isometric' | 'reset-view' | 'toggle-components' | 'eye' | 'eye-off' | 'search' | 'close' | 'chevron-right' | 'chevron-down' | 'warning' | 'error' | 'info' | 'check' | 'layer' | 'grid' | 'drag';
interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    style?: React.CSSProperties;
}
export declare const Icon: React.FC<IconProps>;
export type { IconName };
export default Icon;
//# sourceMappingURL=Icon.d.ts.map