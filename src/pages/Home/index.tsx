import { Grass } from "@components/Grass";
import { InsectParticles } from "@components/Particles";
import { OrbitControls, Sky, Stats } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense } from "react";
import { SSAOPass } from "three-stdlib"

extend({ SSAOPass });

export function Home() {
  const { cameraPosition } = useControls("Camera", {
    cameraPosition: {
      value: { x: 8.6, y: -0.8, z: -7.8 },
      step: 0.1,
    },
  });

  useFrame(({ camera }) => {
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
  });

  return (
    <>
      <Sky distance={50} sunPosition={[1, 1, 0]} azimuth={0.25} />

      <ambientLight intensity={0.5} color="#eeffeb" />

      <directionalLight
        position={[100, 200, 100]}
        intensity={1.3}
        color="#fdf79e"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      <Suspense fallback={null}>
        <Grass />
        <InsectParticles count={1000} />
      </Suspense>

      <Stats />

      <OrbitControls />
    </>
  );
}
