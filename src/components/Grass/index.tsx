// Grass.tsx
import React, { useRef, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { InstancedMesh, Object3D, PlaneGeometry, ShaderMaterial } from 'three';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import heightMapImage from '../../../public/textures/terrain.png'; // Certifique-se de que o caminho esteja correto

const NUM_GRASS = 50000;
const TERRAIN_SIZE = 2000;
const GRASS_WIDTH = 0.1;
const GRASS_HEIGHT = 1.5;

export const Grass: React.FC = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const { clock } = useFrame(() => {});
  const heightMap = useLoader(TextureLoader, heightMapImage);

  // Geometria
  const geometry = new PlaneGeometry(GRASS_WIDTH, GRASS_HEIGHT);
  geometry.rotateX(-Math.PI / 2);

  // Material
  const material = new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      // Você pode adicionar outros uniforms aqui
    },
    vertexShader: `
      uniform float time;
      void main() {
        vec3 pos = position;
        // Animação de oscilação da grama
        float angle = sin(time + instanceMatrix[3][0] * 10.0) * 0.1;
        pos.x += sin(angle);
        pos.y += cos(angle);
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      void main() {
        gl_FragColor = vec4(0.2, 0.8, 0.2, 1.0);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });

  useEffect(() => {
    if (meshRef.current && heightMap.image) {
      const dummy = new Object3D();

      for (let i = 0; i < NUM_GRASS; i++) {
        const x = (Math.random() - 0.5) * TERRAIN_SIZE;
        const z = (Math.random() - 0.5) * TERRAIN_SIZE;

        // Obter a altura y do terreno na posição (x, z)
        const y = getHeightAtPoint(x, z, heightMap);

        dummy.position.set(x, y, z);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [heightMap]);

  // Atualização do uniforme 'time' a cada frame
  useFrame(() => {
    material.uniforms.time.value = clock.getElapsedTime();
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, NUM_GRASS]} castShadow receiveShadow />
  );
};


// Função para obter a altura do terreno na posição (x, z)
function getHeightAtPoint(x: number, z: number, heightMap: THREE.Texture): number {
  // Converter coordenadas (x, z) para coordenadas de textura (u, v)
  const u = (x + TERRAIN_SIZE / 2) / TERRAIN_SIZE;
  const v = 1 - (z + TERRAIN_SIZE / 2) / TERRAIN_SIZE;

  // Obter o valor do pixel no heightMap
  const pixel = getPixel(heightMap.image as HTMLImageElement, u, v);

  // Converter o valor do pixel em altura
  const terrainHeight = 75; // Altura máxima do terreno (ajuste conforme seu terreno)
  const terrainOffset = 50; // Offset do terreno (ajuste conforme necessário)
  const y = (pixel / 255) * terrainHeight - terrainOffset;

  return y;
}

// Função para obter o valor do pixel no mapa de altura
function getPixel(image: HTMLImageElement, u: number, v: number): number {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');
  if (!context) return 0;

  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, image.width, image.height).data;

  const x = Math.floor(u * (image.width - 1));
  const y = Math.floor(v * (image.height - 1));

  const index = (y * image.width + x) * 4; // RGBA, pegamos apenas o R
  const pixel = data[index];

  return pixel;
}
