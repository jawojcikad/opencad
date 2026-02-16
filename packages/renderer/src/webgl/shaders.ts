/**
 * GLSL shader sources for the WebGL2 renderer.
 *
 * All shaders use GLSL ES 3.00 (`#version 300 es`).
 */

// ── Basic vertex shader ─────────────────────────────────────────────
// Transforms 2D positions by a combined view-projection matrix.

export const basicVertexSource = /* glsl */ `#version 300 es
precision highp float;

uniform mat3 u_viewProjection;

in vec2 a_position;

void main() {
  vec3 transformed = u_viewProjection * vec3(a_position, 1.0);
  gl_Position = vec4(transformed.xy, 0.0, 1.0);
}
`;

// ── Solid-colour fragment shader ────────────────────────────────────

export const solidColorFragmentSource = /* glsl */ `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 fragColor;

void main() {
  fragColor = u_color;
}
`;

// ── Circle vertex shader ────────────────────────────────────────────
// Renders circles as instanced quads.  Each instance has a centre and
// radius passed via per-instance attributes.

export const circleVertexSource = /* glsl */ `#version 300 es
precision highp float;

uniform mat3 u_viewProjection;

// Per-vertex unit quad (-1 … 1)
in vec2 a_position;

// Per-instance
in vec2 a_center;
in float a_radius;

out vec2 v_uv;

void main() {
  v_uv = a_position;  // -1 … 1

  vec2 worldPos = a_center + a_position * a_radius;
  vec3 transformed = u_viewProjection * vec3(worldPos, 1.0);
  gl_Position = vec4(transformed.xy, 0.0, 1.0);
}
`;

// ── Circle fragment shader ──────────────────────────────────────────
// Anti-aliased circle — discard fragments outside the radius.

export const circleFragmentSource = /* glsl */ `#version 300 es
precision highp float;

uniform vec4 u_color;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float dist = length(v_uv);

  // Smooth anti-aliased edge.  fwidth gives the rate of change of
  // dist across the fragment, giving us a 1-pixel-wide blend.
  float edge = fwidth(dist);
  float alpha = 1.0 - smoothstep(1.0 - edge, 1.0 + edge, dist);

  if (alpha < 0.001) discard;

  fragColor = vec4(u_color.rgb, u_color.a * alpha);
}
`;

// ── Grid fragment shader ────────────────────────────────────────────
// Expects world-space position in v_worldPos.

export const gridVertexSource = /* glsl */ `#version 300 es
precision highp float;

uniform mat3 u_viewProjection;

in vec2 a_position;
out vec2 v_worldPos;

void main() {
  v_worldPos = a_position;
  vec3 transformed = u_viewProjection * vec3(a_position, 1.0);
  gl_Position = vec4(transformed.xy, 0.0, 1.0);
}
`;

export const gridFragmentSource = /* glsl */ `#version 300 es
precision highp float;

uniform float u_majorSpacing;
uniform float u_minorSpacing;
uniform vec4 u_majorColor;
uniform vec4 u_minorColor;

in vec2 v_worldPos;
out vec4 fragColor;

float gridLine(float coord, float spacing) {
  float d   = abs(fract(coord / spacing + 0.5) - 0.5) * spacing;
  float fw  = fwidth(coord);
  return 1.0 - smoothstep(0.0, fw * 1.5, d);
}

void main() {
  float major = max(
    gridLine(v_worldPos.x, u_majorSpacing),
    gridLine(v_worldPos.y, u_majorSpacing)
  );
  float minor = max(
    gridLine(v_worldPos.x, u_minorSpacing),
    gridLine(v_worldPos.y, u_minorSpacing)
  );

  vec4 color = mix(u_minorColor, u_majorColor, major) * max(major, minor);
  if (color.a < 0.001) discard;
  fragColor = color;
}
`;
