import { Card } from 'dolmen';
import { Show, VoidComponent } from 'solid-js';
import { getSimulator } from '../scene/Simulator';
import styles from './ObjectSelection.module.scss';

export const ObjectSelection: VoidComponent = () => {
  const sim = getSimulator();
  return (
    <Show when={sim.commandState.selected} keyed>
      {obj => (
        <Card class={styles.card}>
          <Card.Content>{obj.name}</Card.Content>
        </Card>
      )}
    </Show>
  );
};
