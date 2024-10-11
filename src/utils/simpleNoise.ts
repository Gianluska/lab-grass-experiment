import SimplexNoise from "simplex-noise";

const SEED = 40;
const simplex = new SimplexNoise(SEED)

export const getYPosition = (x: number, z:number) => {
  let y = 2 * simplex.noise2D(x / 50, z / 50);
  y += 4 * simplex.noise2D(x / 100, z / 100);
  y += 0.2 * simplex.noise2D(x / 10, z / 10);
  return y;
}