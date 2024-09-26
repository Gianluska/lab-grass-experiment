import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

const GRASS_BLADES = 200000;
const GRASS_PATCH_SIZE = 30;

export function Terrain() {
  const { mouse, camera } = useThree();

  // Carregar o normal map (opcional)
  const normalMap = useLoader(THREE.TextureLoader, "/GRASS_NORMAL.png");
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

  const geometry = useMemo(() => {
    const bladeWidth = 0.03;
    const bladeHeight = 1;
    const joints = 4;

    const baseGeometry = new THREE.PlaneGeometry(
      bladeWidth,
      bladeHeight,
      1,
      joints
    );
    const positionAttribute = baseGeometry.attributes.position;

    for (let i = 0; i <= joints; i++) {
      const index = i * 3 * 2;

      const y = positionAttribute.getY(index);
      const scale = 1 - y / bladeHeight;

      positionAttribute.setX(index, positionAttribute.getX(index) * scale);
      positionAttribute.setX(
        index + 1,
        positionAttribute.getX(index + 1) * scale
      );

      const bend = 0.1;
      const angle = (y / bladeHeight) * bend;
      positionAttribute.setZ(index, Math.sin(angle));
      positionAttribute.setZ(index + 1, Math.sin(angle));
    }

    positionAttribute.needsUpdate = true;

    const instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.index = baseGeometry.index;
    instancedGeometry.attributes = baseGeometry.attributes;

    const offsets = [];
    const orientations = [];
    const scales = [];
    const colorVariations = [];
    const bottomColorVariations = [];
    const topColorVariations = [];

    for (let i = 0; i < GRASS_BLADES; i++) {
      const x = (Math.random() - 0.5) * GRASS_PATCH_SIZE;
      const z = (Math.random() - 0.5) * GRASS_PATCH_SIZE;
      offsets.push(x, 0, z);

      const angle = Math.random() * Math.PI * 2;
      orientations.push(0, Math.sin(angle / 2), 0, Math.cos(angle / 2));

      const scale = 0.8 + Math.random() * 0.4;
      scales.push(scale);

      // Gerar valor aleatório para variação de cor
      const colorVariation = Math.random();
      colorVariations.push(colorVariation);

      // Gerar valores aleatórios para variações de bottomColor e topColor
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
      new THREE.InstancedBufferAttribute(new Float32Array(scales), 1)
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

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mousePosition: { value: new THREE.Vector3() },
        normalMap: { value: normalMap }, // Mantenha se desejar o normal mapping
      },
      vertexShader: `
        uniform vec3 mousePosition;
        uniform float time;

        attribute vec3 offset;
        attribute vec4 orientation;
        attribute float scale;
        attribute float colorVariation;
        attribute float bottomColorVariation;
        attribute float topColorVariation;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vColorVariation;
        varying float vBottomColorVariation;
        varying float vTopColorVariation;

        vec3 applyQuaternion(vec3 v, vec4 q) {
          return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
        }

        void main() {
          vec3 pos = position;

          // Aplicar escala
          pos.y *= scale;

          // Calcular a distância até o mouse no plano XZ
          float dist = length(offset.xz - mousePosition.xz);

          // Definir um raio de influência
          float radius = 1.0;

          // Se dentro do raio, aplicar o deslocamento
          if (dist < radius) {
            float effect = (radius - dist) / radius;
            float sway = sin(time * 2.0 + pos.y * 2.0) * 0.1 * effect;
            pos.x += sway;
          }

          // Normais
          vec3 normal = vec3(0.0, 1.0, 0.0);

          // Aplicar orientação
          pos = applyQuaternion(pos, orientation);
          normal = applyQuaternion(normal, orientation);

          // Aplicar offset
          pos += offset;

          vUv = uv;
          vNormal = normalMatrix * normal;
          vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;

          // Passar variações de cor para o fragment shader
          vColorVariation = colorVariation;
          vBottomColorVariation = bottomColorVariation;
          vTopColorVariation = topColorVariation;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vColorVariation;
        varying float vBottomColorVariation;
        varying float vTopColorVariation;

        // Função de hash para gerar ruído
        float hash(float n) { return fract(sin(n) * 43758.5453123); }

        float noise(vec2 x) {
          vec2 i = floor(x);
          vec2 f = fract(x);

          // Interpolação suave
          f = f * f * (3.0 - 2.0 * f);

          float n = i.x + i.y * 57.0;

          float res = mix(
            mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 57.0), hash(n + 58.0), f.x),
            f.y
          );
          return res;
        }

        void main() {
          vec3 normal = normalize(vNormal);

          // Luz direcional simples
          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
          float diffuse = max(dot(normal, lightDir), 0.0);

          // Cores originais do degradê
          vec3 bottomColor = vec3(0.25,0.40,0.20);
          vec3 topColor = vec3(0.15,0.30,0.16);

          // Aplicar variações às cores do degradê
          bottomColor += (vBottomColorVariation - 0.5) * 0.2;
          topColor += (vTopColorVariation - 0.5) * 0.2;

          // Garantir que as cores permaneçam no intervalo válido
          bottomColor = clamp(bottomColor, 0.0, 1.0);
          topColor = clamp(topColor, 0.0, 1.0);

          // Calcular a cor base com o degradê ajustado
          vec3 baseColor = mix(bottomColor, topColor, vUv.y);

          // Aplicar variação de cor por lâmina
          baseColor *= 0.9 + vColorVariation * 0.2;

          // Sombreamento baseado na altura
          float heightFactor = smoothstep(0.0, 0.2, vUv.y);

          // Sombreamento baseado em ruído
          vec2 noiseCoord = vPosition.xz * 0.7;
          float noiseValue = noise(noiseCoord);

          // Combinar os fatores de sombreamento
          float shadowFactor = heightFactor * (0.5 + noiseValue * 0.5);

          // Aplicar o sombreamento ao baseColor
          baseColor *= mix(0.2, 1.0, shadowFactor);

          // Cor final com iluminação
          vec3 color = baseColor * diffuse;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, [normalMap]);

  useFrame(({ clock }) => {
    material.uniforms.time.value = clock.getElapsedTime();

    const mouseNDC = new THREE.Vector2(mouse.x, mouse.y);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseNDC, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    material.uniforms.mousePosition.value.copy(intersectPoint);
  });

  return <instancedMesh args={[geometry, material, GRASS_BLADES]} />;
}
