import { Color, Material, Object3D } from 'three';
/** @ts-ignore */
import { Text } from 'troika-three-text';
import FontFamily from './Blinker-Regular.ttf'

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

export function createLabel(content: string): TextLabel {
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
  return text;
}
