import { Color, Material, Object3D, Vector3 } from 'three';
/** @ts-ignore */
import { Text } from 'troika-three-text';
import FontFamily from './Blinker-Regular.ttf';

interface ITextLabelOptions {
  minDistance?: number;
  nominalDistance?: number;
}

export type TextLabel = Object3D & {
  text: string;
  font: string;
  color: Color | number;
  fontSize: number;
  material: Material;
  anchorY: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom' | `${number}%`;
  anchorX: number | 'left' | 'center' | 'right' | `${number}%`;
  dispose: () => void;
  sync: () => void;
};

export function createLabel(content: string, options: ITextLabelOptions = {}): TextLabel {
  const text = new Text() as TextLabel;
  text.text = content;
  text.name = content;
  text.font = FontFamily;
  text.fontSize = 2e5;
  text.color = new Color(0x55cc66);
  text.anchorY = 'middle';
  text.anchorX = -1e5;
  text.material.depthTest = false;
  text.sync();

  const { nominalDistance = 0, minDistance = 0 } = options;
  const cameraPos = new Vector3();
  const labelPos = new Vector3();
  const saveOnBeforeRender = text.onBeforeRender;
  text.onBeforeRender = (renderer, scene, camera, ...rest) => {
    text.quaternion.copy(camera.quaternion);
    camera.getWorldPosition(cameraPos);
    text.getWorldPosition(labelPos);
    const distance = cameraPos.distanceTo(labelPos);
    const opacity = smoothstep(minDistance, nominalDistance, distance);
    // text.scale.setScalar(distance / 2e7);
    if (nominalDistance > 0) {
      if (text.material.opacity !== opacity) {
        text.material.opacity = opacity;
        text.material.needsUpdate = true;
      }
    }
    saveOnBeforeRender.call(text, renderer, scene, camera, ...rest);
  };
  return text;
}

function smoothstep(min: number, max: number, value: number) {
  var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}
