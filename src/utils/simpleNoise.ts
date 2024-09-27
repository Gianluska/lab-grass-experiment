import { createNoise2D, createNoise3D, createNoise4D } from "simplex-noise";

export const noise2D = createNoise2D(Math.random);
export const noise3D = createNoise3D(Math.random);
export const noise4D = createNoise4D(Math.random);

export const getYPosition = (x: number, z:number) => {
  let y = 2 * noise2D(x / 50, z / 50);
  y += 4 * noise2D(x / 100, z / 100);
  y += 0.2 * noise2D(x / 10, z / 10);
  return y;
}