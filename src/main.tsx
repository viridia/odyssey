import { render } from 'solid-js/web';
import { Engine } from './scene/Engine';
import { createEffect, createSignal } from 'solid-js';
import { createCameraController } from './createCameraController';
import './root.scss';

const engine = new Engine();

function Main() {
  const [viewport, setViewport] = createSignal<HTMLElement>();
  const controllerAttrs = createCameraController(engine);

  createEffect(() => {
    const elt = viewport();
    if (elt) {
      engine.attach(elt);
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
