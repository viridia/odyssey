import { createActiveKeys } from 'dolmen-keys';
import { createEffect, onCleanup, VoidComponent } from 'solid-js';
import { MathUtils } from 'three';
import { getSimulator, MAX_CAMERA_DISTANCE, MIN_CAMERA_DISTANCE } from '../scene/Simulator';

export const KeyboardNavigationControls: VoidComponent = () => {
  const signals = createActiveKeys({
    orbitLeft: 'j',
    orbitRight: 'l',
    orbitUp: 'i',
    orbitDown: 'k',
    zoomOut: ',',
    zoomIn: '.',
  });

  createEffect(() => {
    const sim = getSimulator();
    const azimuth = (signals.orbitLeft ? 1 : 0) + (signals.orbitRight ? -1 : 0);
    const elevation = (signals.orbitUp ? 1 : 0) + (signals.orbitDown ? -1 : 0);
    const zoom = (signals.zoomOut ? 1 : 0) + (signals.zoomIn ? -1 : 0);

    onCleanup(
      sim.events.subscribe('animate', deltaTime => {
        sim.cameraAzimuthAngle = MathUtils.euclideanModulo(
          sim.cameraAzimuthAngle - deltaTime * azimuth,
          Math.PI * 2
        );

        sim.cameraElevationAngle = MathUtils.clamp(
          sim.cameraElevationAngle + deltaTime * elevation,
          -Math.PI * 0.5 + 0.0000001,
          Math.PI * 0.5 - 0.0000001
        );

        const movement = Math.pow(1.01, zoom);
        sim.cameraDistance = MathUtils.clamp(
          sim.cameraDistance * movement,
          MIN_CAMERA_DISTANCE,
          MAX_CAMERA_DISTANCE
        );
      })
    );
  });

  return null;
};
