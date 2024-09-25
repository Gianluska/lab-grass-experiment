import { useMemo } from "react";
import { ReactThreeFiber } from "@react-three/fiber";
import * as THREE from "three";

interface GrassBlade {
  position: ReactThreeFiber.Vector3;
  rotation: ReactThreeFiber.Euler;
  scale: number;
}

export function Grass() {
  const grassBlades = useMemo<GrassBlade[]>(() => {
    const blades: GrassBlade[] = [];
    const count = 10000;

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const rotationY = Math.random() * Math.PI * 2;
      const scale = 0.5 + Math.random() * 1;

      blades.push({
        position: [x, 0, z],
        rotation: [0, rotationY, 0],
        scale,
      });
    }

    return blades;
  }, []);

  const bladeGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.05, 0);
    shape.lineTo(0.05, 0);
    shape.lineTo(0, 1);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
  }, []);

  return (
    <>
      {grassBlades.map((blade, index) => (
        <mesh
          key={index}
          position={blade.position}
          rotation={blade.rotation}
          scale={blade.scale}
        >
          <primitive object={bladeGeometry} attach="geometry" />
          <meshStandardMaterial color="#228B22" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}
