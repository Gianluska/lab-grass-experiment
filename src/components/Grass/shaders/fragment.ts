export const fragmentShader = `
precision mediump float;

uniform sampler2D map1;
uniform sampler2D map2;
uniform sampler2D map3;
uniform sampler2D alphaMap1;
uniform sampler2D alphaMap2;
uniform sampler2D alphaMap3;
uniform vec3 tipColor;
uniform vec3 bottomColor;

varying vec2 vUv;
varying float frc;
varying float vColorVariation;
varying float vTextureIndex;

void main() {
  vec4 col;
  float alpha;

  if (vTextureIndex < 0.3333) {
    col = texture2D(map1, vUv);
    alpha = texture2D(alphaMap1, vUv).r;
  } else if (vTextureIndex < 0.6666) {
    col = texture2D(map2, vUv);
    alpha = texture2D(alphaMap2, vUv).r;
  } else {
    col = texture2D(map3, vUv);
    alpha = texture2D(alphaMap3, vUv).r;
  }

  if (alpha < 0.15) discard;

  // Ajustar as cores com variação
  vec3 adjustedTipColor = tipColor * (1.0 + vColorVariation);
  vec3 adjustedBottomColor = bottomColor * (1.0 + vColorVariation);

  // Adicionar mais verde em direção à raiz com variação
  col.rgb = mix(adjustedTipColor, col.rgb, frc);

  // Adicionar uma sombra em direção à raiz com variação
  col.rgb = mix(adjustedBottomColor, col.rgb, frc);

  gl_FragColor = col;
}


`
