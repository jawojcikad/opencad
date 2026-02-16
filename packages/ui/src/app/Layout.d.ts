import React, { ReactNode } from 'react';
interface LayoutProps {
    toolbar: ReactNode;
    leftPanel?: ReactNode;
    center: ReactNode;
    rightPanel?: ReactNode;
    statusBar: ReactNode;
    showLeft: boolean;
    showRight: boolean;
}
export declare const Layout: React.FC<LayoutProps>;
export default Layout;
//# sourceMappingURL=Layout.d.ts.map