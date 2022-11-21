import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, Texture, UniformsLib } from 'three';
import { ShaderChunk } from 'three';
import glsl from '../glsl';

const starsVert = glsl`
#define STANDARD

${ShaderChunk.common}
${ShaderChunk.uv_pars_vertex}
${ShaderChunk.uv2_pars_vertex}
${ShaderChunk.logdepthbuf_pars_vertex}

attribute vec4 params;
attribute float scale;

varying vec4 vColor;

const float DIST = 100.;

void main() {
	${ShaderChunk.uv_vertex}

  vec3 transformed = vec3(position); // Used for clipping
  vec2 center = vec2(0.5, 0.5);

  float ra = params.x;
  float dec = params.y;
  float mag = params.z;
  float color = params.w;

  // Convert spectral magnitude to square root of absolute brightness.
  // This is because point radius is brightness squared.
  float brightness = pow(10., -mag * .4 * .5) * 0.5;
  float radius = clamp(brightness, 0.07, .2);
  float lumin = clamp(brightness / 0.07, 0.3, 1.);

  // Calculate position from right ascension and declination.
  // To convert earth-based coords to heliocentric use mesh transform.
  vec4 starPosition = vec4(
    DIST * cos(dec) * cos(ra),
    DIST * cos(dec) * sin(ra),
    DIST * sin(dec),
    1.
  );

  // Position on sprite quad [-1..1, -1..1].
  vec2 quadCoords = (position.xy - (center - vec2(0.5))) * radius;
  vec4 mvPosition = modelViewMatrix * starPosition;
  mvPosition.xy += quadCoords;

  float reddish = smoothstep(-0.8, 0.4, color) * lumin;
  float blueish = smoothstep(0.9, 0.3, color) * lumin;

  gl_Position = projectionMatrix * mvPosition;
  vColor = vec4(blueish, reddish * blueish, reddish, 1.0);

	${ShaderChunk.logdepthbuf_vertex}
	${ShaderChunk.worldpos_vertex}
}`;

const starsFrag = glsl`
#define STANDARD

varying vec4 vColor;

${ShaderChunk.common}
${ShaderChunk.packing}
${ShaderChunk.uv_pars_fragment}
${ShaderChunk.uv2_pars_fragment}
${ShaderChunk.map_pars_fragment}
${ShaderChunk.alphatest_pars_fragment}

void main() {
  ${ShaderChunk.clipping_planes_fragment}

	vec4 diffuseColor = vColor;

  ${ShaderChunk.map_fragment}
  ${ShaderChunk.alphatest_fragment}

	gl_FragColor = diffuseColor;

	${ShaderChunk.encodings_fragment}
	${ShaderChunk.premultiplied_alpha_fragment}
}`;

export class StarsMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        ...UniformsLib.common,
        diffuse: { value: new Color('#555555') },
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

  setTexture(texture: Texture) {
    (this as any).map = texture;
    this.uniforms.map = { value: texture };
  }
}
