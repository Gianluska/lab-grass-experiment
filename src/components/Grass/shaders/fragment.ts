export const fragmentShader = `
  precision mediump float;
  uniform sampler2D map;
  uniform sampler2D alphaMap;
  uniform vec3 tipColor;
  uniform vec3 bottomColor;
  varying vec2 vUv;
  varying float frc;
  
  void main() {
    float alpha = texture2D(alphaMap, vUv).r;
    if(alpha < 0.15) discard;
    
    //Get colour data from texture
    vec4 col = vec4(texture2D(map, vUv));
    //Add more green towards root
    col = mix(vec4(tipColor, 1.0), col, frc);
    //Add a shadow towards root
    col = mix(vec4(bottomColor, 1.0), col, frc);
    gl_FragColor = col;

    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }
`