import { useRef, useMemo } from "react";

import {
  PlaneBufferGeometry,
  TextureLoader,
} from "three";
import { useFrame, useLoader } from "@react-three/fiber";

import { createGrassGeometry } from "./createGrassGeometry";

import bladeAlpha from "/textures/grass/blade_alpha.jpg";
import bladeDiffuse from "/textures/grass/blade_diffuse.jpg";

import "./grassMaterial";
import { Terrain } from "@components/Terrain";

export function Grass({
  options = { grassWidth: 0.15, grassHeight: 1, joints: 12 },
  width = 200,
  instances = 300000,
  ...props
}) {
  const { grassWidth, grassHeight, joints } = options;

  const materialRef = useRef();

  const [texture, alphaMap] = useLoader(TextureLoader, [
    bladeDiffuse,
    bladeAlpha,
  ]);

  const attributeData = useMemo(
    () => createGrassGeometry(instances, width),
    [instances, width]
  );

  const baseGeom = useMemo(
    () =>
      new PlaneBufferGeometry(grassWidth, grassHeight, 1, joints).translate(
        0,
        grassHeight / 2,
        0
      ),
    [grassWidth, grassHeight, joints]
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.time.value = state.clock.elapsedTime / 4;
  });

  return (
    <group {...props}>
      <mesh>
        <instancedBufferGeometry
          index={baseGeom.index}
          attributes-position={baseGeom.attributes.position}
          attributes-uv={baseGeom.attributes.uv}
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
            attach="attributes-halfRootAngleSin"
            args={[new Float32Array(attributeData.halfRootAngleSin), 1]}
          />
          <instancedBufferAttribute
            attach="attributes-halfRootAngleCos"
            args={[new Float32Array(attributeData.halfRootAngleCos), 1]}
          />
        </instancedBufferGeometry>

        {/* @ts-expect-error - Custom grassMaterial */}
        <grassMaterial
          ref={materialRef}
          map={texture}
          alphaMap={alphaMap}
          toneMapped={false}
        />
      </mesh>
      <Terrain width={width} />
    </group>
  );
}
