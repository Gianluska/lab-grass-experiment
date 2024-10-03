export const fragmentShader = `
precision mediump float;

uniform sampler2D map;
uniform sampler2D alphaMap;
uniform vec3 tipColor;
uniform vec3 bottomColor;

varying vec2 vUv;
varying float frc;
varying float vColorVariation;

// Remova todos os #include problemáticos
// #include <common> pode ser mantido se necessário, mas vamos removê-lo por segurança

void main() {
  float alpha = texture2D(alphaMap, vUv).r;
  if(alpha < 0.15) discard;

  // Obter dados de cor da textura
  vec4 col = texture2D(map, vUv);

  // Ajustar as cores com variação
  vec3 adjustedTipColor = tipColor * (1.0 + vColorVariation);
  vec3 adjustedBottomColor = bottomColor * (1.0 + vColorVariation);

  // Adicionar mais verde em direção à raiz com variação
  col.rgb = mix(adjustedTipColor, col.rgb, frc);

  // Adicionar uma sombra em direção à raiz com variação
  col.rgb = mix(adjustedBottomColor, col.rgb, frc);

  // Não aplicamos toneMapping() ou linearToOutputTexel() aqui
  // Saída da cor final
  gl_FragColor = col;
}

`
