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

import grassTexture from "/textures/grass/blade_diffuse.jpg";
import grassAlpha from "/textures/grass/blade_alpha.jpg";

import { Terrain } from "@components/Terrain";

const GrassMaterial = shaderMaterial(
  {
    bladeHeight: 0.15,
    uGrassTexture: null,
    uGrassAlpha: null,
    time: 0,
    tipColor: new Color(0.1, 0.4, 0.2).convertSRGBToLinear(),
    bottomColor: new Color(0.14, 0.1, 0.0).convertSRGBToLinear(),
    mousePosition: new Vector3(0, 0, 0),
    vCameraPosition: new Vector3(),
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
  options = { grassWidth: 0.01, grassHeight: 0.15, joints: 2 },
  width = 30,
  instances = 1000000,
  ...props
}) {
  const { camera, size } = useThree();
  const [mousePosition, setMousePosition] = useState(new Vector3(0, 0, 0));

  const { grassWidth, grassHeight, joints } = options;

  const materialRef = useRef<ShaderMaterial>();

  const [uGrassTexture] = useLoader(TextureLoader, [grassTexture]);
  const [uGrassAlpha] = useLoader(TextureLoader, [grassAlpha]);

  [uGrassTexture].forEach((texture) => {
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
      materialRef.current.uniforms.vCameraPosition.value.copy(
        state.camera.position
      );
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
          uGrassTexture={uGrassTexture}
          uGrassAlpha={uGrassAlpha}
          mousePosition={mousePosition}
        />
      </mesh>
      <Terrain width={width} />
    </group>
  );
}
