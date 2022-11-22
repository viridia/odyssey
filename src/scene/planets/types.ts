import { Group, Vector3 } from 'three';

export interface ISatellite {
  update(deltaTime: number): void;
}

export interface IPrimary {
  group: Group;
  satellites: ISatellite[];

  position: Vector3;
}
