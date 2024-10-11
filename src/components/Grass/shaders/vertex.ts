import { perlinNoise } from "./perlinNoise";

export const vertexShader = `
precision mediump float;

attribute vec3 offset;
attribute vec4 orientation;
attribute float stretch;
attribute float colorVariation;

uniform float time;
uniform float bladeHeight;

varying vec2 vUv;
varying float frc;
varying float vColorVariation;

varying vec3 vNormal;
varying vec3 vPosition;

${perlinNoise}

vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
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
    vec4 result = v0 + t * (v1 - v0);
    normalize(result);
    return result;
  }

  float theta_0 = acos(dot_);
  float theta = theta_0 * t;
  float sin_theta = sin(theta);
  float sin_theta_0 = sin(theta_0);

  float s0 = cos(theta) - dot_ * sin_theta / sin_theta_0;
  float s1 = sin_theta / sin_theta_0;

  return s0 * v0 + s1 * v1;
}

void main() {
  frc = position.y / bladeHeight;

  float timeScale = time / 1.2;
  float noise = 0.0 - snoise(vec2(
    timeScale - offset.x / 10.0,
    timeScale - offset.z / 10.0
  ));

  vec4 direction = vec4(0.0, 0.0, 0.0, 1.0);
  direction = slerp(direction, orientation, frc);

  vec3 vPositionLocal = vec3(
    position.x,
    position.y + position.y * stretch,
    position.z
  );
  vPositionLocal = rotateVectorByQuaternion(vPositionLocal, direction);

  float windHalfAngle = noise * 0.35 * frc;
  vec4 windQuaternion = normalize(vec4(
    sin(windHalfAngle),
    2.0,
    -sin(windHalfAngle),
    cos(windHalfAngle)
  ));
  vPositionLocal = rotateVectorByQuaternion(vPositionLocal, windQuaternion);

  vec3 objectNormal = vec3(0.0, 1.0, 0.0);
  vec3 transformedNormal = rotateVectorByQuaternion(objectNormal, direction);
  vNormal = normalize(normalMatrix * transformedNormal);

  vUv = uv;
  vColorVariation = colorVariation;

  vec4 worldPosition = modelMatrix * vec4(offset + vPositionLocal, 1.0);
  vPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(
    offset + vPositionLocal,
    1.0
  );
}

`;
