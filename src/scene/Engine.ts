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
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from 'three';
import { EventBus } from '../lib/EventBus';
import { Stars } from './stars/Stars';
// import { getRapier } from './physics/rapier';
import earthTexture from './planets/textures/earth.jpeg';
import marsTexture from './planets/textures/mars.jpeg';
import moonTexture from './planets/textures/moon.jpeg';
import { Planet } from './planets/textures/Planet';

const cameraOffset = new Vector3();

/** Contains the three.js renderer and handles to important resources. */
export class Engine {
  public readonly scene = new Scene();
  public readonly camera: PerspectiveCamera;
  public readonly renderer: WebGLRenderer;
  // public readonly pool = new ResourcePool();
  public readonly viewPosition = new Vector3();
  public viewAngle = 0;
  public readonly events = new EventBus<{ update: number }>();

  private mount: HTMLElement | undefined;
  private frameId: number | null = null;
  private clock = new Clock();
  private sunlight: DirectionalLight;
  // private terrain: TerrainShape[] = [];
  // private physicsWorld?: World;
  private sphere: Mesh;
  private stars: Stars;

  // private sphereBody?: RigidBody;

  constructor() {
    engine = this;

    this.animate = this.animate.bind(this);
    this.camera = new PerspectiveCamera(40, 1, 10, 10_000_000_000);
    // this.camera.up.set(0, 0, 1);

    this.sunlight = this.createSunlight();
    this.createAmbientLight();
    this.renderer = this.createRenderer();

    const group = new Group();
    this.scene.add(group);

    const geometry = new SphereGeometry(1, 32, 16);
    const material = new MeshStandardMaterial({ color: 0xffff00 });
    this.sphere = new Mesh(geometry, material);
    this.sphere.castShadow = true;
    group.add(this.sphere);

    const earth = new Planet(6_378_100, {
      oblateness: 0.00335,
      texture: earthTexture,
      atmosphereThickness: 200,
    });
    earth.addToScene(group);

    const moon = new Planet(1_079_600, {
      oblateness: 0.00648,
      texture: moonTexture,
      atmosphereThickness: 200,
    });
    moon.group.position.x = 384_000_000;
    moon.setParent(earth);

    const mars = new Planet(4_212_300, {
      oblateness: 0.00648,
      texture: marsTexture,
      atmosphereThickness: 200,
    });
    mars.group.position.x = -60_378_100;
    mars.addToScene(group);

    this.stars = new Stars(group);

    const helper = new AxesHelper();
    helper.position.set(6, 0, 0);
    group.add(helper);

    cameraOffset.setFromSphericalCoords(30_000_000, MathUtils.degToRad(75), this.viewAngle);
    this.camera.position.copy(this.viewPosition).add(cameraOffset);
    this.camera.lookAt(this.viewPosition);
    this.camera.updateMatrixWorld();
  }

  /** Shut down the renderer and release all resources. */
  public dispose() {
    // this.pool.dispose();
  }

  /** Attach the renderer to the DOM. */
  public async attach(mount: HTMLElement) {
    this.mount = mount;
    window.addEventListener('resize', this.onWindowResize.bind(this));
    mount.appendChild(this.renderer.domElement);
    this.onWindowResize();

    await this.stars.load();
    this.stars.start();

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

  /** Update the positions of any moving objects. */
  public updateScene(deltaTime: number) {
    // Run callbacks.
    this.events.emit('update', deltaTime);
    // Run physics
    // this.physicsWorld?.step();
    // const t = this.sphereBody!.translation();
    // this.sphere.position.set(t.x, t.y, t.z);
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
    this.adjustLightPosition();
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

  private createSunlight() {
    const sunlight = new DirectionalLight(new Color('#ffffff').convertSRGBToLinear(), 0.4);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.width = 1024;
    sunlight.shadow.mapSize.height = 1024;
    sunlight.shadow.camera.near = 1;
    sunlight.shadow.camera.far = 32;
    sunlight.shadow.camera.left = -15;
    sunlight.shadow.camera.right = 15;
    sunlight.shadow.camera.top = 15;
    sunlight.shadow.camera.bottom = -15;
    this.scene.add(sunlight);
    this.scene.add(sunlight.target);
    return sunlight;
  }

  public createAmbientLight() {
    const light = new HemisphereLight(
      new Color(0xb1e1ff).multiplyScalar(0.2).convertSRGBToLinear(),
      new Color(0xb97a20).multiplyScalar(0.2).convertSRGBToLinear(),
      0.6
    );
    this.scene.add(light);
    return light;
  }

  private adjustLightPosition() {
    // Adjust shadow map bounds
    const lightPos = this.sunlight.target.position;
    lightPos.copy(this.viewPosition);

    // Quantizing the light's location reduces the amount of shadow jitter.
    lightPos.x = Math.round(lightPos.x);
    lightPos.z = Math.round(lightPos.z);
    this.sunlight.position.set(lightPos.x + 6, lightPos.y + 8, lightPos.z + 4);
  }
}

let engine: Engine;

export function getEngine(): Engine {
  return engine;
}
