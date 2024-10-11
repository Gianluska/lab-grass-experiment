import {
  Color,
  DoubleSide,
  PlaneGeometry,
  TextureLoader,
  RepeatWrapping,
  MeshStandardMaterial,
} from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";

import { createGrassGeometry } from "./createGrassGeometry";
import { perlinNoise } from "./shaders/perlinNoise";

import grassTexture from "/textures/grass/blade_diffuse.jpg";
import grassAlpha from "/textures/grass/blade_alpha.jpg";

import { Terrain } from "@components/Terrain";

export function Grass({
  options = { grassWidth: 0.01, grassHeight: 0.15, joints: 2 },
  width = 30,
  instances = 1000000,
  ...props
}) {
  const { grassWidth, grassHeight, joints } = options;

  const materialRef = useRef<MeshStandardMaterial>(null);

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
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.time.value =
        state.clock.elapsedTime / 4;
    }
  });

  const grassMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      side: DoubleSide,
      map: uGrassTexture,
      alphaMap: uGrassAlpha,
      transparent: true,
      alphaTest: 0.5, // Adicione isto para ativar o descarte baseado no alpha
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.uniforms.bladeHeight = { value: grassHeight };
      shader.uniforms.tipColor = {
        value: new Color(0.1, 0.4, 0.2).convertSRGBToLinear(),
      };
      shader.uniforms.bottomColor = {
        value: new Color(0.14, 0.1, 0.0).convertSRGBToLinear(),
      };

      // Adicione o código do perlin noise
      shader.vertexShader = `
        ${perlinNoise}
        ${shader.vertexShader}
      `;

      // Adicione atributos e uniforms personalizados
      shader.vertexShader = shader.vertexShader.replace(
        `#include <common>`,
        `
        #include <common>

        attribute vec3 offset;
        attribute vec4 orientation;
        attribute float stretch;
        attribute float colorVariation;

        uniform float time;
        uniform float bladeHeight;

        varying float frc;
        varying float vColorVariation;

        vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
          return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
        }

        vec4 slerp(vec4 v0, vec4 v1, float t) {
          normalize(v0);
          normalize(v1);

          float dot_ = dot(v0, v1);

          if (dot_ < 0.0) {
            v1 = -v1;
            dot_ = -dot_;
          }

          const float DOT_THRESHOLD = 0.9995;
          if (dot_ > DOT_THRESHOLD) {
            vec4 result = v0 + t * (v1 - v0);
            normalize(result);
            return result;
          }

          float theta_0 = acos(dot_);
          float theta = theta_0 * t;
          float sin_theta = sin(theta);
          float sin_theta_0 = sin(theta_0);

          float s0 = cos(theta) - dot_ * sin_theta / sin_theta_0;
          float s1 = sin_theta / sin_theta_0;

          return s0 * v0 + s1 * v1;
        }
        `
      );

      // Modifique a transformação da posição
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        vec3 transformed = vec3( position );

        frc = position.y / bladeHeight;

        float timeScale = time / 1.2;
        float noise = 0.0 - snoise(vec2(
          timeScale - offset.x / 10.0,
          timeScale - offset.z / 10.0
        ));

        vec4 direction = vec4(0.0, 0.0, 0.0, 1.0);
        direction = slerp(direction, orientation, frc);

        vec3 vPositionLocal = vec3(
          position.x,
          position.y + position.y * stretch,
          position.z
        );
        vPositionLocal = rotateVectorByQuaternion(vPositionLocal, direction);

        float windHalfAngle = noise * 0.35 * frc;
        vec4 windQuaternion = normalize(vec4(
          sin(windHalfAngle),
          2.0,
          -sin(windHalfAngle),
          cos(windHalfAngle)
        ));
        vPositionLocal = rotateVectorByQuaternion(vPositionLocal, windQuaternion);

        transformed = vPositionLocal + offset;
        `
      );

      // Adicione varyings e uniforms ao fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <common>`,
        `
        #include <common>

        varying float frc;
        varying float vColorVariation;
        uniform vec3 tipColor;
        uniform vec3 bottomColor;
        `
      );

      // Modifique a cor final após o processamento do alphaMap e do alphaTest
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <alphatest_fragment>`,
        `
        #include <alphatest_fragment>

        // Nosso código personalizado
        vec3 adjustedTipColor = tipColor * (1.0 + vColorVariation);
        vec3 adjustedBottomColor = bottomColor * (1.0 + vColorVariation);

        vec3 baseColor = mix(adjustedTipColor, diffuseColor.rgb, frc);
        baseColor = mix(adjustedBottomColor, baseColor, frc);

        diffuseColor.rgb = baseColor;
        `
      );

      materialRef.current!.userData.shader = shader;
    };

    return material;
  }, [uGrassTexture, uGrassAlpha, grassHeight]);

  return (
    <group {...props}>
      <mesh material={grassMaterial} ref={materialRef}>
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
        </instancedBufferGeometry>
      </mesh>
      <Terrain width={width} />
    </group>
  );
}
