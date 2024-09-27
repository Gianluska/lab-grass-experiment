// src/components/Terrain.tsx

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { vertexShader } from "./shaders/vertex";
import { fragmentShader } from "./shaders/fragment";
import { createGrassGeometry } from "./createGrassGeometry";
import {
  Color,
  DirectionalLight,
  DoubleSide,
  Matrix4,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  Vector3,
  Texture,         // Importado para tipagem
} from "three";

const GRASS_BLADES = 100000; // Reduzido para melhor performance
const GRASS_PATCH_SIZE = 100;

export function Terrain() {
  const { scene } = useThree();

  // Carregar o normal map
  const normalMap = useLoader(TextureLoader, "/textures/grass/grass_normal.png") as Texture;
  const alphaMap = useLoader(TextureLoader, "/textures/grass/grass_alpha_map.png") as Texture;
  const grassTexture = useLoader(TextureLoader, "/textures/grass/grass_texture.png") as Texture;


  // Configurações de iluminação
  const windDirection = useMemo(() => new Vector2(1.0, 0.0).normalize(), []);

  const ambientLightColor = useMemo(() => new Color(0.2, 0.2, 0.2), []);
  const lightColor = useMemo(() => new Color(1.0, 1.0, 1.0), []);
  const lightDirection = useMemo(
    () => new Vector3(0.5, 1.0, 0.5).normalize(),
    []
  );

  const roughness = useMemo(() => 0.2, []);
  const metalness = useMemo(() => 0.0, []);

  // Criar a geometria das lâminas de grama
  const geometry = useMemo(
    () => createGrassGeometry({ GRASS_BLADES, GRASS_PATCH_SIZE }),
    []
  );

  // Criar o material do shader com suporte a sombras e normal map
  const material = useMemo(() => {
    const shaderMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        normalMap: { value: normalMap },
        alphaMap: { value: alphaMap },
        grassTexture: { value: grassTexture },
        windDirection: { value: windDirection },
        ambientLightColor: { value: ambientLightColor },
        lightDirection: { value: lightDirection },
        lightColor: { value: lightColor },
        roughness: { value: roughness },
        metalness: { value: metalness },
        shadowMap: { value: null },
        shadowMatrix: { value: new Matrix4() },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: DoubleSide,
    });

    return shaderMaterial;
  }, [
    normalMap,
    alphaMap,
    windDirection,
    ambientLightColor,
    lightDirection,
    lightColor,
    roughness,
    metalness,
    grassTexture
  ]);

  // Atualizar os uniforms a cada frame
  useFrame(({ clock }) => {
    material.uniforms.time.value = clock.getElapsedTime();

    const directionalLight = scene.children.find(
      (child) => child instanceof DirectionalLight
    ) as DirectionalLight | undefined;

    if (
      directionalLight &&
      directionalLight.castShadow &&
      directionalLight.shadow.map
    ) {
      const shadowMatrix = new Matrix4();
      shadowMatrix.multiplyMatrices(
        directionalLight.shadow.camera.projectionMatrix,
        directionalLight.shadow.matrix
      );
      material.uniforms.shadowMatrix.value.copy(shadowMatrix);

      material.uniforms.shadowMap.value = directionalLight.shadow.map.texture;
    }
  });

  return (
    <instancedMesh
      args={[geometry, material, GRASS_BLADES]}
      castShadow
      receiveShadow
      position={[0, 0, 0]}
    />
  );
}
