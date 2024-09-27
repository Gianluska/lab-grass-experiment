import { InstancedBufferAttribute, InstancedBufferGeometry, MathUtils, PlaneGeometry } from "three";

export function createGrassGeometry({
  GRASS_BLADES,
  GRASS_PATCH_SIZE,
}: {GRASS_BLADES: number, GRASS_PATCH_SIZE: number}): InstancedBufferGeometry {
  const bladeWidth = 0.05;
  const bladeHeight = 1;
  const joints = 12;

  const baseGeometry = new PlaneGeometry(bladeWidth, bladeHeight, 1, joints);
  const positionAttribute = baseGeometry.attributes.position;

  const bend = 0;

  for (let i = 0; i <= joints; i++) {
    const index1 = i * 3 * 2;
    const index2 = index1 + 3;

    const y = positionAttribute.getY(index1);
    const factor = y / bladeHeight; // Fator de altura da lâmina

    // Curvatura suave ao longo da lâmina
    const curve = Math.sin(factor * Math.PI) * bend;

    // Diminuir a largura da lâmina em direção à ponta
    const scaleFactor = MathUtils.lerp(1, 0.0, factor); // Largura reduzida a zero na ponta

    if (i < joints) {
      // Para todos os segmentos exceto o último, ajustar normalmente
      positionAttribute.setX(index1, positionAttribute.getX(index1) * scaleFactor + curve);
      positionAttribute.setX(index2, positionAttribute.getX(index2) * scaleFactor - curve);

      // Ajustar a posição ao longo do eixo Z para suavizar a curvatura
      positionAttribute.setZ(index1, positionAttribute.getZ(index1) + factor * bend);
      positionAttribute.setZ(index2, positionAttribute.getZ(index2) - factor * bend);
    } else {
      // Para o último segmento, definir ambos os vértices na mesma posição
      const topX = 0.0 + curve;
      const topZ = 0.0 + factor * bend;

      positionAttribute.setX(index1, topX);
      positionAttribute.setX(index2, topX);

      positionAttribute.setZ(index1, topZ);
      positionAttribute.setZ(index2, topZ);
    }
  }

  positionAttribute.needsUpdate = true;

  const instancedGeometry = new InstancedBufferGeometry();
  instancedGeometry.index = baseGeometry.index;
  instancedGeometry.attributes.position = baseGeometry.attributes.position;
  instancedGeometry.attributes.uv = baseGeometry.attributes.uv;

  const offsets: number[] = [];
  const orientations: number[] = [];
  const scalesArr: number[] = [];
  const colorVariations: number[] = [];
  const bottomColorVariations: number[] = [];
  const topColorVariations: number[] = [];
  const curvatures: number[] = [];

  for (let i = 0; i < GRASS_BLADES; i++) {
    const x = (Math.random() - 0.5) * GRASS_PATCH_SIZE;
    const z = (Math.random() - 0.5) * GRASS_PATCH_SIZE;
    offsets.push(x, 0, z);

    const angle = Math.random() * Math.PI * 2;
    orientations.push(0, Math.sin(angle / 2), 0, Math.cos(angle / 2));

    const scale = 0.2 + Math.random() * 1.8;
    scalesArr.push(scale);

    const colorVariation = Math.random();
    colorVariations.push(colorVariation);

    const bottomVariation = Math.random();
    bottomColorVariations.push(bottomVariation);

    const topVariation = Math.random();
    topColorVariations.push(topVariation);

    const curvature =  0.6 * (Math.random() - 0.6);
    curvatures.push(curvature);
  }

  instancedGeometry.setAttribute(
    "offset",
    new InstancedBufferAttribute(new Float32Array(offsets), 3)
  );
  instancedGeometry.setAttribute(
    "orientation",
    new InstancedBufferAttribute(new Float32Array(orientations), 4)
  );
  instancedGeometry.setAttribute(
    "scale",
    new InstancedBufferAttribute(new Float32Array(scalesArr), 1)
  );
  instancedGeometry.setAttribute(
    "colorVariation",
    new InstancedBufferAttribute(new Float32Array(colorVariations), 1)
  );
  instancedGeometry.setAttribute(
    "bottomColorVariation",
    new InstancedBufferAttribute(new Float32Array(bottomColorVariations), 1)
  );
  instancedGeometry.setAttribute(
    "topColorVariation",
    new InstancedBufferAttribute(new Float32Array(topColorVariations), 1)
  );
  instancedGeometry.setAttribute(
    "curvature",
    new InstancedBufferAttribute(new Float32Array(curvatures), 1) // Curvatura
  );

  return instancedGeometry;
}
