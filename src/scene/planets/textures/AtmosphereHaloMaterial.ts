import { BackSide, Color, ShaderMaterial, UniformsLib, Vector3 } from 'three';
import { ShaderChunk } from 'three';
import glsl from '../../glsl';

const haloVert = glsl`
#define STANDARD

uniform vec3 sunlight;
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
  vec4 sunlightDir = viewMatrix * vec4(sunlight, 0.0);
  vSunlight = normalize(sunlight.xyz);

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
	vec3 sunlight = normalize(vSunlight);

  // Atmosphere is lighter on the side facing the sun.
  float lightness = min(1., -dot(normal, sunlight) * 2. + 1.);

  // Atmosphere becomes less opaque with altitude. The dot product of normal * viewDir
  // gives us the cosine of the angle from the center of the planet, conver that to sin
  // and that gives us the distance from top of the atmospherer. Divide by atmosphere thickness
  // gives us distance from the top of the atmosphere (0 = top, 1 = ground level).
  float NdotV = -dot(vViewDir, normalize(vsNormal));
  float altitude = clamp(1. - sqrt(1. - NdotV * NdotV), 0., 1.) / thickness;
  float density = clamp(pow(altitude, 1.2), 0., 1.);

  gl_FragColor = vec4(diffuseColor.xyz, lightness * density * opacity);

	${ShaderChunk.encodings_fragment}
	${ShaderChunk.premultiplied_alpha_fragment}
}`;

export class AtmosphereHaloMaterial extends ShaderMaterial {
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
        sunlight: { value: new Vector3(0, 1, 0) },
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

  public setSunlight(sunlight: Vector3) {
    this.uniforms.sunlight.value = sunlight;
    this.uniformsNeedUpdate = true;
  }
}
