import { Terrain } from "@components/Terrain";
import { OrbitControls } from "@react-three/drei";

export function Home() {
  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <Terrain />
    </>
  );
}
