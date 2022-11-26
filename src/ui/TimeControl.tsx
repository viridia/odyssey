import { Group, Button } from 'dolmen';
import { createShortcuts } from 'dolmen-keys';
import { Show } from 'solid-js';
import { FastForward, FastRewind, Pause, PlayArrow } from '../icons';
import { getSimulator } from '../scene/Simulator';
import styles from './TimeControl.module.scss';

export const TimeControl = () => {
  const sim = getSimulator();

  createShortcuts({
    space: () => {
      sim.setPaused(paused => !paused);
    },
    '[': () => {
      const speed = sim.speed();
      if (speed <= 0) {
        sim.setPaused(true);
      } else {
        sim.setSpeed(speed - 1);
      }
    },
    ']': () => {
      const speed = sim.speed();
      if (speed < sim.timeScale.length - 1) {
        sim.setSpeed(speed + 1);
        sim.setPaused(false);
      }
    },
  });

  return (
    <Group gap="sm">
      <Button
        icon
        color="subtle"
        size="sm"
        disabled={sim.speed() === 0}
        onClick={() => {
          const speed = sim.speed();
          if (speed <= 0) {
            sim.setPaused(true);
          } else {
            sim.setSpeed(speed - 1);
          }
        }}
      >
        <FastRewind />
      </Button>
      <Button
        icon
        color="subtle"
        size="sm"
        onClick={() => {
          sim.setPaused(p => !p);
        }}
      >
        <Show when={sim.paused()} fallback={<Pause />}>
          <PlayArrow />
        </Show>
      </Button>
      <Button
        icon
        color="subtle"
        size="sm"
        disabled={sim.speed() >= sim.timeScale.length - 1}
        onClick={() => {
          const speed = sim.speed();
          sim.setSpeed(speed + 1);
          sim.setPaused(false);
        }}
      >
        <FastForward />
      </Button>
      <Group gap="md">
        <div class="page-header-text">&times;</div>
        <div class={styles.simSpeed}>{sim.simSpeed}</div>
      </Group>
    </Group>
  );
};
