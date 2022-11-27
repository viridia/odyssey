window; // import {
//   CoefficientCombineRule,
//   ColliderDesc,
//   RigidBody,
//   RigidBodyDesc,
//   World,
// } from '@dimforge/rapier3d-compat';
import {
  AmbientLight,
  Clock,
  Color,
  Group,
  PerspectiveCamera,
  Ray,
  Scene,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from 'three';
import { EventBus } from '../lib/EventBus';
import { Stars } from './stars/Stars';
// import { getRapier } from './physics/rapier';
import { Orrery } from './planets/Orrery';
import { Vehicle } from './vehicles/Vehicle';
import { Accessor, createSignal, Setter } from 'solid-js';
import { ISettings } from '../lib/createUserSettings';
import { Compass } from './overlays/Compass';
import { CelestialBody } from './planets/CelestialBody';
import { createStore, SetStoreFunction, Store } from 'solid-js/store';

// const cameraOffset = new Vector3();

export const MIN_CAMERA_DISTANCE = 100;
export const MAX_CAMERA_DISTANCE = 5_000_000_000_000; // A little larger than pluto's orbit

interface ISelectionStore {
  picked: Vehicle | CelestialBody | null;
  selected: Vehicle | CelestialBody | null;
  prevSelected: Vehicle | CelestialBody | null;
}

/** Contains the three.js renderer and handles to important resources. */
export class Simulator {
  // Camera variables
  public readonly viewCenter = new Vector3();
  public readonly camera: PerspectiveCamera;
  public cameraElevationAngle = Math.PI * 0.05;
  public cameraAzimuthAngle = 0;
  public readonly cameraPosition = new Vector3();
  public cameraDistance = 30_000_000;

  // Rendering
  public readonly renderer: WebGLRenderer;
  public readonly scene = new Scene();
  public readonly eclipticGroup = new Group();

  public readonly events = new EventBus<{ animate: number; simulate: number }>();
  public readonly planets: Orrery;
  public readonly compass: Compass;

  public simTime = new Date().getTime() / 1000; // Current time in seconds
  public readonly paused: Accessor<boolean>;
  public readonly setPaused: Setter<boolean>;
  public readonly speed: Accessor<number>;
  public readonly setSpeed: Setter<number>;
  public readonly timeScale = [1, 10, 1e2, 2.5e2, 1e3, 2.5e3, 1e4, 2.5e4, 1e5, 2.5e5, 1e6];

  public readonly selection: Store<ISelectionStore>;

  private mount: HTMLElement | undefined;
  private frameId: number | null = null;
  private clock = new Clock();
  // private physicsWorld?: World;
  private stars: Stars;
  private vehicles: Vehicle[] = [];

  private resize: ResizeObserver;
  private setSelection: SetStoreFunction<ISelectionStore>;
  private cameraEase = 0;

  // private sphereBody?: RigidBody;

  constructor(public readonly settings: ISettings) {
    simulator = this;

    this.animate = this.animate.bind(this);
    this.camera = new PerspectiveCamera(30, 1, 10, 5_000_000_000_000);

    this.createAmbientLight();
    this.renderer = this.createRenderer();

    this.resize = new ResizeObserver(() => {
      this.onWindowResize();
      this.renderer.render(this.scene, this.camera);
    });

    [this.speed, this.setSpeed] = createSignal(0);
    [this.paused, this.setPaused] = createSignal(true);
    [this.selection, this.setSelection] = createStore<ISelectionStore>({
      picked: null,
      selected: null,
      prevSelected: null,
    });

    this.scene.add(this.eclipticGroup);

    this.stars = new Stars(this.eclipticGroup);
    this.planets = new Orrery();
    this.planets.simulate(0);
    this.planets.addToScene(this.eclipticGroup);
    this.setSelection('selected', this.planets.earth);

    this.compass = new Compass(this.scene);

    const vh = new Vehicle('TestVehicle', this.scene);
    vh.setPrimary(this.planets.earth);
    vh.position.copy(this.planets.earth.position);
    vh.position.x += this.planets.earth.radius * 2;
    vh.velocity.set(0, 5588, 50); // m/s
    vh.calcOrbit();
    this.vehicles.push(vh);

    const vh2 = new Vehicle('TestVehicle2', this.scene);
    vh2.setPrimary(this.planets.earth);
    vh2.position.copy(this.planets.earth.position);
    vh2.position.x += this.planets.earth.radius * 2.05;
    vh2.velocity.set(0, 6588, 50); // m/s
    vh2.calcOrbit();
    this.vehicles.push(vh2);

    const vh3 = new Vehicle('TestVehicle3', this.scene);
    vh3.setPrimary(this.planets.earth);
    vh3.position.copy(this.planets.earth.position);
    vh3.position.x += this.planets.earth.radius * 1.95;
    vh3.velocity.set(1200, 1588, 1500); // m/s
    vh3.calcOrbit();
    this.vehicles.push(vh3);

    const vh4 = new Vehicle('TestVehicle4', this.scene);
    vh4.setPrimary(this.planets.earth);
    vh4.position.copy(this.planets.earth.position);
    vh4.position.x += this.planets.earth.radius * 1.9;
    vh4.position.y += this.planets.earth.radius;
    vh4.velocity.set(0, 0, 1500); // m/s
    vh4.calcOrbit();
    this.vehicles.push(vh4);

    const vh5 = new Vehicle('TestVehicle5', this.scene);
    vh5.setPrimary(this.planets.earth);
    vh5.position.copy(this.planets.earth.position);
    vh5.position.x += this.planets.earth.radius * 2.1;
    vh5.velocity.set(0, 7988, 50); // m/s
    vh5.calcOrbit();
    this.vehicles.push(vh5);

    this.updateCamera();
  }

  /** Attach the renderer to the DOM. */
  public async attach(mount: HTMLElement) {
    this.mount = mount;
    this.resize.observe(mount);
    mount.appendChild(this.renderer.domElement);
    this.onWindowResize();

    await this.stars.load();

    // Make sure physics WASM bundle is initialized before starting rendering loop.
    // Physics objects cannot be created until after physics engine is initialized.
    // await getRapier();

    // Create physics for terrain
    // const gravity = new Vector3(0.0, -9.81, 0.0);
    // this.physicsWorld = new World(gravity);
    // this.terrain.forEach(terr => terr.addPhysics(this.physicsWorld!));

    // Create rigid body for the sphere.
    // const rbDesc = RigidBodyDesc.newDynamic()
    //   .setTranslation(6, 4, 0)
    //   .setLinearDamping(0.1)
    //   // .restrictRotations(false, true, false) // Y-axis only
    //   .setCcdEnabled(true);
    // this.sphereBody = this.physicsWorld.createRigidBody(rbDesc);

    // const clDesc = ColliderDesc.ball(1)
    //   .setFriction(0.1)
    //   .setFrictionCombineRule(CoefficientCombineRule.Max)
    //   // .setTranslation(0, 0, 0)
    //   .setRestitution(0.6)
    //   .setRestitutionCombineRule(CoefficientCombineRule.Max);
    // // .setCollisionGroups(CollisionMask.ActorMask | CollisionMask.TouchActor);
    // this.physicsWorld.createCollider(clDesc, this.sphereBody);

    this.planets.simulate(0);
    if (!this.frameId) {
      this.clock.start();
      this.frameId = requestAnimationFrame(this.animate);
    }
  }

  /** Detach the renderer from the DOM. */
  public detach() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.resize.disconnect();
    this.mount?.removeChild(this.renderer.domElement);
  }

  public updateCamera() {
    const viewTarget = this.selection.selected;
    if (viewTarget) {
      if (
        this.selection.prevSelected &&
        this.selection.prevSelected !== viewTarget &&
        this.cameraEase > 0
      ) {
        this.selection.prevSelected.getWorldPosition(viewCenter1);
        viewTarget.getWorldPosition(viewCenter2);
        this.viewCenter.lerpVectors(viewCenter2, viewCenter1, easeInOutQuad(this.cameraEase));
      } else {
        viewTarget.getWorldPosition(this.viewCenter);
      }
    }
    this.camera.up.set(0, 0, 1);
    this.camera.rotation.order = 'ZYX';
    this.camera.rotation.z = this.cameraAzimuthAngle;
    this.camera.rotation.y = -this.cameraElevationAngle;
    this.cameraPosition.set(this.cameraDistance, 0, 0);
    this.cameraPosition.applyEuler(this.camera.rotation);
    this.cameraPosition.add(this.viewCenter);
    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(this.viewCenter);
    this.camera.updateMatrixWorld();
  }

  public get simSpeed(): number {
    return this.timeScale[this.speed()];
  }

  private animate() {
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    this.cameraEase = Math.max(0, this.cameraEase - deltaTime * 2);
    if (!this.paused()) {
      const elapsed = deltaTime * this.simSpeed;
      this.simTime += elapsed;
      this.events.emit('simulate', elapsed);
      this.planets.simulate(elapsed);
      this.vehicles.forEach(v => v.simulate(elapsed));
    }
    this.updateCamera();
    this.planets.animate(deltaTime);
    this.vehicles.forEach(v => v.animate());
    this.updateCamera();
    this.events.emit('animate', deltaTime);
    this.stars.update();
    this.render();
    this.frameId = window.requestAnimationFrame(this.animate);
  }

  /** Render the scene. */
  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  /** Handle window resize event. */
  private onWindowResize() {
    if (this.mount) {
      const width = this.mount.clientWidth;
      const height = this.mount.clientHeight;
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  private createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.shadowMap.enabled = true;
    renderer.autoClear = true;
    renderer.autoClearColor = true;
    renderer.autoClearDepth = true;
    renderer.autoClearStencil = false;
    // renderer.gammaFactor = 2.2;
    renderer.outputEncoding = sRGBEncoding;
    return renderer;
  }

  public createAmbientLight() {
    const light = new AmbientLight(
      new Color(0xb1e1ff).multiplyScalar(0.2).convertSRGBToLinear(),
      0.2
    );
    this.scene.add(light);
    return light;
  }

  public setSelectedObject(selected: Vehicle | CelestialBody | null) {
    this.setSelection({
      selected,
      prevSelected: this.selection.selected,
    });
    this.cameraEase = 1;
  }

  public pick(ray: Ray): void {
    this.camera.getWorldDirection(cameraDirection);
    let closestAngle = 0;
    let closestVehicle: Vehicle | null = null;
    for (const v of this.vehicles) {
      pickPosition.copy(v.position).sub(this.cameraPosition);
      const distanceFromCamera = pickPosition.dot(cameraDirection);
      if (distanceFromCamera < 0) {
        continue;
      }
      pickPosition.normalize();
      const angle = pickPosition.dot(ray.direction);
      if (angle > 0.9997 && angle > closestAngle) {
        closestAngle = angle;
        closestVehicle = v;
      }
    }

    this.setSelection('picked', closestVehicle);
    // console.log(closestVehicle?.name);
  }
}

const cameraDirection = new Vector3();
const pickPosition = new Vector3();
const viewCenter1 = new Vector3();
const viewCenter2 = new Vector3();

let simulator: Simulator;

export function getSimulator(): Simulator {
  return simulator;
}

if (import.meta.hot) {
  import.meta.hot.decline();
}

function easeInOutQuad(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
