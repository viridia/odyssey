import { Color, Object3D, Vector3 } from 'three';
import { Planet } from './Planet';
import { Sun } from './Sun';
import { Body } from 'astronomy-engine';

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

    this.mercury = new Planet('Mercury', {
      primary: this.sol,
      radius: 2.4397e6,
      body: Body.Mercury,
      mass: 0.107 * MEarth,
      texture: mercuryTexture,
      dayLength: 58.785 * DAY,
    });

    this.venus = new Planet('Venus', {
      primary: this.sol,
      radius: 4_212_300,
      body: Body.Venus,
      mass: 0.107 * MEarth,
      texture: venusTexture,
      // atmosphereThickness: 200_000,
      // atmosphereColor: new Color(1.0, 0.7, 0.7).convertSRGBToLinear(),
      // atmosphereOpacity: 0.2,
      dayLength: 243.686 * DAY,
    });

    this.earth = new Planet('Earth', {
      primary: this.sol,
      radius: 6.378e6,
      body: Body.Earth,
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

    this.moon = new Planet('Moon', {
      primary: this.earth,
      radius: 1.7374e6,
      mass: 7.34767309e22,
      oblateness: 0.00648,
      texture: moonTexture,
      tidalLocked: true,
    });
    this.moon.group.position.x = 3.844e8;
    this.moon.group.position.applyAxisAngle(ZPOS, -1.5);

    this.mars = new Planet('Mars', {
      primary: this.sol,
      radius: 4_212_300,
      body: Body.Mars,
      mass: 0.107 * MEarth,
      oblateness: 0.00648,
      texture: marsTexture,
      atmosphereThickness: 200_000,
      atmosphereColor: new Color(1.0, 0.7, 0.7).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 24.6229 * HOUR,
    });

    this.jupiter = new Planet('Jupiter', {
      primary: this.sol,
      radius: 6.9911e7,
      body: Body.Jupiter,
      mass: 0.107 * MEarth,
      oblateness: 0.06487,
      texture: jupiterTexture,
      atmosphereThickness: 5e6,
      atmosphereColor: new Color(1.0, 0.8, 0.7).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 9.925 * HOUR,
    });

    this.saturn = new Planet('Saturn', {
      primary: this.sol,
      radius: 5.8232e7,
      body: Body.Saturn,
      mass: 0.107 * MEarth,
      oblateness: 0.09796,
      texture: saturnTexture,
      atmosphereThickness: 5e6,
      atmosphereColor: new Color(1.0, 0.8, 0.7).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 10.656 * HOUR,
    });

    this.uranus = new Planet('Uranus', {
      primary: this.sol,
      radius: 2.5362e7,
      body: Body.Uranus,
      mass: 0.107 * MEarth,
      oblateness: 0.02293,
      texture: uranusTexture,
      atmosphereThickness: 2e6,
      atmosphereColor: new Color(0.8, 0.9, 1.0).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 17.24 * HOUR,
    });

    this.neptune = new Planet('Neptune', {
      primary: this.sol,
      radius: 2.4622e7,
      body: Body.Neptune,
      mass: 0.107 * MEarth,
      oblateness: 0.01708,
      texture: neptuneTexture,
      atmosphereThickness: 2e6,
      atmosphereColor: new Color(0.5, 0.6, 0.9).convertSRGBToLinear(),
      atmosphereOpacity: 0.2,
      dayLength: 16.11 * HOUR,
    });
  }

  public simulate(deltaTime: number) {
    this.sol.simulate(deltaTime);
    // this.moon.group.position.applyAxisAngle(ZPOS, deltaTime * 0.01);
    // this.moon.position.applyAxisAngle(ZPOS, deltaTime * 0.01);
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
    };

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
