import { Button, Page, Spacer, Menu } from 'dolmen';
import { KeysManager, KeysManagerContext } from 'dolmen-keys';
import { createEffect, createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { Simulator } from './scene/Simulator';
import 'dolmen/css/styles.css';
import './theme.scss';
import './root.scss';
import { MainMenu } from './icons';
import github from './images/github.png';
import { TimeDisplay } from './ui/TimeDisplay';
import { TimeControl } from './ui/TimeControl';
import { createUserSettings, UserSettingsContext } from './lib/createUserSettings';
import { HelpDialog } from './ui/HelpDialog';
import { NavigationControls } from './ui/NavigationControls';

function Main() {
  const [settings, setSettings] = createUserSettings();
  const simulator = new Simulator(settings);
  const [viewport, setViewport] = createSignal<HTMLElement>();
  const keyMgr = new KeysManager();

  createEffect(() => {
    const elt = viewport();
    if (elt) {
      simulator.attach(elt);
    }
  });

  return (
    <UserSettingsContext.Provider value={[settings, setSettings]}>
      <KeysManagerContext.Provider value={keyMgr}>
        <NavigationControls viewport={viewport()} />
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
                <Menu.Item
                  checked={settings.showTrajectories}
                  onClick={() => {
                    setSettings('showTrajectories', show => !show);
                  }}
                >
                  Display Trajectories
                </Menu.Item>
                <Menu.Item
                  checked={settings.showCompass}
                  onClick={() => {
                    setSettings('showCompass', show => !show);
                  }}
                >
                  Display Compass
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={() => {
                    setSettings('showHelp', true);
                  }}
                >
                  Help
                </Menu.Item>
              </Menu.List>
            </Menu>
            <Button.Link icon color="subtle" target="new" href="https://github.com/viridia/odyssey">
              <img src={github} width={18} />
            </Button.Link>
          </Page.Header>
          <Page.Content class="page-content">
            <div class="viewport" ref={setViewport} />
          </Page.Content>
          <HelpDialog />
        </Page>
      </KeysManagerContext.Provider>
    </UserSettingsContext.Provider>
  );
}

render(() => <Main />, document.getElementById('app')!);
