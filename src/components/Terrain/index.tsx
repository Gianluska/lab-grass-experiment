
import { useMemo } from "react";

import { DoubleSide, PlaneGeometry, Vector3 } from "three";
import { Geometry } from "three/examples/jsm/deprecated/Geometry";

import { getYPosition } from "utils/simpleNoise";

export function Terrain({width = 30}) {
  const groundGeo = useMemo(() => {
    const geo = new Geometry().fromBufferGeometry(
      new PlaneGeometry(width, width, 32, 32)
    );

    geo.verticesNeedUpdate = true;
    geo.lookAt(new Vector3(0, 1, 0));

    for (let i = 0; i < geo.vertices.length; i++) {
      const v = geo.vertices[i];
      v.y = getYPosition(v.x, v.z);
    }

    geo.computeVertexNormals();
    
    return geo.toBufferGeometry();
  }, [width]);
  
  return (
    <mesh position={[0, 0, 0]} geometry={groundGeo}>
    <meshStandardMaterial side={DoubleSide} color="#201401" />
  </mesh>
  );
}