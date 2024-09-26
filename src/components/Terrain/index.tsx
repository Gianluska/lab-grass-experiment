import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

const GRASS_BLADES = 10000;
const GRASS_PATCH_SIZE = 10;

export function Terrain() {
  const { mouse, camera } = useThree();

  // Carregar o normal map
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

    for (let i = 0; i < GRASS_BLADES; i++) {
      const x = (Math.random() - 0.5) * GRASS_PATCH_SIZE;
      const z = (Math.random() - 0.5) * GRASS_PATCH_SIZE;
      offsets.push(x, 0, z);

      const angle = Math.random() * Math.PI * 2;
      orientations.push(0, Math.sin(angle / 2), 0, Math.cos(angle / 2));

      const scale = 0.8 + Math.random() * 0.4;
      scales.push(scale);
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

    return instancedGeometry;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mousePosition: { value: new THREE.Vector3() },
        normalMap: { value: normalMap },
      },
      vertexShader: `
        uniform vec3 mousePosition;
        uniform float time;

        attribute vec3 offset;
        attribute vec4 orientation;
        attribute float scale;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        varying vec3 vPosition;

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

          // Normais e tangentes
          vec3 normal = vec3(0.0, 1.0, 0.0);
          vec3 tangent = vec3(1.0, 0.0, 0.0);
          vec3 bitangent = vec3(0.0, 0.0, 1.0);

          // Aplicar orientação
          pos = applyQuaternion(pos, orientation);
          normal = applyQuaternion(normal, orientation);
          tangent = applyQuaternion(tangent, orientation);
          bitangent = applyQuaternion(bitangent, orientation);

          // Aplicar offset
          pos += offset;

          vUv = uv;
          vNormal = normalMatrix * normal;
          vTangent = normalMatrix * tangent;
          vBitangent = normalMatrix * bitangent;
          vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D normalMap;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        varying vec3 vPosition;

        void main() {
          // Amostrar o normal map
          vec3 normalTex = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;

          // Construir a matriz TBN
          mat3 TBN = mat3(normalize(vTangent), normalize(vBitangent), normalize(vNormal));

          // Transformar o normal
          vec3 normal = normalize(TBN * normalTex);

          // Luz direcional simples
          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
          float diffuse = max(dot(normal, lightDir), 0.0);

          // Cor base com gradiente
          vec3 bottomColor = vec3(0.1, 0.5, 0.1);
          vec3 topColor = vec3(0.5, 1.0, 0.5);
          vec3 baseColor = mix(bottomColor, topColor, vUv.y);

          // Cor final
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