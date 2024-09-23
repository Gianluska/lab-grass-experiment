import { Sphere } from "@components/Sphere";

export function Home() {
  return (
    <>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <Sphere position={[0, 0, -10]} scale={0.5} />

      <group>
        <Sphere position={[5, 5, -10]} scale={0.6} />
        <Sphere position={[7, 8, -10]} scale={2} />
        <Sphere position={[6, -1, -10]} scale={2.5} />
        <Sphere position={[11, -11, -10]} scale={5} />
        <Sphere position={[-1, -10, -10]} scale={1.1} />
        <Sphere position={[-7, -7, -10]} scale={1.9} />
        <Sphere position={[-6, 1, -10]} />
        <Sphere position={[-13, 5, -10]} scale={3} />
        <Sphere position={[-3, 10, -10]} scale={2.5} />
      </group>
    </>
  );
}
