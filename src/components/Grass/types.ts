export type BladeOptions = {
  width: number;
  height: number;
  joints: number;
}

export type GrassProps = {
  bladeOptions?: BladeOptions;
  width?: number;
  instances?: number;
}

export type GrassGeometryProps = {
  instances: number;
  bladeOptions: BladeOptions;
}

export type Quartenion = {
  x: number,
  y: number,
  z: number,
  w: number
}