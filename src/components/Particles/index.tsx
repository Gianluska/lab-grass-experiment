import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  ShaderMaterial,
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";

function createParticleGeometry(count: number) {
  const geometry = new BufferGeometry();
  const positions = [];
  const velocities = [];
  const sizes = [];

  for (let i = 0; i < count; i++) {
    positions.push(
      (Math.random() - 0.5) * 20,
      Math.random(),
      (Math.random() - 0.5) * 20
    );

    velocities.push(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    );

    sizes.push(Math.random() * 0.08);
  }

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new Float32BufferAttribute(velocities, 3));
  geometry.setAttribute("size", new Float32BufferAttribute(sizes, 1));

  return geometry;
}

export function InsectParticles({ count = 1000 }) {
  const particleMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute vec3 velocity;
        varying vec4 vColor;

        void main() {
          vec3 pos = position + velocity * time;

          // Defina os limites da área
          float limit = 10.0;

          // Aplica movimento errático usando funções seno
          pos.x += sin(time * velocity.x * 2.0) * 0.5;
          pos.y += sin(time * velocity.y * 2.0) * 0.5;
          pos.z += sin(time * velocity.z * 2.0) * 0.5;

          // Implementa o rebote nas bordas
          pos.x = mod(pos.x + limit, 2.0 * limit) - limit;
          pos.y = mod(pos.y + limit, 2.0 * limit) - limit;
          pos.z = mod(pos.z + limit, 2.0 * limit) - limit;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          vColor = vec4(abs(velocity), 1.0);
        }

      `,
      fragmentShader: `
        varying vec4 vColor;

        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) {
            discard;
          }
          gl_FragColor = vColor;
        }
      `,
      blending: AdditiveBlending,
      depthTest: false,
    });
  }, []);

  const particleGeometry = useMemo(
    () => createParticleGeometry(count),
    [count]
  );

  useFrame(({ clock }) => {
    particleMaterial.uniforms.time.value = clock.getElapsedTime();
  });

  return <points geometry={particleGeometry} material={particleMaterial} />;
}
