import { BackSide, Color, ShaderMaterial, UniformsLib } from 'three';
import { ShaderChunk } from 'three';
import glsl from '../glsl';

const haloVert = glsl`
#define STANDARD

uniform float thickness;

varying vec3 vNormal;
varying vec3 vsNormal;
varying vec3 vSunlight;
varying vec3 vViewDir;

${ShaderChunk.common}
${ShaderChunk.logdepthbuf_pars_vertex}

void main() {
  // Get normal, view direction and sunlight direction in view space
  vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-viewPos.xyz); // vec3(0.0) - view_pos;
  vsNormal = normalize(normalMatrix * normal.xyz); // Normal in view space
  vNormal = normal;

	${ShaderChunk.begin_vertex}
  transformed *= (1. + thickness); // Inflate size of sphere
	${ShaderChunk.project_vertex}
	${ShaderChunk.logdepthbuf_vertex}
	${ShaderChunk.worldpos_vertex}
}`;

const haloFrag = glsl`
#define STANDARD

uniform vec3 diffuse;
uniform float thickness;
uniform float opacity;

varying vec3 vNormal;
varying vec3 vsNormal;
varying vec3 vViewDir;
varying vec3 vSunlight;

${ShaderChunk.common}
${ShaderChunk.packing}
${ShaderChunk.bsdfs}
${ShaderChunk.logdepthbuf_pars_fragment}

void main() {
	vec4 diffuseColor = vec4(diffuse, 1.);
  ${ShaderChunk.logdepthbuf_fragment}

  // Normalize interpolated vectors
	vec3 normal = normalize(vNormal);

  // See AtmosphereHaloMaterial for explanation
  float NdotV = -dot(vViewDir, normalize(vsNormal));
  float distToCenter = 1. - sqrt(1. - NdotV * NdotV);
  float altitude = distToCenter * (1. + thickness) / thickness + 0.05;
  altitude = pow(altitude, 6.5);
  float density = clamp(altitude, 0., 1.);

  gl_FragColor = vec4(diffuseColor.xyz, density * opacity);

	${ShaderChunk.encodings_fragment}
	${ShaderChunk.premultiplied_alpha_fragment}
}`;

export class CoronaHaloMaterial extends ShaderMaterial {
  constructor({
    color,
    thickness = 0.1,
    opacity = 0.1,
  }: {
    color: Color;
    thickness?: number;
    opacity: number;
  }) {
    super({
      uniforms: {
        ...UniformsLib.common,
        diffuse: { value: color },
        opacity: { value: opacity },
        thickness: { value: thickness },
      },
      fragmentShader: haloFrag,
      vertexShader: haloVert,
      transparent: true,
      lights: false,
      clipping: false,
      depthWrite: true,
      depthTest: true,
      side: BackSide,
    });
  }
}
