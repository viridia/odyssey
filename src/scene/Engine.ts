// import {
//   CoefficientCombineRule,
//   ColliderDesc,
//   RigidBody,
//   RigidBodyDesc,
//   World,
// } from '@dimforge/rapier3d-compat';
import {
  AxesHelper,
  Clock,
  Color,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from 'three';
import { EventBus } from '../lib/EventBus';
import { Stars } from './stars/Stars';
// import { getRapier } from './physics/rapier';
import { Orrery } from './planets/Orrery';
import { Planet } from './planets/Planet';
import { Vehicle } from './vehicles/Vehicle';

// const cameraOffset = new Vector3();

/** Contains the three.js renderer and handles to important resources. */
export class Engine {
  public readonly scene = new Scene();
  public readonly camera: PerspectiveCamera;
  public readonly renderer: WebGLRenderer;
  public readonly viewCenter = new Vector3();
  public cameraElevationAngle = Math.PI * 0.05;
  public cameraAzimuthAngle = 0;
  public readonly cameraPosition = new Vector3();
  public cameraDistance = 30_000_000;
  // public viewAngle = 0;
  public readonly events = new EventBus<{ update: number }>();
  public readonly planets: Orrery;
  public viewTarget: Planet | null = null;

  private mount: HTMLElement | undefined;
  private frameId: number | null = null;
  private clock = new Clock();
  // private physicsWorld?: World;
  private rootGroup = new Group();
  private stars: Stars;
  private vehicles: Vehicle[] = [];

  // private sphereBody?: RigidBody;

  constructor() {
    engine = this;

    this.animate = this.animate.bind(this);
    this.camera = new PerspectiveCamera(30, 1, 10, 5_000_000_000_000);

    this.createAmbientLight();
    this.renderer = this.createRenderer();

    this.scene.add(this.rootGroup);

    this.stars = new Stars(this.rootGroup);
    this.planets = new Orrery();
    this.planets.addToScene(this.rootGroup);
    this.viewTarget = this.planets.earth;

    const vh = new Vehicle('Sphere', this.scene);
    vh.setPrimary(this.planets.earth);
    vh.position.copy(this.planets.earth.position);
    vh.position.x = +this.planets.earth.radius * 2;
    this.vehicles.push(vh);

    const helper = new AxesHelper();
    helper.position.set(6, 0, 0);
    helper.scale.setScalar(20_000_000);
    this.rootGroup.add(helper);

    this.updateCamera();
  }

  /** Attach the renderer to the DOM. */
  public async attach(mount: HTMLElement) {
    this.mount = mount;
    window.addEventListener('resize', this.onWindowResize.bind(this));
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
    window.removeEventListener('resize', this.onWindowResize);
    this.mount?.removeChild(this.renderer.domElement);
  }

  public updateCamera() {
    if (this.viewTarget) {
      this.viewTarget.getWorldPosition(this.viewCenter);
    }
    this.camera.rotation.order = 'YZX';
    this.camera.rotation.y = this.cameraAzimuthAngle;
    this.camera.rotation.z = this.cameraElevationAngle;
    this.cameraPosition.set(this.cameraDistance, 0, 0);
    this.cameraPosition.applyEuler(this.camera.rotation);
    this.cameraPosition.add(this.viewCenter);
    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(this.viewCenter);
    this.camera.updateMatrixWorld();
  }

  /** Update the positions of any moving objects. */
  public updateScene(deltaTime: number) {
    // Run callbacks.
    this.events.emit('update', deltaTime);

    this.planets.update(deltaTime);
    this.vehicles.forEach(v => v.update(deltaTime));
    this.updateCamera();
    this.stars.update();
  }

  /** Return the elapsed running time. */
  public get time(): number {
    return this.clock.elapsedTime;
  }

  private animate() {
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    this.updateScene(deltaTime);
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
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.render(this.scene, this.camera);
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
    const light = new HemisphereLight(
      new Color(0xb1e1ff).multiplyScalar(0.2).convertSRGBToLinear(),
      new Color(0xb97a20).multiplyScalar(0.2).convertSRGBToLinear(),
      0.3
    );
    this.scene.add(light);
    return light;
  }
}

let engine: Engine;

export function getEngine(): Engine {
  return engine;
}

if (import.meta.hot) {
  import.meta.hot.decline();
}
