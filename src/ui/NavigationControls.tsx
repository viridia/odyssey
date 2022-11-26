import { createActiveKeys } from 'dolmen-keys';
import { createEffect, onCleanup, VoidComponent } from 'solid-js';
import { MathUtils } from 'three';
import { getSimulator, MAX_CAMERA_DISTANCE, MIN_CAMERA_DISTANCE } from '../scene/Simulator';

export const NavigationControls: VoidComponent<{ viewport?: HTMLElement }> = props => {
  const signals = createActiveKeys({
    orbitLeft: 'j',
    orbitRight: 'l',
    orbitUp: 'i',
    orbitDown: 'k',
    zoomOut: ',',
    zoomIn: '.',
  });
  let dragging = false;

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

  createEffect(() => {
    const viewport = props.viewport;
    const sim = getSimulator();
    if (viewport) {
      const onWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          const movement = Math.pow(1.001, -e.deltaY);
          sim.cameraDistance = MathUtils.clamp(
            sim.cameraDistance * movement,
            MIN_CAMERA_DISTANCE,
            MAX_CAMERA_DISTANCE
          );
        } else {
          sim.cameraAzimuthAngle = MathUtils.euclideanModulo(
            sim.cameraAzimuthAngle + e.deltaX * 0.001,
            Math.PI * 2
          );
        }
      };

      const onPointerDown = (e: PointerEvent) => {
        viewport.setPointerCapture(e.pointerId);
        dragging = true;
      };

      const onPointerUp = (e: PointerEvent) => {
        viewport.releasePointerCapture(e.pointerId);
        dragging = false;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (dragging) {
          if (Math.abs(e.movementX) > Math.abs(e.movementY)) {
            sim.cameraAzimuthAngle = MathUtils.euclideanModulo(
              sim.cameraAzimuthAngle + e.movementX * -0.001,
              Math.PI * 2
            );
          } else {
            sim.cameraElevationAngle = MathUtils.clamp(
              sim.cameraElevationAngle + e.movementY * 0.002,
              -Math.PI * 0.5 + 0.0000001,
              Math.PI * 0.5 - 0.0000001
            );
          }
        }
      };

      const onPointerCancel = (e: PointerEvent) => {
        viewport.releasePointerCapture(e.pointerId);
        dragging = false;
      };

      viewport.addEventListener('wheel', onWheel, {
        passive: true,
      });
      viewport.addEventListener('pointerdown', onPointerDown);
      viewport.addEventListener('pointerup', onPointerUp);
      viewport.addEventListener('pointermove', onPointerMove);
      viewport.addEventListener('pointercancel', onPointerCancel);

      onCleanup(() => {
        viewport.removeEventListener('wheel', onWheel);
        viewport.removeEventListener('pointerdown', onPointerDown);
        viewport.removeEventListener('pointerup', onPointerUp);
        viewport.removeEventListener('pointermove', onPointerMove);
        viewport.removeEventListener('pointercancel', onPointerCancel);
      });
    }
  });

  return null;
};
