import { Button, Page, Spacer } from 'dolmen';
import { createEffect, createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { createCameraController } from './createCameraController';
import { Simulator } from './scene/Simulator';
import 'dolmen/css/styles.css';
import 'dolmen/css/theme/dark.css';
import './root.scss';
import { FastForward, FastRewind, MainMenu, PlayArrow } from './icons';
import github from './images/github.png';

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
    <Page class="dm-theme-dark">
      <Page.Header class="page-header" gap="md">
        <Page.Title>Odyssey</Page.Title>
        <Spacer />
        <div class="page-header-text">00/00/2022</div>
        <div class="page-header-text">00:00:00</div>
        <Button icon color="subtle">
          <FastRewind />
        </Button>
        <Button icon color="subtle">
          <PlayArrow />
        </Button>
        <Button icon color="subtle">
          <FastForward />
        </Button>
        <div class="page-header-text">&times;10</div>
        <Spacer />
        <Button icon color="subtle">
          <MainMenu />
        </Button>
        <Button icon color="subtle">
          <img src={github} width={20} />
        </Button>
      </Page.Header>
      <Page.Content class="page-content">
        <div {...controllerAttrs} class="viewport" ref={setViewport} />
      </Page.Content>
    </Page>
  );
}

render(() => <Main />, document.getElementById('app')!);
