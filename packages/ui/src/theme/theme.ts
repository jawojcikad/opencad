export interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    surfaceHover: string;
    primary: string;
    primaryHover: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    // Schematic colors
    schematicWire: string;
    schematicComponent: string;
    schematicPin: string;
    schematicBackground: string;
    // PCB layer colors
    copperFront: string;
    copperBack: string;
    silkscreenFront: string;
    solderMask: string;
    boardOutline: string;
  };
  fonts: {
    mono: string;
    sans: string;
  };
}

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#1a1a2e',
    surface: '#16213e',
    surfaceHover: '#1f2b47',
    primary: '#0f7dff',
    primaryHover: '#3399ff',
    text: '#e0e0e0',
    textSecondary: '#8892a4',
    border: '#2a2a4a',
    error: '#f44336',
    warning: '#ff9800',
    success: '#4caf50',
    schematicWire: '#00cc44',
    schematicComponent: '#cc4444',
    schematicPin: '#33ccff',
    schematicBackground: '#0a0a1a',
    copperFront: '#ff3333',
    copperBack: '#3333ff',
    silkscreenFront: '#cccc00',
    solderMask: '#004400',
    boardOutline: '#cccc00',
  },
  fonts: {
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    sans: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
  },
};

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceHover: '#eaeaea',
    primary: '#1976d2',
    primaryHover: '#1565c0',
    text: '#212121',
    textSecondary: '#666666',
    border: '#d0d0d0',
    error: '#d32f2f',
    warning: '#f57c00',
    success: '#388e3c',
    schematicWire: '#008800',
    schematicComponent: '#aa0000',
    schematicPin: '#0066aa',
    schematicBackground: '#ffffff',
    copperFront: '#cc0000',
    copperBack: '#0000cc',
    silkscreenFront: '#999900',
    solderMask: '#003300',
    boardOutline: '#999900',
  },
  fonts: {
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    sans: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
  },
};
