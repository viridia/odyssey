import { Color, FrontSide, ShaderMaterial, UniformsLib } from 'three';
import { ShaderChunk } from 'three';
import glsl from '../glsl';

const discVert = glsl`
#define STANDARD

${ShaderChunk.common}
${ShaderChunk.uv_pars_vertex}
${ShaderChunk.uv2_pars_vertex}
${ShaderChunk.logdepthbuf_pars_vertex}

uniform float scale;

varying vec2 vUV;
varying float distance;

void main() {
	${ShaderChunk.uv_vertex}

  vec3 transformed = vec3(position); // Used for clipping
  vec2 center = vec2(0.5, 0.5);

  // Position on sprite quad [-1..1, -1..1].
  vUV = (position.xy - (center - vec2(0.5)));
  vec4 mvPosition = modelViewMatrix * vec4(0., 0., 0., 1.0);
  distance = length(mvPosition);
  vec2 quadCoords = vUV * scale * distance;
  mvPosition.xy += quadCoords;

  gl_Position = projectionMatrix * mvPosition;

	${ShaderChunk.logdepthbuf_vertex}
	${ShaderChunk.worldpos_vertex}
}`;

const discFrag = glsl`
#define STANDARD

uniform vec3 diffuse;
uniform float nominalDistance;
uniform float minDistance;
uniform float opacity;

varying vec2 vUV;
varying float distance;

${ShaderChunk.common}
${ShaderChunk.packing}
${ShaderChunk.uv_pars_fragment}
${ShaderChunk.uv2_pars_fragment}
${ShaderChunk.map_pars_fragment}
${ShaderChunk.alphatest_pars_fragment}
${ShaderChunk.logdepthbuf_pars_fragment}

void main() {
  ${ShaderChunk.logdepthbuf_fragment}
  ${ShaderChunk.clipping_planes_fragment}

  float alpha = opacity * smoothstep(distance, minDistance, nominalDistance);
  float dist = min(1., max(0., (1. - length(vUV))) / 0.4);
	vec4 diffuseColor = vec4(diffuse, dist * alpha);

  ${ShaderChunk.map_fragment}
  ${ShaderChunk.alphatest_fragment}

	gl_FragColor = diffuseColor;

	${ShaderChunk.encodings_fragment}
	${ShaderChunk.premultiplied_alpha_fragment}
}`;

export class DiscMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        ...UniformsLib.common,
        diffuse: { value: new Color('#555555') },
        scale: { value: 1 },
        nominalDistance: { value: 0 },
        minDistance: { value: 0 },
        opacity: { value: 1 },
      },
      fragmentShader: discFrag,
      vertexShader: discVert,
      side: FrontSide,
      transparent: true,
    });
  }
}
