/**
 * Utility functions for compiling and linking WebGL2 shaders.
 */
/**
 * Compile a single shader from source.
 * @param gl       WebGL2 context
 * @param type     gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param source   GLSL source string
 */
export declare function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader;
/**
 * Link a vertex and fragment shader into a program.
 */
export declare function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram;
/**
 * Compile vertex + fragment source strings and link into a program.
 */
export declare function createProgramFromSources(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram;
//# sourceMappingURL=shader-utils.d.ts.map