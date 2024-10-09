import { Grass } from "@components/Grass";
import { OrbitControls, Sky, Stars, Stats } from "@react-three/drei";
import { Suspense } from "react";

export function Home() {
  return (
    <>
      {/* <Stars
        radius={300}
        depth={60}
        count={20000} 
        factor={7}
        saturation={0} 
        fade 
      /> */}
      <Sky />
      
      <ambientLight intensity={0.2} color="#ffffff" />
      
      <directionalLight
        position={[50, 100, 50]}
        intensity={0.8}
        color="#a0c4ff"
        castShadow
      />

      <Suspense fallback={null}>
        <Grass />
      </Suspense>
      
      <Stats />
      
      <OrbitControls />
    </>
  );
}
