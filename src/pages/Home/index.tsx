import { Grass } from "@components/Grass";
import { OrbitControls, Sky, Stats } from "@react-three/drei";
import { Suspense } from "react";

export function Home() {
  return (
    <>
      <Sky />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <Grass />
        {/* <Terrain /> */}
      </Suspense>
      <Stats />
      <OrbitControls />
    </>
  );
}
