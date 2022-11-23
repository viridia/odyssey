import { render } from 'solid-js/web';
import { Simulator } from './scene/Simulator';
import { createEffect, createSignal } from 'solid-js';
import { createCameraController } from './createCameraController';
import './root.scss';

const simulator = new Simulator();

function Main() {
  const [viewport, setViewport] = createSignal<HTMLElement>();
  const controllerAttrs = createCameraController(simulator);

  createEffect(() => {
    const elt = viewport();
    if (elt) {
      simulator.attach(elt);
    }
  });

  return (
    <div>
      <div class="hud">Hello World!</div>
      <div {...controllerAttrs} class="viewport" ref={setViewport} />
    </div>
  );
}

render(() => <Main />, document.getElementById('app')!);
