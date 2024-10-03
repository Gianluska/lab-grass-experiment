import { useMemo } from "react";
import { DoubleSide, PlaneGeometry } from "three";
import { getYPosition } from "utils/simpleNoise";

export function Terrain({ width = 30 }) {
  const groundGeo = useMemo(() => {
    const geo = new PlaneGeometry(width, width, 32, 32);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const y = getYPosition(x, z);
      positions[i + 1] = y;
    }

    geo.computeVertexNormals();

    return geo;
  }, [width]);

  return (
    <mesh geometry={groundGeo}>
      <meshStandardMaterial side={DoubleSide} color="#201401" />
    </mesh>
  );
}
