import { JSX } from 'solid-js/jsx-runtime';
import { MathUtils } from 'three';
import { Simulator } from './scene/Simulator';

const MIN_CAMERA_DISTANCE = 100;
const MAX_CAMERA_DISTANCE = 5_000_000_000_000; // A little larger than pluto's orbit

export const createCameraController = (sim: Simulator): JSX.HTMLAttributes<HTMLElement> => {
  let dragging = false;

  return {
    onWheel: e => {
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
    },

    onPointerDown: e => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragging = true;
    },

    onPointerUp: e => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragging = false;
    },

    onPointerMove: e => {
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
    },

    onPointerCancel: e => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragging = false;
    },
  };
};
