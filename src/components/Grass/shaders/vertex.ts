import { perlinNoise } from "./perlinNoise";

export const vertexShader = `
precision mediump float;

attribute vec3 offset;
attribute vec4 orientation;
attribute float stretch;
attribute float colorVariation;
attribute float textureIndex;

uniform float time;
uniform float bladeHeight;
varying vec2 vUv;
varying float frc;
varying float vColorVariation;
varying float vTextureIndex;

${perlinNoise}

vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
  return 2.0 * cross(q.xyz, v * q.w + cross(q.xyz, v)) + v;
}

vec4 slerp(vec4 v0, vec4 v1, float t) {
  normalize(v0);
  normalize(v1);

  float dot_ = dot(v0, v1);

  if (dot_ < 0.0) {
    v1 = -v1;
    dot_ = -dot_;
  }

  const float DOT_THRESHOLD = 0.9995;
  if (dot_ > DOT_THRESHOLD) {
    vec4 result = t * (v1 - v0) + v0;
    normalize(result);
    return result;
  }

  float theta_0 = acos(dot_);
  float theta = theta_0 * t;
  float sin_theta = sin(theta);
  float sin_theta_0 = sin(theta_0);
  float s0 = cos(theta) - dot_ * sin_theta / sin_theta_0;
  float s1 = sin_theta / sin_theta_0;
  return (s0 * v0) + (s1 * v1);
}

void main() {
  frc = position.y / bladeHeight;
  float noise = 1.0 - snoise(vec2(
    time - offset.x / 50.0,
    time - offset.z / 50.0
  ));

  vec4 direction = vec4(0.0, 0.0, 0.0, 0.0);
  direction = slerp(direction, orientation, frc);

  vec3 vPosition = vec3(
    position.x,
    position.y + position.y * stretch,
    position.z
  );
  vPosition = rotateVectorByQuaternion(vPosition, direction);

  float halfAngle = noise * 0.25 * frc;
  vec4 windQuaternion = normalize(vec4(
    sin(halfAngle),
    0.0,
    -sin(halfAngle),
    cos(halfAngle)
  ));
  vPosition = rotateVectorByQuaternion(vPosition, windQuaternion);

  vTextureIndex = textureIndex / 3.0; // Normaliza para [0,1]

  vUv = uv;
  vColorVariation = colorVariation;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(offset + vPosition, 1.0);
}
`;
