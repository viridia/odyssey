import { render } from 'solid-js/web';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Engine } from './scene/Engine';
import { createEffect, createSignal } from 'solid-js';
import './root.scss';

function Main() {
  const [viewport, setViewport] = createSignal<HTMLElement>();

  createEffect(() => {
    const elt = viewport();
    if (elt) {
      const engine = new Engine();
      engine.attach(elt);

      const orbitControls = new OrbitControls(engine.camera, elt);
      orbitControls.listenToKeyEvents(elt); // optional

      // an animation loop is required when either damping or auto-rotation are enabled
      orbitControls.enableDamping = true;
      orbitControls.dampingFactor = 0.05;
      orbitControls.screenSpacePanning = false;
      orbitControls.minDistance = 20;
      orbitControls.maxDistance = 10000;
      orbitControls.maxPolarAngle = Math.PI;
      orbitControls.minPolarAngle = -Math.PI;

      orbitControls.update();
      engine.events.subscribe('update', () => {
        orbitControls.update();
      });
    }
  });

  return (
    <div>
      <div class="hud">Hello World!</div>
      <div class="viewport" ref={setViewport} />
    </div>
  );
}

render(() => <Main />, document.getElementById('app')!);
