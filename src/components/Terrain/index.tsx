import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

const GRASS_BLADES = 400000; // Número reduzido para melhor desempenho
const GRASS_PATCH_SIZE = 100;

export function Terrain() {
  const { scene } = useThree();

  // Carregar o normal map
  const normalMap = useLoader(THREE.TextureLoader, "/GRASS_NORMAL.png");
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

  // Definir a direção do vento
  const windDirection = useMemo(() => new THREE.Vector2(1.0, 0.0).normalize(), []);

  // Definir cores das luzes
  const ambientLightColor = useMemo(() => new THREE.Color(0.2, 0.2, 0.2), []);
  const lightColor = useMemo(() => new THREE.Color(1.0, 1.0, 1.0), []);
  const lightDirection = useMemo(() => new THREE.Vector3(0.5, 1.0, 0.5).normalize(), []);

  // Propriedades do material
  const roughness = useMemo(() => 0.2, []);
  const metalness = useMemo(() => 0.0, []);

  // Criar a geometria das lâminas de grama
  const geometry = useMemo(() => {
    const bladeWidth = 0.05;
    const bladeHeight = 1;
    const joints = 6;

    const baseGeometry = new THREE.PlaneGeometry(bladeWidth, bladeHeight, 1, joints);
    const positionAttribute = baseGeometry.attributes.position;

    const bend = 0.01;

    for (let i = 0; i <= joints; i++) {
      const index = i * 3 * 2;

      const y = positionAttribute.getY(index);
      const scaleFactor = 1 - y / bladeHeight;

      positionAttribute.setX(index, positionAttribute.getX(index) * scaleFactor);
      positionAttribute.setX(index + 1, positionAttribute.getX(index + 1) * scaleFactor);

      const angle = (y / bladeHeight) * bend;
      positionAttribute.setZ(index, Math.sin(angle));
      positionAttribute.setZ(index + 1, Math.sin(angle));
    }

    positionAttribute.needsUpdate = true;

    const instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.index = baseGeometry.index;
    instancedGeometry.attributes.position = baseGeometry.attributes.position;
    instancedGeometry.attributes.uv = baseGeometry.attributes.uv;

    const offsets = [];
    const orientations = [];
    const scalesArr = [];
    const colorVariations = [];
    const bottomColorVariations = [];
    const topColorVariations = [];

    for (let i = 0; i < GRASS_BLADES; i++) {
      const x = (Math.random() - 0.5) * GRASS_PATCH_SIZE;
      const z = (Math.random() - 0.5) * GRASS_PATCH_SIZE;
      offsets.push(x, 0, z);

      const angle = Math.random() * Math.PI * 2;
      orientations.push(0, Math.sin(angle / 2), 0, Math.cos(angle / 2));

      const scale = 0.8 + Math.random() * 0.4; // Aleatoriedade no tamanho
      scalesArr.push(scale);

      const colorVariation = Math.random();
      colorVariations.push(colorVariation);

      const bottomVariation = Math.random();
      bottomColorVariations.push(bottomVariation);

      const topVariation = Math.random();
      topColorVariations.push(topVariation);
    }

    instancedGeometry.setAttribute(
      "offset",
      new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3)
    );
    instancedGeometry.setAttribute(
      "orientation",
      new THREE.InstancedBufferAttribute(new Float32Array(orientations), 4)
    );
    instancedGeometry.setAttribute(
      "scale",
      new THREE.InstancedBufferAttribute(new Float32Array(scalesArr), 1)
    );
    instancedGeometry.setAttribute(
      "colorVariation",
      new THREE.InstancedBufferAttribute(new Float32Array(colorVariations), 1)
    );
    instancedGeometry.setAttribute(
      "bottomColorVariation",
      new THREE.InstancedBufferAttribute(new Float32Array(bottomColorVariations), 1)
    );
    instancedGeometry.setAttribute(
      "topColorVariation",
      new THREE.InstancedBufferAttribute(new Float32Array(topColorVariations), 1)
    );

    return instancedGeometry;
  }, []);

  // Criar o material do shader com suporte a sombras
  const material = useMemo(() => {
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        normalMap: { value: normalMap },
        windDirection: { value: windDirection },
        ambientLightColor: { value: ambientLightColor },
        lightDirection: { value: lightDirection },
        lightColor: { value: lightColor },
        roughness: { value: roughness },
        metalness: { value: metalness },
        shadowMap: { value: null },
        shadowMatrix: { value: new THREE.Matrix4() },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
    });

    return shaderMaterial;
  }, [
    normalMap,
    windDirection,
    ambientLightColor,
    lightDirection,
    lightColor,
    roughness,
    metalness,
  ]);

  // Atualizar o tempo e os uniformes de sombra a cada frame
  useFrame(({ clock }) => {
    material.uniforms.time.value = clock.getElapsedTime();

    // Encontrar a luz direcional que lança sombras
    const directionalLight = scene.children.find(
      (child) => child instanceof THREE.DirectionalLight
    ) as THREE.DirectionalLight | undefined;

    if (directionalLight && directionalLight.castShadow && directionalLight.shadow.map) {
      // Calcular a shadowMatrix
      const shadowMatrix = new THREE.Matrix4();
      shadowMatrix.multiplyMatrices(
        directionalLight.shadow.camera.projectionMatrix,
        directionalLight.shadow.matrix
      );
      material.uniforms.shadowMatrix.value.copy(shadowMatrix);

      // Atualizar o shadowMap
      material.uniforms.shadowMap.value = directionalLight.shadow.map.texture;
    }
  });

  // Renderizar o instancedMesh com sombras
  return (
    <instancedMesh
      args={[geometry, material, GRASS_BLADES]}
      castShadow
      receiveShadow
    />
  );
}
