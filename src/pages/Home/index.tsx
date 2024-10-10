import { Grass } from "@components/Grass";
import { OrbitControls, Sky, Stats } from "@react-three/drei";
import { Suspense } from "react";

export function Home() {
  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
        rayleigh={2}
        turbidity={10}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      <ambientLight intensity={0.1} color="#ffffff" />

      <directionalLight
        position={[100, 200, 100]}
        intensity={0.5}
        color="#ffffff"
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
      </Suspense>

      <Stats />

      <OrbitControls />
    </>
  );
}
