// src/shaders/vertex.ts

import { perlinNoise } from "./perlinNoise";

export const vertexShader = `
  ${perlinNoise}

  uniform float time;
  uniform vec2 windDirection;
  uniform mat4 shadowMatrix;

  attribute vec3 offset;
  attribute vec4 orientation;
  attribute float scale;
  attribute float colorVariation;
  attribute float bottomColorVariation;
  attribute float topColorVariation;
  attribute float curvature;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vTangent;
  varying vec3 vBitangent;
  varying vec3 vViewPosition;

  varying float vColorVariation;
  varying float vBottomColorVariation;
  varying float vTopColorVariation;

  varying vec4 vShadowCoord;

  // Função para aplicar quaternion
  vec3 applyQuaternion(vec3 position, vec4 q) {
    return position + 2.0 * cross(q.xyz, cross(q.xyz, position) + q.w * position);
  }

  void main() {
    vec3 pos = position;
  
    // Aplicar escala com aleatoriedade
    pos *= scale;
  
    // Calcular o peso com base na altura da lâmina
    float weight = uv.y; // 0 na base, 1 no topo
  
    // Aplicar orientação
    pos = applyQuaternion(pos, orientation);
    vec3 tangent = applyQuaternion(vec3(1.0, 0.0, 0.0), orientation);
    vec3 bitangent = applyQuaternion(vec3(0.0, 0.0, 1.0), orientation);
    vec3 normal = applyQuaternion(vec3(0.0, 1.0, 0.0), orientation);
  
    // Passar vetores para os varyings
    vNormal = normalize(normalMatrix * normal);
    vTangent = normalize(normalMatrix * tangent);
    vBitangent = normalize(normalMatrix * bitangent);
  
    // Simular o vento usando Perlin Noise
    float noiseScale = 0.08;
    float noiseStrength = 0.6;
    float noiseSpeed = 0.25;
  
    // Calcular a posição do ruído
    vec2 noisePos = (offset.xz * noiseScale) + (windDirection * time * noiseSpeed);
  
    // Calcular o valor do ruído
    float noiseValue = snoise(vec3(noisePos, time * noiseSpeed));
  
    // Modulação do ruído
    vec2 noiseBend = windDirection * noiseValue * noiseStrength * weight;
  
    // Deslocamento total do vento
    vec2 windDisplacement = noiseBend;
  
    // Aplicar o deslocamento à posição (direção global)
    pos.x += windDisplacement.x;
    pos.z += windDisplacement.y;
  
    // Aplicar offset
    pos += offset;
  
    // Aplicar curvatura suave e variada com suavização
    float curveAmount = curvature * sin(uv.y * 3.1415) * 0.5;
    pos.x += curveAmount * 0.5;
    pos.z += curveAmount * 0.5;
  
    // Transformar para o espaço da câmera
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
    // Passar coordenadas de sombra
    vShadowCoord = shadowMatrix * vec4(pos, 1.0);
  
    // Passar variáveis para o fragment shader
    vUv = uv;
    vViewPosition = -mvPosition.xyz;
  
    vColorVariation = colorVariation;
    vBottomColorVariation = bottomColorVariation;
    vTopColorVariation = topColorVariation;
  
    gl_Position = projectionMatrix * mvPosition;
  }
`;
