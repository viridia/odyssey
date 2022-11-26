import { Button, Badge, Modal, Group, TextSpan, createCssTransition } from 'dolmen';
import { createShortcuts } from 'dolmen-keys';
import { Show, VoidComponent } from 'solid-js';
import { useUserSettings } from '../lib/createUserSettings';

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
              <Group gap="md">
                <Badge color="#3c4d5d">space</Badge>
                <span>pause simulation</span>
              </Group>
            </li>
            <li>
              <Group gap="md">
                <Badge color="#3c4d5d">[</Badge>
                <TextSpan>reduce speed</TextSpan>
              </Group>
            </li>
            <li>
              <Group gap="md">
                <Badge color="#3c4d5d">]</Badge>increase speed
              </Group>
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
