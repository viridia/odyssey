import { JSX } from 'solid-js/jsx-runtime';
import { MathUtils } from 'three';
import { Engine } from './scene/Engine';

const MIN_CAMERA_DISTANCE = 100;
const MAX_CAMERA_DISTANCE = 5_000_000_000_000; // A little larger than pluto's orbit

// const rotation = new Quaternion();
// const YPOS = new Vector3(0, 1, 0);
// const ZPOS = new Vector3(0, 0, 1);

export const createCameraController = (engine: Engine): JSX.HTMLAttributes<HTMLElement> => {
  let dragging = false;

  return {
    onWheel: e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const movement = Math.pow(1.005, -e.deltaY);
        engine.cameraDistance = MathUtils.clamp(
          engine.cameraDistance * movement,
          MIN_CAMERA_DISTANCE,
          MAX_CAMERA_DISTANCE
        );
      } else {
        engine.cameraAzimuthAngle = MathUtils.euclideanModulo(
          engine.cameraAzimuthAngle + e.deltaX * 0.001,
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
          engine.cameraAzimuthAngle = MathUtils.euclideanModulo(
            engine.cameraAzimuthAngle + e.movementX * -0.001,
            Math.PI * 2
          );
        } else {
          engine.cameraElevationAngle = MathUtils.clamp(
            engine.cameraElevationAngle + e.movementY * 0.002,
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
