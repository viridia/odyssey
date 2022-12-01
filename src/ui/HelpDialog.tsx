import { Button, Badge, Modal, Group, createCssTransition } from 'dolmen';
import { createShortcuts } from 'dolmen-keys';
import { ParentComponent, Show, VoidComponent } from 'solid-js';
import { useUserSettings } from '../lib/createUserSettings';

const Shortcut: ParentComponent<{ key: string }> = props => (
  <Group gap="md">
    <Badge color="#3c4d5d">{props.key}</Badge>
    <span>{props.children}</span>
  </Group>
);

export const HelpDialog: VoidComponent = () => {
  const [settings, setSettings] = useUserSettings();
  const state = createCssTransition({ in: () => Boolean(settings.showHelp), delay: 300 });

  const onClose = () => {
    setSettings('showHelp', false);
  };

  createShortcuts(
    {
      esc: onClose,
    },
    true,
    () => state() !== 'exited'
  );

  return (
    <Show when={state() !== 'exited'}>
      <Modal.Dialog withClose onClose={onClose} state={state()}>
        <Modal.Header>Odyssey Help</Modal.Header>
        <Modal.Body>
          <div>Keyboard Shortcuts</div>
          <ul>
            <li>
              <Shortcut key="space">pause simulation</Shortcut>
            </li>
            <li>
              <Shortcut key="[">speed up</Shortcut>
            </li>
            <li>
              <Shortcut key="]">slow down</Shortcut>
            </li>
            <li>
              <Shortcut key="j">orbit camera left</Shortcut>
            </li>
            <li>
              <Shortcut key="l">orbit camera right</Shortcut>
            </li>
            <li>
              <Shortcut key="i">increase camera elevation</Shortcut>
            </li>
            <li>
              <Shortcut key="k">decrease camera elevation</Shortcut>
            </li>
            <li>
              <Shortcut key=",">zoom out</Shortcut>
            </li>
            <li>
              <Shortcut key=".">zoom in</Shortcut>
            </li>
            <li>
              <Shortcut key="V">Accelerate (increase velocity)</Shortcut>
            </li>
            <li>
              <Shortcut key="Shift+V">Decelerate (decrease velocity)</Shortcut>
            </li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </Show>
  );
};
