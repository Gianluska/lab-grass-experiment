uniform float time;
uniform vec2 windDirection;
uniform mat4 shadowMatrix;

attribute vec3 offset;
attribute vec4 orientation;
attribute float scale;
attribute float colorVariation;
attribute float bottomColorVariation;
attribute float topColorVariation;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vViewPosition;

varying float vColorVariation;
varying float vBottomColorVariation;
varying float vTopColorVariation;

varying vec4 vShadowCoord;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - 0.5;

  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857; 
  vec3 ns = n_ * vec3(1.0, 2.0, 3.0) - vec3(0.0, i1.x, i2.x);

  vec4 j = p - 49.0 * floor(p * n_ * n_); 

  vec4 x_ = floor(j * n_);
  vec4 y_ = floor(j - 7.0 * x_);  

  vec4 x = (x_ * n_) + n_ * 0.5;
  vec4 y = (y_ * n_) + n_ * 0.5;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 applyQuaternion(vec3 v, vec4 q) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  vec3 pos = position;

  pos *= scale;

  float weight = uv.y; 

  pos = applyQuaternion(pos, orientation);
  vec3 tangent = applyQuaternion(vec3(1.0, 0.0, 0.0), orientation);
  vec3 bitangent = applyQuaternion(vec3(0.0, 0.0, 1.0), orientation);
  vec3 normal = applyQuaternion(vec3(0.0, 1.0, 0.0), orientation);

  vTangent = normalize(normalMatrix * tangent);
  vBitangent = normalize(normalMatrix * bitangent);

  float bendStrength = 0.0; 
  vec2 baseBend = windDirection * bendStrength * weight;

  float noiseScale = 0.08;
  float noiseStrength = 0.6;
  float noiseSpeed = 0.25;

  vec2 noisePos = (offset.xz * noiseScale) + (windDirection * time * noiseSpeed);

  float noise = snoise(vec3(noisePos, time * noiseSpeed));

  vec2 noiseBend = windDirection * noise * noiseStrength * weight;

  vec2 windDisplacement = baseBend + noiseBend;

  pos.x += windDisplacement.x;
  pos.z += windDisplacement.y;

  pos += offset;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  vShadowCoord = shadowMatrix * vec4(pos, 1.0);

  vUv = uv;
  vViewPosition = -mvPosition.xyz;

  vColorVariation = colorVariation;
  vBottomColorVariation = bottomColorVariation;
  vTopColorVariation = topColorVariation;

  gl_Position = projectionMatrix * mvPosition;
}