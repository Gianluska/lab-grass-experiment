import { Terrain } from "@components/Terrain";
import { OrbitControls } from "@react-three/drei";

const GRASS_PATCH_SIZE = 50;

export function Home() {
  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-GRASS_PATCH_SIZE}
        shadow-camera-right={GRASS_PATCH_SIZE}
        shadow-camera-top={GRASS_PATCH_SIZE}
        shadow-camera-bottom={-GRASS_PATCH_SIZE}
      />

      <Terrain />
    </>
  );
}
