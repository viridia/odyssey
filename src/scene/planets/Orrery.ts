import { Color, Object3D } from 'three';
import { Planet } from './Planet';
import { Sun } from './Sun';

import earthTexture from './textures/earth.jpeg';
import marsTexture from './textures/mars.jpeg';
import moonTexture from './textures/moon.jpeg';

const KM = 1000;

export class Orrery {
  public readonly sol: Sun;

  public readonly earth: Planet;
  public readonly moon: Planet;
  public readonly mars: Planet;

  constructor() {
    this.sol = new Sun('Sol', 696_340 * KM, {
      atmosphereThickness: 10_000_000 * KM,
      atmosphereColor: new Color(1.0, 1.0, 0.7),
      atmosphereOpacity: 1,
      luminosity: 0.5,
      luminousColor: new Color(1.0, 1.0, 1.0),
      luminousDistance: 5_000_000_000 * KM,
    });
    // this.sun.addToScene(group);

    this.earth = new Planet('Earth', 6_378 * KM, {
      oblateness: 0.00335,
      texture: earthTexture,
      atmosphereThickness: 500_000,
      atmosphereColor: new Color(0.5, 0.5, 1.0),
      atmosphereOpacity: 0.3,
      luminosity: 0.5,
      luminousColor: new Color(0.5, 0.5, 1.0),
      luminousDistance: 1000_000_000,
    });
    this.earth.group.position.z = -147_770_000 * KM;

    this.earth.setPrimary(this.sol);

    this.moon = new Planet('Moon', 1_079_600, {
      oblateness: 0.00648,
      texture: moonTexture,
    });
    this.moon.group.position.x = 384_000_000;
    this.moon.setPrimary(this.earth);

    this.mars = new Planet('Mars', 4_212_300, {
      oblateness: 0.00648,
      texture: marsTexture,
      atmosphereThickness: 200_000,
      atmosphereColor: new Color(1.0, 0.7, 0.7),
      atmosphereOpacity: 0.2,
    });
    this.mars.group.position.x = -600_378_100;
    this.mars.setPrimary(this.sol);
  }

  public update(deltaTime: number) {
    this.sol.update(deltaTime);
  }

  public addToScene(scene: Object3D): this {
    this.sol.addToScene(scene);
    return this;
  }
}
