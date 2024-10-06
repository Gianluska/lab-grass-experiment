import { Color, DoubleSide, PlaneGeometry, TextureLoader, ShaderMaterial } from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, useLoader, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";

import { vertexShader } from "./shaders/vertex";
import { fragmentShader } from "./shaders/fragment";
import { createGrassGeometry } from "./createGrassGeometry";

import grassTexture1 from "/textures/grass/teste/texture_01.jpg";
import grassTexture2 from "/textures/grass/teste/texture_02.jpg";
import grassTexture3 from "/textures/grass/teste/texture_03.jpg";

import grassAlpha1 from "/textures/grass/teste/alpha_01.jpg";
import grassAlpha2 from "/textures/grass/teste/alpha_02.jpg";
import grassAlpha3 from "/textures/grass/teste/alpha_03.jpg";

import { Terrain } from "@components/Terrain";

const GrassMaterial = shaderMaterial(
  {
    bladeHeight: 1,
    map1: null,
    map2: null,
    map3: null,
    alphaMap1: null,
    alphaMap2: null,
    alphaMap3: null,
    time: 0,
    tipColor: new Color(0.1, 0.4, 0.2).convertSRGBToLinear(),
    bottomColor: new Color(0.0, 0.1, 0.0).convertSRGBToLinear(),
  },
  vertexShader,
  fragmentShader,
  (self) => {
    if (!self) return;
    self.side = DoubleSide;
  }
);

extend({ GrassMaterial });

export function Grass({
  options = { grassWidth: 0.55, grassHeight: 1, joints: 12 },
  width = 100,
  instances = 200000,
  ...props
}) {
  const { grassWidth, grassHeight, joints } = options;

  const materialRef = useRef<ShaderMaterial>();

  const [texture1, texture2, texture3] = useLoader(TextureLoader, [
    grassTexture1,
    grassTexture2,
    grassTexture3,
  ]);

  const [alphaMap1, alphaMap2, alphaMap3] = useLoader(TextureLoader, [
    grassAlpha1,
    grassAlpha2,
    grassAlpha3,
  ]);

  const attributeData = useMemo(
    () => createGrassGeometry(instances, width),
    [instances, width]
  );

  const baseGeom = useMemo(
    () =>
      new PlaneGeometry(grassWidth, grassHeight, 1, joints).translate(
        0,
        grassHeight / 2,
        0
      ),
    [grassWidth, grassHeight, joints]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime / 4;
    }
  });

  return (
    <group {...props}>
      <mesh>
        <instancedBufferGeometry
          index={baseGeom.index}
          attributes={baseGeom.attributes}
        >
          <instancedBufferAttribute
            attach="attributes-offset"
            args={[new Float32Array(attributeData.offsets), 3]}
          />
          <instancedBufferAttribute
            attach="attributes-orientation"
            args={[new Float32Array(attributeData.orientations), 4]}
          />
          <instancedBufferAttribute
            attach="attributes-stretch"
            args={[new Float32Array(attributeData.stretches), 1]}
          />
          <instancedBufferAttribute
            attach="attributes-colorVariation"
            args={[new Float32Array(attributeData.colorVariations), 1]}
          />
          <instancedBufferAttribute
            attach="attributes-textureIndex"
            args={[new Float32Array(attributeData.textureIndices), 1]}
          />
        </instancedBufferGeometry>

        {/* @ts-expect-error - Custom grassMaterial */}
        <grassMaterial
          ref={materialRef}
          map1={texture1}
          map2={texture2}
          map3={texture3}
          alphaMap1={alphaMap1}
          alphaMap2={alphaMap2}
          alphaMap3={alphaMap3}
          toneMapped={false}
        />
      </mesh>
      <Terrain width={width} />
    </group>
  );
}
