import { useMemo, useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { getYPosition } from "utils/simpleNoise";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";

interface FlowersProps {
  count?: number;
  width?: number;
}

export function Flowers({ count = 100, width = 20 }: FlowersProps) {
  const gltf = useGLTF("/models/flower.glb");

  // Armazenar dados das flores
  const flowers = useMemo(() => {
    const flowersArray = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width - width / 2;
      const z = Math.random() * width - width / 2;
      const y = getYPosition(x, z);
      const position = [x, y, z];

      // Offset aleatório para variar o movimento do vento entre as flores
      const windOffset = Math.random() * 100;

      flowersArray.push({ position, windOffset });
    }
    return flowersArray;
  }, [count, width]);

  // Referências para as flores
  const flowerRefs = useRef<Group[]>([]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    flowerRefs.current.forEach((flower, index) => {
      if (flower) {
        const { windOffset } = flowers[index];
        const windStrength = 0.15; // Ajuste conforme necessário
        const frequency = 1; // Ajuste conforme necessário

        // Calcular o ângulo de rotação com base no tempo e no offset
        const angle = Math.sin((time + windOffset) * frequency) * windStrength;

        // Aplicar a rotação em torno do eixo Z
        flower.rotation.z = angle;
      }
    });
  });

  return (
    <group>
      {flowers.map((flowerData, i) => {
        const { position } = flowerData;
        return (
          <FlowerInstance
            key={i}
            gltf={gltf}
            // @ts-expect-error - TS doesn't like the spread operator here
            position={position}
            index={i}
            flowerRefs={flowerRefs}
          />
        );
      })}
    </group>
  );
}

interface FlowerInstanceProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gltf: any;
  position: [number, number, number];
  index: number;
  flowerRefs: React.MutableRefObject<Group[]>;
}

function FlowerInstance({
  gltf,
  position,
  index,
  flowerRefs,
}: FlowerInstanceProps) {
  const ref = useRef<Group>(null);

  useEffect(() => {
    if (ref.current) {
      flowerRefs.current[index] = ref.current;
    }
  }, [ref, index]);

  return (
    <group
      ref={ref}
      position={position}
      rotation={[0, Math.random() * Math.PI * 2, 0]}
      scale={0.1 + Math.random() * 0.1}
      castShadow
      receiveShadow
    >
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

useGLTF.preload("/models/flower.glb");
