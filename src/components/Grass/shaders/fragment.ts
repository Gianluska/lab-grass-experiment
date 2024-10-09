export const fragmentShader = `
precision mediump float;

uniform sampler2D map1;
uniform sampler2D map2;
uniform sampler2D map3;
uniform sampler2D map4;
uniform sampler2D alphaMap1;
uniform sampler2D alphaMap2;
uniform sampler2D alphaMap3;
uniform sampler2D alphaMap4;

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

  if (vTextureIndex < 0.25) {
    col = texture2D(map1, vUv);
    alpha = texture2D(alphaMap1, vUv).r;
  } else if (vTextureIndex < 0.5) {
    col = texture2D(map2, vUv);
    alpha = texture2D(alphaMap2, vUv).r;
  } else if (vTextureIndex < 0.75) {
    col = texture2D(map3, vUv);
    alpha = texture2D(alphaMap3, vUv).r;
  } else {
    col = texture2D(map4, vUv);
    alpha = texture2D(alphaMap4, vUv).r;
  }

  if (alpha < 0.15) discard;

  vec3 tangentNormal = normalize(normalMap * 2.0 - 1.0);

  vec3 N = normalize(vNormal);
  vec3 T = normalize(vec3(1.0, 0.0, 0.0));
  vec3 B = normalize(cross(N, T));
  mat3 TBN = mat3(T, B, N);

  vec3 finalNormal = normalize(TBN * tangentNormal);

  vec3 lightDir = normalize(vec3(-0.3, -1.0, -0.3));
  vec3 lightColor = vec3(0.5, 0.5, 0.7); 
  float lightIntensity = 12.0;

  vec3 adjustedTipColor = tipColor * (1.0 + vColorVariation);
  vec3 adjustedBottomColor = bottomColor * (1.0 + vColorVariation);

  vec3 baseColor = mix(adjustedTipColor, col.rgb, frc);
  baseColor = mix(adjustedBottomColor, baseColor, frc);

  vec3 finalColor = baseColor * lightColor * lightColor * lightIntensity;

  finalColor += baseColor * lightColor;

  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
}

`