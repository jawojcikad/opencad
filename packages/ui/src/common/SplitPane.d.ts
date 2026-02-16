import React, { ReactNode } from 'react';
interface SplitPaneProps {
    left: ReactNode;
    right: ReactNode;
    direction?: 'horizontal' | 'vertical';
    initialSplit?: number;
    minSize?: number;
    style?: React.CSSProperties;
}
export declare const SplitPane: React.FC<SplitPaneProps>;
export default SplitPane;
//# sourceMappingURL=SplitPane.d.ts.map