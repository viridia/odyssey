import {
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  Object3D,
  StaticDrawUsage,
  Vector3,
} from 'three';
import { StarsMaterial } from './StarsMaterial';
import { TextureLoader } from 'three';
import star from '../../textures/star.png';
import { getSimulator } from '../Simulator';
import { invariant } from '../../lib/invariant';

const XPOS = new Vector3(1, 0, 0);

// RA, Dec, Spectral, Mag
type IStarRow = [number, number, string, number];

/** An instantiation of a particle system. */
export class Stars {
  private material: StarsMaterial;
  private geometry = new InstancedBufferGeometry();
  private mesh: Mesh;

  constructor(parent: Object3D) {
    const positionBuffer = new Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2);
    const uvBuffer = new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2);
    this.geometry.setAttribute('position', positionBuffer);
    this.geometry.setAttribute('uv', uvBuffer);
    this.geometry.setIndex([0, 1, 2, 0, 2, 3]);

    this.material = new StarsMaterial();

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = false;
    this.mesh.castShadow = false;
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotateOnAxis(XPOS, Math.PI * 0.5);
    this.mesh.rotateOnAxis(XPOS, (23.5 * Math.PI) / 180);
    this.mesh.updateMatrix();

    const loader = new TextureLoader();
    const texture = loader.load(star);
    this.material.setTexture(texture);

    // this.paramsAttr.needsUpdate = true;

    this.mesh.matrixAutoUpdate = true;
    this.mesh.visible = true;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;

    parent.add(this.mesh);
  }

  public dispose() {
    this.mesh.parent?.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }

  public async load() {
    const resp = await fetch(`${import.meta.env.VITE_RESOURCE_BASE}stars.json`);
    invariant(resp.status === 200, `Load stars failed with ${resp.status}`);
    const json = (await resp.json()) as IStarRow[];
    invariant(Array.isArray(json));

    const numStars = json.length;

    // Params is an array of vector4 XYZW where:
    // X = right ascension (radians)
    // Y = declination (radians)
    // Z = apparent magnitude
    // W = color temperature (0..1)
    const paramsData = new Float32Array(numStars * 4);
    const paramsAttr = new InstancedBufferAttribute(paramsData, 4).setUsage(StaticDrawUsage);
    paramsAttr.count = numStars;
    this.geometry.setAttribute('params', paramsAttr);

    let count = 0;
    for (let i = 0; i < numStars; i++) {
      const [ra, dec, spectral, mag] = json[i];

      // Compute color temperature from spectral class.
      let color = tempTable[spectral[0]];
      if (!color) {
        continue;
      }

      const subtype = Number(spectral[1]);
      if (!isNaN(subtype)) {
        color -= subtype / 100;
      }

      paramsAttr.setXYZW(count++, ra, dec, mag, color);
    }
    paramsAttr.needsUpdate = true;
    this.geometry.instanceCount = count;
  }

  public update() {
    const sim = getSimulator();
    this.mesh.position.copy(sim.cameraPosition);
  }
}

// Star classes in order of temperature
const tempTable: Record<string, number> = {
  M: 0.1,
  K: 0.2,
  G: 0.3,
  F: 0.4,
  A: 0.5,
  B: 0.6,
  O: 0.7,
};
