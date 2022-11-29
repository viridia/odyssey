import { Group, Vector3 } from 'three';

export type CelestialBodyType = 'planet' | 'moon' | 'star';

export abstract class CelestialBody {
  // This group's matrix holds the transform for the body, not it's rotation.
  public abstract readonly type: CelestialBodyType;
  public readonly group = new Group();
  public readonly satellites: CelestialBody[] = [];

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

  public getAtmosphereDensity(_altitude: number) {
    return 0;
  }

  public abstract simulate(delta: number): void;
  public abstract animate(delta: number): void;
}
