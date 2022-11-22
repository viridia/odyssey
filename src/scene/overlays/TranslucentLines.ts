import { Color, GreaterEqualDepth, LessDepth, Line, LineBasicMaterial } from 'three';
import { AbstractDualTranslucent } from './AbstractDualTranslucent';

const OPACITY_MULTIPLIER = 0.3;

/** A helper object which displays a semi-transparent shape. */
export class TranslucentLines extends AbstractDualTranslucent<LineBasicMaterial, Line> {
  protected readonly material = new LineBasicMaterial({
    depthWrite: false,
    depthTest: true,
    depthFunc: LessDepth,
    transparent: false,
    opacity: 0.5,
  });
  protected readonly material2 = new LineBasicMaterial({
    depthWrite: false,
    depthTest: true,
    depthFunc: GreaterEqualDepth,
    transparent: true,
    opacity: 0.5 * OPACITY_MULTIPLIER,
  });

  protected mesh: Line;
  protected mesh2: Line;

  constructor() {
    super();
    this.mesh = new Line(undefined, this.material);
    this.mesh.renderOrder = 10;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.visible = false;
    this.mesh.frustumCulled = true;
    this.mesh2 = new Line(undefined, this.material2);
    this.mesh2.renderOrder = 10;
    this.mesh2.matrixAutoUpdate = false;
    this.mesh2.visible = false;
    this.mesh2.frustumCulled = true;
  }

  public setColor(color: Color | number): this {
    this.material.color.set(color);
    this.material2.color.set(color);
    return this;
  }
}
