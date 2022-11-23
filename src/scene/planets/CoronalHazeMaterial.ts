import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, UniformsLib } from 'three';
import { ShaderChunk } from 'three';
import glsl from '../glsl';

const starsVert = glsl`
#define STANDARD

${ShaderChunk.common}
${ShaderChunk.uv_pars_vertex}
${ShaderChunk.uv2_pars_vertex}
${ShaderChunk.logdepthbuf_pars_vertex}

uniform float scale;

varying vec2 vUV;

void main() {
	${ShaderChunk.uv_vertex}

  vec3 transformed = vec3(position); // Used for clipping
  vec2 center = vec2(0.5, 0.5);

  // Position on sprite quad [-1..1, -1..1].
  vUV = (position.xy - (center - vec2(0.5)));
  vec2 quadCoords = vUV * scale;
  vec4 mvPosition = modelViewMatrix * vec4(0., 0., 0., 1.0);
  mvPosition.xy += quadCoords;

  gl_Position = projectionMatrix * mvPosition;

	${ShaderChunk.logdepthbuf_vertex}
	${ShaderChunk.worldpos_vertex}
}`;

const starsFrag = glsl`
#define STANDARD

uniform vec3 diffuse;
uniform float thickness;
uniform float opacity;

varying vec2 vUV;

${ShaderChunk.common}
${ShaderChunk.packing}
${ShaderChunk.uv_pars_fragment}
${ShaderChunk.uv2_pars_fragment}
${ShaderChunk.map_pars_fragment}
${ShaderChunk.alphatest_pars_fragment}

void main() {
  ${ShaderChunk.clipping_planes_fragment}

  float dist = max(0., (1. - length(vUV))) / thickness;
  dist = pow(dist, 5.);
	vec4 diffuseColor = vec4(diffuse, dist * opacity);

  ${ShaderChunk.map_fragment}
  ${ShaderChunk.alphatest_fragment}

	gl_FragColor = diffuseColor;

	${ShaderChunk.encodings_fragment}
	${ShaderChunk.premultiplied_alpha_fragment}
}`;

export class CoronalHazeMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        ...UniformsLib.common,
        diffuse: { value: new Color('#555555') },
        scale: { value: 1 },
        thickness: { value: 0.5 },
        opacity: { value: 1 },
      },
      fragmentShader: starsFrag,
      vertexShader: starsVert,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      // transparent: true,
      blending: AdditiveBlending,
    });
  }
}
