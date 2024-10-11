// createGrassGeometry.ts

import { Quaternion, Euler } from "three";
import { getYPosition } from "utils/simpleNoise";

export function createGrassGeometry(instances: number, width: number) {
  const offsets = [];
  const orientations = [];
  const stretches = [];
  const colorVariations = [];
  const textureIndices = [];

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

    stretches.push(Math.random());

    const variation = (Math.random() - 0.5) * 2.5;
    colorVariations.push(variation);

    const rnd = Math.random();
    let textureIndex;
    if (rnd < 0.1) {
      textureIndex = 1;
    } else {
      textureIndex = 0;
    }
    textureIndices.push(textureIndex);
  }

  return {
    offsets,
    orientations,
    stretches,
    colorVariations,
    textureIndices,
  };
}
