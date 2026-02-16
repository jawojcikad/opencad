import React, { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { SplitPane } from '../common/SplitPane';

interface LayoutProps {
  toolbar: ReactNode;
  leftPanel?: ReactNode;
  center: ReactNode;
  rightPanel?: ReactNode;
  statusBar: ReactNode;
  showLeft: boolean;
  showRight: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  toolbar,
  leftPanel,
  center,
  rightPanel,
  statusBar,
  showLeft,
  showRight,
}) => {
  const { theme } = useTheme();

  const mainContent = (() => {
    if (showLeft && showRight && leftPanel && rightPanel) {
      return (
        <SplitPane
          direction="horizontal"
          initialSplit={18}
          minSize={180}
          left={leftPanel}
          right={
            <SplitPane
              direction="horizontal"
              initialSplit={78}
              minSize={200}
              left={center}
              right={rightPanel}
            />
          }
        />
      );
    }
    if (showLeft && leftPanel) {
      return (
        <SplitPane
          direction="horizontal"
          initialSplit={20}
          minSize={180}
          left={leftPanel}
          right={center}
        />
      );
    }
    if (showRight && rightPanel) {
      return (
        <SplitPane
          direction="horizontal"
          initialSplit={78}
          minSize={200}
          left={center}
          right={rightPanel}
        />
      );
    }
    return center;
  })();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Toolbar */}
      {toolbar}

      {/* Main area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {mainContent}
      </div>

      {/* Status bar */}
      {statusBar}
    </div>
  );
};

export default Layout;
