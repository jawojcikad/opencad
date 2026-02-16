/**
 * Utility functions for compiling and linking WebGL2 shaders.
 */
/**
 * Compile a single shader from source.
 * @param gl       WebGL2 context
 * @param type     gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param source   GLSL source string
 */
export function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('compileShader: createShader returned null');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) ?? 'unknown error';
        gl.deleteShader(shader);
        throw new Error(`compileShader: ${info}`);
    }
    return shader;
}
/**
 * Link a vertex and fragment shader into a program.
 */
export function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    if (!program) {
        throw new Error('createProgram: createProgram returned null');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program) ?? 'unknown error';
        gl.deleteProgram(program);
        throw new Error(`createProgram: ${info}`);
    }
    return program;
}
/**
 * Compile vertex + fragment source strings and link into a program.
 */
export function createProgramFromSources(gl, vsSource, fsSource) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    return createProgram(gl, vs, fs);
}
//# sourceMappingURL=shader-utils.js.map