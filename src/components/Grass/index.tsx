import {
  Color,
  DoubleSide,
  PlaneGeometry,
  TextureLoader,
  RepeatWrapping,
  MeshStandardMaterial,
  type Mesh,
} from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";

import { createGrassGeometry } from "./createGrassGeometry";
import { perlinNoise } from "./shaders/perlinNoise";

import grassTexture from "/textures/grass/blade_diffuse.jpg";
import grassAlpha from "/textures/grass/blade_alpha.jpg";

import { Terrain } from "@components/Terrain";

export function Grass({
  options = { grassWidth: 0.01, grassHeight: 0.12, joints: 2 },
  width = 30,
  instances = 1000000,
  ...props
}) {
  const { grassWidth, grassHeight, joints } = options;

  const materialRef = useRef<Mesh>(null);

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

  const grassMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      side: DoubleSide,
      map: uGrassTexture,
      alphaMap: uGrassAlpha,
      transparent: false,
      alphaTest: 0.5,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.uniforms.cullDistance = { value: 25 };
      shader.uniforms.bladeHeight = { value: grassHeight };
      shader.uniforms.tipColor = {
        value: new Color(0.1, 0.7, 0.1).convertSRGBToLinear(),
      };
      shader.uniforms.bottomColor = {
        value: new Color(0.2, 0.1, 0.0).convertSRGBToLinear(),
      };

      shader.vertexShader = `
        ${perlinNoise}
        ${shader.vertexShader}
      `;

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
        uniform float cullDistance;

        varying float frc;
        varying float vColorVariation;
        varying vec3 vGrassNormalWorld;
        varying vec3 vGrassPositionWorld;

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

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        vec3 transformed = vec3( position );

        frc = position.y / bladeHeight;

        float timeScale = time / 1.5;
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

        float distanceToCamera = distance(offset, cameraPosition);
        if (distanceToCamera > cullDistance) {
          transformed = vec3(1e8, 1e8, 1e8);
        }

        vec3 grassObjectNormal = vec3(0.0, 1.0, 0.0);
        vec3 grassTransformedNormal = rotateVectorByQuaternion(grassObjectNormal, direction);
        grassTransformedNormal = rotateVectorByQuaternion(grassTransformedNormal, windQuaternion);
        vGrassNormalWorld = normalize(mat3(modelMatrix) * grassTransformedNormal);

        vec4 grassWorldPosition = modelMatrix * vec4(transformed, 1.0);
        vGrassPositionWorld = grassWorldPosition.xyz;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <common>`,
        `
        #include <common>

        varying float frc;
        varying float vColorVariation;
        uniform vec3 tipColor;
        uniform vec3 bottomColor;

        varying vec3 vGrassNormalWorld;
        varying vec3 vGrassPositionWorld;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <alphatest_fragment>`,
        `
        #include <alphatest_fragment>
      
        vec3 adjustedTipColor = tipColor * (1.0 + vColorVariation);
        vec3 adjustedBottomColor = bottomColor * (1.0 + vColorVariation);
      
        vec3 baseColor = mix(adjustedTipColor, diffuseColor.rgb, frc);
        baseColor = mix(adjustedBottomColor, baseColor, frc);
      
        vec3 fixedNormal = vec3(0.0, 1.0, 0.0);
        vec3 viewDir = normalize(cameraPosition - vGrassPositionWorld);
        float fresnel = pow(1.0 - dot(fixedNormal, viewDir), 8.0);
        float fresnelAmount = 1.5;
      
        baseColor = baseColor * (1.0 + fresnel * fresnelAmount);
      
        vec3 grassNormal = normalize(vGrassNormalWorld);
        float cloudShadow = pow(1.0 - dot(grassNormal, viewDir), 3.0);
        float shadowAmount = 0.25;
        vec3 shadowColor = vec3(0.0);
        baseColor = mix(baseColor, shadowColor, cloudShadow * shadowAmount);
      
        diffuseColor.rgb = baseColor;
        `
      );

      materialRef.current!.userData.shader = shader;
    };

    return material;
  }, [uGrassTexture, uGrassAlpha, grassHeight]);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      const shader = materialRef.current.userData.shader;
      shader.uniforms.time.value = state.clock.elapsedTime / 4;
    }
  });

  return (
    <group {...props} castShadow receiveShadow>
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
