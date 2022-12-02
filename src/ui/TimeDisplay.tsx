import { Group } from 'dolmen';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import { getSimulator } from '../scene/Simulator';
import styles from './TimeDisplay.module.scss';

export const TimeDisplay = () => {
  const sim = getSimulator();
  const [time, setTime] = createSignal<Date>(new Date(sim.simTime));

  createEffect(() => {
    setTime(new Date(sim.simTime * 1000));
    onCleanup(
      sim.events.subscribe('simulate', () => {
        setTime(new Date(sim.simTime * 1000));
      })
    );
  });

  return (
    <Group gap="md">
      <div class={styles.dateDisplay}>{time().toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })}</div>
      <div class={styles.timeDisplay}>
        {time().toLocaleTimeString(undefined, {
          hourCycle: 'h23',
        })}
      </div>
    </Group>
  );
};
