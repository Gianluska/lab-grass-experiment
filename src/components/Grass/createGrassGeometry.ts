import {  Quaternion, Euler } from "three";
import { getYPosition } from "utils/simpleNoise";

export function createGrassGeometry(instances: number, width: number) {
  const offsets = [];
  const orientations = [];
  const stretches = [];
  const colorVariations = [];

  for (let i = 0; i < instances; i++) {
    const offsetX = Math.random() * width - width / 2;
    const offsetZ = Math.random() * width - width / 2;
    const offsetY = getYPosition(offsetX, offsetZ);
    offsets.push(offsetX, offsetY, offsetZ);

    const yaw = Math.random() * 2 * Math.PI;

    const pitch = (Math.random() - 0.5) * 0.5;
    const roll = (Math.random() - 0.5) * 0.7;

    const quaternion = new Quaternion();
    quaternion.setFromEuler(new Euler(pitch, yaw, roll));

    orientations.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

    if (i < instances / 3) {
      stretches.push(Math.random() * 1.8);
    } else {
      stretches.push(Math.random());
    }

    const variation = (Math.random() - 0.5) * 2.5;
    colorVariations.push(variation);
  }

  return {
    offsets,
    orientations,
    stretches,
    colorVariations,
  };
}
