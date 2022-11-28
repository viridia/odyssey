import { Color, Object3D, Vector3 } from 'three';
import { Planet } from './Planet';
import { Sun } from './Sun';

import mercuryTexture from './textures/mercury.jpeg';
import venusTexture from './textures/venus_atmosphere.jpeg';
import earthTexture from './textures/earth_hd.jpeg';
import marsTexture from './textures/mars.jpeg';
import jupiterTexture from './textures/jupiter.jpeg';
import saturnTexture from './textures/saturn.jpeg';
import uranusTexture from './textures/uranus.jpeg';
import neptuneTexture from './textures/neptune.jpeg';
import moonTexture from './textures/moon.jpeg';
import { CelestialBody } from './CelestialBody';

const KM = 1000;
const HOUR = 60 * 60;
const DAY = 24 * 60 * 60;

const MEarth = 5.97219e24;
const ZPOS = new Vector3(0, 0, 1);

export class Orrery {
  public readonly sol: Sun;

  public readonly mercury: Planet;
  public readonly venus: Planet;
  public readonly earth: Planet;
  public readonly moon: Planet;
  public readonly mars: Planet;
  public readonly jupiter: Planet;
  public readonly saturn: Planet;
  public readonly uranus: Planet;
  public readonly neptune: Planet;

  constructor() {
    this.sol = new Sun('Sol', 696_340 * KM, {
      mass: 1.9891e30,
      atmosphereThickness: 5e9,
      atmosphereColor: new Color(1.0, 1.0, 0.7).convertSRGBToLinear(),
      atmosphereOpacity: 0.5,
      luminosity: 1.0,
      luminousColor: new Color(1.0, 1.0, 1.0).convertSRGBToLinear(),
      luminousDistance: 5_000_000_000 * KM,
    });
    // this.sun.addToScene(group);

    this.mercury = new Planet('Mercury', 2.4397e6, {
      mass: 0.107 * MEarth,
      texture: mercuryTexture,
      dayLength: 58.785 * DAY,
    });
    this.mercury.group.position.y = 1.4757e11;
    this.mercury.setPrimary(this.sol);

    this.venus = new Planet('Venus', 4_212_300, {
      mass: 0.107 * MEarth,
      texture: venusTexture,
      // atmosphereThickness: 200_000,
      // atmosphereColor: new Color(1.0, 0.7, 0.7).convertSRGBToLinear(),
      // atmosphereOpacity: 0.2,
      dayLength: 243.686 * DAY,
    });
    this.venus.group.position.y = 1.4767e11;
    this.venus.setPrimary(this.sol);

    this.earth = new Planet('Earth', 6.378e6, {
      mass: MEarth,
      oblateness: 0.00335,
      texture: earthTexture,
      roughness: 0.6,
      atmosphereThickness: 500_000,
      atmosphereColor: new Color(0.6, 0.6, 1.0).convertSRGBToLinear(),
      atmosphereOpacity: 0.5,
      atmosphereDensity: earthAtmosphereDensity,
      luminosity: 0.4,
      luminousColor: new Color(0.5, 0.5, 1.0).convertSRGBToLinear(),
      luminousDistance: 10e8,
      dayLength: DAY,
    });
    this.earth.group.position.y = 1.4777e11;
    this.earth.setPrimary(this.sol);

    this.moon = new Planet('Moon', 1.7374e6, {
      mass: 7.34767309e22,
      oblateness: 0.00648,
      texture: moonTexture,
      tidalLocked: true,
    });
    this.moon.group.position.x = 3.844e8;
    this.moon.group.position.applyAxisAngle(ZPOS, -1.5);
    this.moon.setPrimary(this.earth);

    this.mars = new Planet('Mars', 4_212_300, {
      mass: 0.107 * MEarth,
      oblateness: 0.00648,
      texture: marsTexture,
      atmosphereThickness: 200_000,
      atmosphereColor: new Color(1.0, 0.7, 0.7).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 24.6229 * HOUR,
    });
    this.mars.group.position.y = 1.4787e11;
    this.mars.setPrimary(this.sol);

    this.jupiter = new Planet('Jupiter', 6.9911e7, {
      mass: 0.107 * MEarth,
      oblateness: 0.06487,
      texture: jupiterTexture,
      atmosphereThickness: 5e6,
      atmosphereColor: new Color(1.0, 0.8, 0.7).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 9.925 * HOUR,
    });
    this.jupiter.group.position.y = 1.4797e11;
    this.jupiter.setPrimary(this.sol);

    this.saturn = new Planet('Saturn', 5.8232e7, {
      mass: 0.107 * MEarth,
      oblateness: 0.09796,
      texture: saturnTexture,
      atmosphereThickness: 5e6,
      atmosphereColor: new Color(1.0, 0.8, 0.7).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 10.656 * HOUR,
    });
    this.saturn.group.position.y = 1.4807e11;
    this.saturn.setPrimary(this.sol);

    this.uranus = new Planet('Uranus', 2.5362e7, {
      mass: 0.107 * MEarth,
      oblateness: 0.02293,
      texture: uranusTexture,
      atmosphereThickness: 2e6,
      atmosphereColor: new Color(0.8, 0.9, 1.0).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 17.24 * HOUR,
    });
    this.uranus.group.position.y = 1.4817e11;
    this.uranus.setPrimary(this.sol);

    this.neptune = new Planet('Neptune', 2.4622e7, {
      mass: 0.107 * MEarth,
      oblateness: 0.01708,
      texture: neptuneTexture,
      atmosphereThickness: 2e6,
      atmosphereColor: new Color(0.5, 0.6, 0.9).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 16.11 * HOUR,
    });
    this.neptune.group.position.y = 1.4827e11;
    this.neptune.setPrimary(this.sol);
  }

