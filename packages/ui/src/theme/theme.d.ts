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
        schematicWire: string;
        schematicComponent: string;
        schematicPin: string;
        schematicBackground: string;
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
export declare const darkTheme: Theme;
export declare const lightTheme: Theme;
//# sourceMappingURL=theme.d.ts.map