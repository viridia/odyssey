import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Object3D,
  Vector3,
} from 'three';
import { getSimulator } from '../Simulator';

const COMPASS_COLOR = new Color(0.4, 0.4, 0.6).convertSRGBToLinear();
const ZPOS = new Vector3(0, 0, 1);
const XPOS = new Vector3(1, 0, 0);
const v = new Vector3();
const COMPASS_SIZE = 20;

export class Compass {
  protected readonly material = new LineBasicMaterial({
    depthWrite: false,
    depthTest: false,
    // depthFunc: LessDepth,
    transparent: false,
    opacity: 0.5,
    color: COMPASS_COLOR,
  });
  private geometry = new BufferGeometry();
  private lines = new LineSegments(this.geometry, this.material);
  private unsub: () => void;

  constructor(parent: Object3D) {
    this.lines.renderOrder = 10;
    this.lines.matrixAutoUpdate = false;
    this.lines.visible = true;
    this.lines.frustumCulled = false;
    this.lines.rotateOnAxis(XPOS, 23.5 * Math.PI / 180);

    parent.add(this.lines);

    const sim = getSimulator();
    this.unsub = sim.events.subscribe('animate', this.animate.bind(this));

    // Create geometry
    const steps = 64;
    const position: number[] = [];
    for (let i = 0; i < steps; i++) {
      const phi = (i * Math.PI * 2) / steps;
      const phiNext = ((i + 1) * Math.PI * 2) / steps;
      v.set(COMPASS_SIZE, 0, 0);
      v.applyAxisAngle(ZPOS, phi);
      position.push(...v.toArray());
      v.set(COMPASS_SIZE, 0, 0);
      v.applyAxisAngle(ZPOS, phiNext);
      position.push(...v.toArray());
    }
    v.set(0, 0, COMPASS_SIZE * 0.75);
    position.push(...v.toArray());
    v.set(0, 0, -COMPASS_SIZE * 0.75);
    position.push(...v.toArray());

    for (let i = 0; i < COMPASS_SIZE; i += 4) {
      v.set(i, 0, 0);
      position.push(...v.toArray());
      v.set(i + 2, 0, 0);
      position.push(...v.toArray());
    }

    const positionBuffer = new Float32BufferAttribute(position, 3);
    this.geometry.setAttribute('position', positionBuffer);
    // this.geometry.setIndex(indices ?? null);
  }

  public dispose() {
    this.lines.removeFromParent();
    this.material.dispose();
    this.geometry.dispose();
    this.unsub();
  }

  public animate() {
    const sim = getSimulator();
    const aspect = sim.camera.aspect;
    const fov = Math.sin(sim.camera.fov * Math.PI / 180);
    this.lines.visible = !!sim.settings.showCompass;
    this.lines.position.set(530 * fov * aspect - 30, -530 * fov + 30, -1000);
    this.lines.position.applyMatrix4(sim.camera.matrix);
    this.lines.updateMatrix();
  }
}
