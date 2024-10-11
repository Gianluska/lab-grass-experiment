import { perlinNoise } from "./perlinNoise";

export const fragmentShader = `
precision mediump float;

uniform sampler2D map4;
uniform sampler2D alphaMap4;

uniform vec3 tipColor;
uniform vec3 bottomColor;
uniform float time;

varying vec2 vUv;
varying float frc;
varying float vColorVariation;
varying float vTextureIndex;
uniform vec3 vCameraPosition;

varying vec3 vNormal;
varying vec3 vPosition;

${perlinNoise}

void main() {
  vec4 col;
  float alpha;
  vec3 normalMap;
  float roughness;
  float translucency;

  col = texture2D(map4, vUv);
  alpha = texture2D(alphaMap4, vUv).r;

  if (alpha < 0.15) discard;

  vec3 tangentNormal = normalize(normalMap * 2.0 - 1.0);

  vec3 N = normalize(vNormal);
  vec3 V = normalize(vCameraPosition - vPosition);
  vec3 T = normalize(vec3(1.0, 0.0, 0.0));
  vec3 B = normalize(cross(N, T));
  mat3 TBN = mat3(T, B, N);

  float fresnel = pow(0.6 - dot(N, V), 3.0);

  vec3 finalNormal = normalize(TBN * tangentNormal);

  float cloudSpeed = 0.3;
  vec2 cloudUV = vPosition.xz * 0.1 + vec2(time * cloudSpeed, 0.0); // Escala e movimento
  float cloudNoise = snoise(cloudUV);

  float cloudShadow = smoothstep(0.1, 1.1, cloudNoise);

  vec3 lightDir = normalize(vec3(-0.3, -1.0, -0.3));
  vec3 lightColor = vec3(0.5, 0.5, 0.7); 
  float lightIntensity = mix(1.0, 0.5, cloudShadow) * 3.5;

  vec3 adjustedTipColor = tipColor * (1.0 + vColorVariation);
  vec3 adjustedBottomColor = bottomColor * (1.0 + vColorVariation);

  vec3 baseColor = mix(adjustedTipColor, col.rgb, frc);
  baseColor = mix(adjustedBottomColor, baseColor, frc);

  float fresnelAmount = 0.15;

  vec3 finalColor = mix(baseColor, vec3(1.0), fresnel * fresnelAmount);
  finalColor = finalColor * lightColor * lightIntensity;
  gl_FragColor = vec4(finalColor, 1.0);
}

`;