  public simulate(deltaTime: number) {
    this.sol.simulate(deltaTime);
    this.moon.group.position.applyAxisAngle(ZPOS, deltaTime * 0.01);
    this.moon.position.applyAxisAngle(ZPOS, deltaTime * 0.01);
  }

  public animate(deltaTime: number) {
    this.sol.animate(deltaTime);
    // this.moon.group.position.applyAxisAngle(ZPOS, deltaTime * 0.01);
    // this.moon.position.applyAxisAngle(ZPOS, deltaTime * 0.01);
  }

  public addToScene(scene: Object3D): this {
    this.sol.addToScene(scene);
    return this;
  }

  public forEach(callback: (body: CelestialBody) => void) {
    const visit = (planet: CelestialBody) => {
      callback(planet);
      planet.satellites.forEach(visit);
    }

    visit(this.sol);
  }
}

// [altitude in meters, density in kg/m^3]
const earthPressureTable: [number, number][] = [
  [0, 1.225],
  [1000, 1.112],
  [2000, 1.007],
  [3000, 0.9093],
  [4000, 0.8194],
  [5000, 0.7364],
  [6000, 0.6601],
  [7000, 0.59],
  [8000, 0.5258],
  [9000, 0.4671],
  [10000, 0.4135],
  [15000, 0.1948],
  [20000, 0.08891],
  [25000, 0.04008],
  [30000, 0.01841],
  [40000, 0.003996],
  [50000, 0.001027],
  [60000, 0.0003097],
  [70000, 0.00008283],
  [80000, 0.00001846],
  [500000, 0],
];

function earthAtmosphereDensity(alt: number): number {
  if (alt <= 0) {
    return earthPressureTable[0][1];
  }
  for (let i = 1, ct = earthPressureTable.length; i < ct; i++) {
    if (alt <= earthPressureTable[i][0]) {
      const [alt0, pressure0] = earthPressureTable[i - 1];
      const [alt1, pressure1] = earthPressureTable[i];
      const t = (alt - alt0) / (alt1 - alt0);
      return pressure0 * (1 - t) + pressure1 * t;
    }
  }

  return 0;
}
