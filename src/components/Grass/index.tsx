import {
  Color,
  DoubleSide,
  PlaneGeometry,
  TextureLoader,
  ShaderMaterial,
  RepeatWrapping,
  Vector3,
  Raycaster,
  Vector2,
  Plane,
} from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, useLoader, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useState, useEffect } from "react";

import { vertexShader } from "./shaders/vertex";
import { fragmentShader } from "./shaders/fragment";
import { createGrassGeometry } from "./createGrassGeometry";

import grassTexture1 from "/textures/grass/albedo/texture_01.jpg";
import grassTexture2 from "/textures/grass/albedo/texture_02.jpg";
import grassTexture3 from "/textures/grass/albedo/texture_03.jpg";
import grassTexture4 from "/textures/grass/texture.jpg";

import grassAlpha1 from "/textures/grass/alpha/alpha_01.jpg";
import grassAlpha2 from "/textures/grass/alpha/alpha_02.jpg";
import grassAlpha3 from "/textures/grass/alpha/alpha_03.jpg";
import grassAlpha4 from "/textures/grass/alpha_map.jpg";

import { Terrain } from "@components/Terrain";
import { sRGBEncoding } from "@react-three/drei/helpers/deprecated";

const GrassMaterial = shaderMaterial(
  {
    bladeHeight: 1.5,
    map1: null,
    map2: null,
    map3: null,
    map4: null,
    alphaMap1: null,
    alphaMap2: null,
    alphaMap3: null,
    alphaMap4: null,
    time: 0,
    tipColor: new Color(0.1, 0.4, 0.2).convertSRGBToLinear(),
    bottomColor: new Color(0.0, 0.1, 0.0).convertSRGBToLinear(),
    mousePosition: new Vector3(0, 0, 0),
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
  options = { grassWidth: 0.45, grassHeight: 1.5, joints: 2 },
  width = 20,
  instances = 10000,
  ...props
}) {
  const { camera, size } = useThree();
  const [mousePosition, setMousePosition] = useState(new Vector3(0, 0, 0));

  const { grassWidth, grassHeight, joints } = options;

  const materialRef = useRef<ShaderMaterial>();

  const [texture1, texture2, texture3, texture4] = useLoader(TextureLoader, [
    grassTexture1,
    grassTexture2,
    grassTexture3,
    grassTexture4,
  ]);

  const [alphaMap1, alphaMap2, alphaMap3, alphaMap4] = useLoader(
    TextureLoader,
    [grassAlpha1, grassAlpha2, grassAlpha3, grassAlpha4]
  );

  [texture1, texture2, texture3, texture4].forEach((texture) => {
    // @ts-expect-error - Encoding is deprecated
    texture.encoding = sRGBEncoding;
    texture.wrapS = texture.wrapT = RepeatWrapping;
  });

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
      materialRef.current.uniforms.mousePosition.value.copy(mousePosition);
    }
  });

  useEffect(() => {
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / size.width) * 2 - 1;
      mouse.y = -(event.clientY / size.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const planeNormal = new Vector3(0, 1, 0);
      const plane = new Plane(planeNormal, 0);

      const intersectionPoint = new Vector3();
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      setMousePosition(intersectionPoint);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [camera, size]);

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
          map4={texture4}
          alphaMap1={alphaMap1}
          alphaMap2={alphaMap2}
          alphaMap3={alphaMap3}
          alphaMap4={alphaMap4}
          mousePosition={mousePosition}
          tipColor={new Color(0.3, 0.4, 0.2).convertSRGBToLinear()}
        />
      </mesh>
      <Terrain width={width} />
    </group>
  );
}
