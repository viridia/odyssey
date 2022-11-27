import { Group, Vector3 } from 'three';

export interface ISatellite {
  simulate(deltaTime: number): void;
  animate(deltaTime: number): void;
}

export class CelestialBody {
  // This group's matrix holds the transform for the body, not it's rotation.
  public readonly group = new Group();
  public readonly satellites: ISatellite[] = [];

  protected readonly worldPosition = new Vector3();

  constructor(
    public readonly name: string,
    public readonly radius: number,
    public readonly mass: number
  ) {}

  /** Return current world position (ecliptic coordinates). Updates internal state. */
  public get position(): Vector3 {
    this.group.getWorldPosition(this.worldPosition);
    return this.worldPosition;
  }

  /** Copy world position to output vector. */
  public getWorldPosition(out: Vector3) {
    this.group.getWorldPosition(out);
  }

  public pick() {

  }
}
