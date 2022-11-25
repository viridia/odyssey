import { Button, Page, Spacer, Menu } from 'dolmen';
import { createEffect, createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { createCameraController } from './createCameraController';
import { Simulator } from './scene/Simulator';
import 'dolmen/css/styles.css';
import './theme.scss';
import './root.scss';
import { MainMenu } from './icons';
import github from './images/github.png';
import { TimeDisplay } from './ui/TimeDisplay';
import { TimeControl } from './ui/TimeControl';

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
    <Page class="dm-theme-space">
      <Page.Header class="page-header" gap="md">
        <Page.Title>Odyssey</Page.Title>
        <Spacer />
        <TimeDisplay />
        <TimeControl />
        <Spacer />
        <Menu>
          <Menu.Button icon color="subtle">
            <MainMenu />
          </Menu.Button>
          <Menu.List placement="bottom-end" inset>
            <Menu.Item checked>Display Trajectories</Menu.Item>
            <Menu.Item>Display Axes</Menu.Item>
          </Menu.List>
        </Menu>
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
