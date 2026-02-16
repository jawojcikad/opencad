// ── @opencad/renderer ────────────────────────────────────────────────
// Re-export every public symbol from the renderer package.

export { Camera } from './camera/index';

export {
  type GridSettings,
  defaultGridSettings,
  snapToGrid,
  GridRenderer,
} from './grid/index';

export {
  type LayerConfig,
  LayerManager,
  createSchematicLayers,
  createPCBLayers,
} from './layers/index';

export {
  type Pickable,
  type PickResult,
  HitTester,
  hitTestLine,
  hitTestCircle,
  hitTestRect,
  hitTestArc,
} from './picking/index';

export {
  type RenderStyle,
  Canvas2DRenderer,
} from './canvas2d/index';

export {
  WebGLRenderer,
  compileShader,
  createProgram,
  createProgramFromSources,
  basicVertexSource,
  solidColorFragmentSource,
  circleVertexSource,
  circleFragmentSource,
  gridVertexSource,
  gridFragmentSource,
} from './webgl/index';
