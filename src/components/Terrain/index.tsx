
import { useMemo } from "react";
import { DoubleSide, PlaneGeometry } from "three";
import { getYPosition } from "utils/simpleNoise";

export function Terrain({width = 30}) {
  const groundGeo = useMemo(() => {
    const groundGeometry = new PlaneGeometry(width, width, 32, 32);
    
    groundGeometry.rotateX(-Math.PI / 2);
  
    const positionAttribute = groundGeometry.attributes.position;
    const vertices = positionAttribute.array;
  
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      vertices[i + 1] = getYPosition(x, z);
    }
  
    positionAttribute.needsUpdate = true;
  
    groundGeometry.computeVertexNormals();
  
    return groundGeometry;
  }, [width]);
  
  return (
    <mesh geometry={groundGeo} receiveShadow>
      <meshStandardMaterial side={DoubleSide} color="green" />
    </mesh>
  );
}