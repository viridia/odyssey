import { Color, Object3D, Vector3 } from 'three';
import { Planet } from './Planet';
import { Sun } from './Sun';

import earthTexture from './textures/earth.jpeg';
import marsTexture from './textures/mars.jpeg';
import moonTexture from './textures/moon.jpeg';

const KM = 1000;

const MEarth = 5.97219e24;
const ZPOS = new Vector3(0, 0, 1);

export class Orrery {
  public readonly sol: Sun;

  public readonly earth: Planet;
  public readonly moon: Planet;
  public readonly mars: Planet;

  constructor() {
    this.sol = new Sun('Sol', 696_340 * KM, {
      mass: 1.9891e30,
      atmosphereThickness: 5e9,
      atmosphereColor: new Color(1.0, 1.0, 0.7),
      atmosphereOpacity: 0.5,
      luminosity: 1.0,
      luminousColor: new Color(1.0, 1.0, 1.0),
      luminousDistance: 5_000_000_000 * KM,
    });
    // this.sun.addToScene(group);

    this.earth = new Planet('Earth', 6_378 * KM, {
      mass: MEarth,
      oblateness: 0.00335,
      texture: earthTexture,
      atmosphereThickness: 500_000,
      atmosphereColor: new Color(0.5, 0.5, 1.0),
      atmosphereOpacity: 0.3,
      luminosity: 0.2,
      luminousColor: new Color(0.5, 0.5, 1.0),
      luminousDistance: 10e8,
    });
    this.earth.group.position.y = 147_770_000 * KM;
    this.earth.setPrimary(this.sol);

    this.moon = new Planet('Moon', 1.7374e6, {
      mass: 7.34767309e22,
      oblateness: 0.00648,
      texture: moonTexture,
    });
    this.moon.group.position.x = 3.844e8;
    this.moon.group.position.applyAxisAngle(ZPOS, -1.5);
    this.moon.setPrimary(this.earth);

    this.mars = new Planet('Mars', 4_212_300, {
      mass: 0.107 * MEarth,
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
    this.moon.group.position.applyAxisAngle(ZPOS, deltaTime * 0.01);
  }

  public addToScene(scene: Object3D): this {
    this.sol.addToScene(scene);
    return this;
  }
}
