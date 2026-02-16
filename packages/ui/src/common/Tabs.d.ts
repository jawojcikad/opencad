import React, { ReactNode } from 'react';
interface Tab {
    id: string;
    label: string;
    icon?: ReactNode;
}
interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    style?: React.CSSProperties;
}
export declare const Tabs: React.FC<TabsProps>;
export default Tabs;
//# sourceMappingURL=Tabs.d.ts.map