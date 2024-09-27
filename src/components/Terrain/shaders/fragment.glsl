uniform sampler2D normalMap;
uniform vec3 ambientLightColor;
uniform vec3 lightDirection;
uniform vec3 lightColor;
uniform float roughness;
uniform float metalness;

uniform sampler2D shadowMap;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vViewPosition;

varying vec4 vShadowCoord;

varying float vColorVariation;
varying float vBottomColorVariation;
varying float vTopColorVariation;

float unpackDepth(const in vec4 rgba_depth) {
  const vec4 bit_shift = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
  float depth = dot(rgba_depth, bit_shift);
  return depth;
}

void main() {
  vec3 normalTex = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;

  vec3 T = normalize(vTangent);
  vec3 B = normalize(vBitangent);
  vec3 N = normalize(vNormal);

  mat3 TBN = mat3(T, B, N);

  vec3 disturbedNormal = normalize(TBN * normalTex);

  vec3 lightDir = normalize(lightDirection);

  vec3 ambient = ambientLightColor;

  float diff = max(dot(disturbedNormal, lightDir), 0.0);
  vec3 diffuse = diff * lightColor;

  vec3 viewDir = normalize(vViewPosition);
  vec3 halfDir = normalize(lightDir + viewDir);
  float specAngle = max(dot(disturbedNormal, halfDir), 0.0);
  float spec = pow(specAngle, 32.0 / roughness);
  spec *= (1.0 - metalness) * 0.5;
  vec3 specular = spec * lightColor;

  vec4 shadowCoord = vShadowCoord;
  shadowCoord /= shadowCoord.w;
  shadowCoord = shadowCoord * 0.5 + 0.5;

  float shadowDepth = unpackDepth(texture2D(shadowMap, shadowCoord.xy));
  float currentDepth = shadowCoord.z;
  float bias = 0.005;
  float shadow = currentDepth > shadowDepth + bias ? 0.5 : 1.0;

  vec3 bottomColor = vec3(0.25, 0.40, 0.20);
  vec3 topColor = vec3(0.15, 0.30, 0.16);

  bottomColor += (vBottomColorVariation - 0.5) * 0.2;
  topColor += (vTopColorVariation - 0.5) * 0.2;

  bottomColor = clamp(bottomColor, 0.0, 1.0);
  topColor = clamp(topColor, 0.0, 1.0);

  vec3 baseColor = mix(bottomColor, topColor, vUv.y);

  baseColor *= 0.9 + vColorVariation * 0.2;

  float heightFactor = smoothstep(0.0, 0.2, vUv.y);
  baseColor *= mix(0.5, 1.0, heightFactor);

  vec3 color = baseColor * (ambient + diffuse * shadow) + specular * shadow;

  gl_FragColor = vec4(color, 1.0);
}