export const fragmentShader = `
precision mediump float;

uniform sampler2D map1;
uniform sampler2D map2;
uniform sampler2D map3;
uniform sampler2D alphaMap1;
uniform sampler2D alphaMap2;
uniform sampler2D alphaMap3;
uniform sampler2D normalMap1;
uniform sampler2D normalMap2;
uniform sampler2D normalMap3;
uniform sampler2D roughnessMap1;
uniform sampler2D roughnessMap2;
uniform sampler2D roughnessMap3;
uniform sampler2D translucencyMap1;
uniform sampler2D translucencyMap2;
uniform sampler2D translucencyMap3;

uniform vec3 tipColor;
uniform vec3 bottomColor;

varying vec2 vUv;
varying float frc;
varying float vColorVariation;
varying float vTextureIndex;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec4 col;
  float alpha;
  vec3 normalMap;
  float roughness;
  float translucency;

  if (vTextureIndex < 0.3333) {
    col = texture2D(map1, vUv);
    alpha = texture2D(alphaMap1, vUv).r;
    normalMap = texture2D(normalMap1, vUv).rgb;
    roughness = texture2D(roughnessMap1, vUv).r;
    translucency = texture2D(translucencyMap1, vUv).r;
  } else if (vTextureIndex < 0.6666) {
    col = texture2D(map2, vUv);
    alpha = texture2D(alphaMap2, vUv).r;
    normalMap = texture2D(normalMap2, vUv).rgb;
    roughness = texture2D(roughnessMap2, vUv).r;
    translucency = texture2D(translucencyMap2, vUv).r;
  } else {
    col = texture2D(map3, vUv);
    alpha = texture2D(alphaMap3, vUv).r;
    normalMap = texture2D(normalMap3, vUv).rgb;
    roughness = texture2D(roughnessMap3, vUv).r;
    translucency = texture2D(translucencyMap3, vUv).r;
  }

  if (alpha < 0.15) discard;

  vec3 tangentNormal = normalize(normalMap * 2.0 - 1.0);

  vec3 N = normalize(vNormal);
  vec3 T = normalize(vec3(1.0, 0.0, 0.0)); // Supondo tangente em X
  vec3 B = normalize(cross(N, T));
  mat3 TBN = mat3(T, B, N);

  vec3 finalNormal = normalize(TBN * tangentNormal);

  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
  float lightIntensity = 0.8; // 80% da intensidade

  vec3 viewDir = normalize(-vPosition);

  float diff = max(dot(finalNormal, lightDir), 0.0) * 0.7;
  diff *= lightIntensity;

  vec3 halfVector = normalize(lightDir + viewDir);
  float NdotH = max(dot(finalNormal, halfVector), 0.0);
  float adjustedRoughness = pow(roughness, 1.2); // Aplica uma raiz quadrada
  float specPower = mix(100.0, 1.0, adjustedRoughness);
  float spec = pow(NdotH, specPower);

  float translucencyFactor = translucency * max(dot(-lightDir, finalNormal), 0.0);

  vec3 adjustedTipColor = tipColor * (1.0 + vColorVariation);
  vec3 adjustedBottomColor = bottomColor * (1.0 + vColorVariation);

  vec3 baseColor = mix(adjustedTipColor, col.rgb, frc);
  baseColor = mix(adjustedBottomColor, baseColor, frc);

  vec3 finalColor = baseColor * diff + vec3(1.0) * spec * 0.1;

  finalColor += baseColor * translucencyFactor * 0.2;

  gl_FragColor = vec4(finalColor, 1.0);
}
`