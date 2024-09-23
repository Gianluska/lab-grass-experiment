import { useMemo } from "react";
import { Vector3 } from "three";

export function Sphere({ position = [0, 0, 0], color = "black", ...props }) {
  const vecPosition = useMemo(() => new Vector3(...position), [position]);

  return (
    <mesh position={vecPosition} {...props}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
