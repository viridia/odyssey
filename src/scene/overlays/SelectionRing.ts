import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  Object3D,
  ShaderChunk,
  ShaderMaterial,
  UniformsLib,
} from 'three';
import glsl from '../glsl';

/** An instantiation of a particle system. */
export class SelectionRing {
  private material: ShaderMaterial;
  private geometry = new BufferGeometry();
  private mesh: Mesh;

  constructor(parent: Object3D, radius: number) {
    const positionBuffer = new Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2);
    const uvBuffer = new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2);
    this.geometry.setAttribute('position', positionBuffer);
    this.geometry.setAttribute('uv', uvBuffer);
    this.geometry.setIndex([0, 1, 2, 0, 2, 3]);

    this.material = new ShaderMaterial({
      uniforms: {
        ...UniformsLib.common,
        diffuse: { value: new Color(0.25, 0.25, 0.9).convertSRGBToLinear() },
        radius: { value: radius },
        opacity: { value: 1 },
      },
      fragmentShader: selectionRingFrag,
      vertexShader: selectionRingVert,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      transparent: true,
    });

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = false;
    this.mesh.castShadow = false;
    this.mesh.position.set(0, 0, 0);
    this.mesh.matrixAutoUpdate = true;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 20;
    this.mesh.visible = false;

    parent.add(this.mesh);
  }

  public dispose() {
    this.mesh.parent?.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }

  public setVisible(visible: boolean) {
    this.mesh.visible = visible;
  }
}

const selectionRingVert = glsl`
#define STANDARD

${ShaderChunk.common}
${ShaderChunk.uv_pars_vertex}
${ShaderChunk.uv2_pars_vertex}
${ShaderChunk.logdepthbuf_pars_vertex}

uniform float radius;

varying vec2 vUV;
varying float vDistance;

void main() {
	${ShaderChunk.uv_vertex}

  vec3 transformed = vec3(position); // Used for clipping
  vec2 center = vec2(0.5, 0.5);

  // Position on sprite quad [-1..1, -1..1].
  vUV = (position.xy - (center - vec2(0.5)));
  vec4 mvPosition = modelViewMatrix * vec4(0., 0., 0., 1.0);
  vDistance = length(mvPosition);
  float scale = max(radius * 1.2, vDistance / 1e2); // * vDistance / 8e8;
  vec2 quadCoords = vUV * scale;
  mvPosition.xy += quadCoords;

  gl_Position = projectionMatrix * mvPosition;

	${ShaderChunk.logdepthbuf_vertex}
	${ShaderChunk.worldpos_vertex}
}`;

const selectionRingFrag = glsl`
#define STANDARD

uniform vec3 diffuse;
uniform float radius;
// uniform float thickness;
// uniform float opacity;

varying vec2 vUV;
varying float vDistance;

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

  // float thickness = max(0.02, min(0.25, pow(vDistance / 0.8e2, 0.5) / radius));
  float thickness = min(0.2, vDistance / radius * 2e-3);
  float dist = max(0., (1. - length(vUV)));
  float alpha = smoothstep(0., 0.005, dist) * smoothstep(thickness + 0.005, thickness, dist);
  float dashes = smoothstep(0.15, 0.17, mod(atan(vUV.x, vUV.y) * 12. / 3.141, 1.));
  alpha *= dashes;
	vec4 diffuseColor = vec4(diffuse, alpha * 0.4);

  ${ShaderChunk.map_fragment}
  ${ShaderChunk.alphatest_fragment}

	gl_FragColor = diffuseColor;

	${ShaderChunk.encodings_fragment}
	${ShaderChunk.premultiplied_alpha_fragment}
}`;
