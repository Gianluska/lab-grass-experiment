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
uniform float cameraAlignmentFactor; // Fator de alinhamento com a câmera
uniform vec3 mousePosition;

varying vec2 vUv;
varying float frc;
varying float vColorVariation;
varying float vTextureIndex;

varying vec3 vNormal;
varying vec3 vPosition;

const float PI = 3.14159265358979323812312346264;

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
        vec4 result = v3 + t * (v1 - v0);
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

vec4 quatMultiply(vec4 q1, vec4 q2) {
    return normalize(vec4(
        q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
        q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
        q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w,
        q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z
    ));
}

void main() {
    frc = position.y / bladeHeight;

    float noise = 0.0 - snoise(vec2(
        time - offset.x / 70.0,
        time - offset.z / 70.0
    ));

    vec4 bladeOrientation = orientation;

    vec3 worldBladePosition = (modelMatrix * vec4(offset, 1.0)).xyz;

    vec3 toCamera = normalize(cameraPosition - worldBladePosition);

    vec3 bladeForward = normalize(rotateVectorByQuaternion(vec3(0.0, 0.0, 1.0), bladeOrientation));

    vec2 bladeDirXZ = normalize(bladeForward.xz);
    vec2 toCameraXZ = normalize(toCamera.xz);

    float bladeAngle = atan(bladeDirXZ.y, bladeDirXZ.x);
    float cameraAngle = atan(toCameraXZ.y, toCameraXZ.x);
    float angleToCamera = cameraAngle - bladeAngle;

    angleToCamera = mod(angleToCamera + PI, 2.0 * PI) - PI;

    float adjustedAngle = angleToCamera * cameraAlignmentFactor;

    float halfAngle = adjustedAngle * 0.5;
    vec4 cameraAlignmentQuaternion = vec4(
        0.0,
        sin(halfAngle),
        0.0,
        cos(halfAngle)
    );

    vec4 adjustedOrientation = quatMultiply(cameraAlignmentQuaternion, bladeOrientation);

    float distanceToMouse = length(worldBladePosition.xz - mousePosition.xz);
    float influenceRadius = 6.0;
    float mouseInfluence = smoothstep(influenceRadius, 0.0, distanceToMouse);

    if (mouseInfluence > 0.0) {
        vec3 toMouseDirection = normalize(worldBladePosition - mousePosition);
        float tiltAngle = 0.8 * mouseInfluence;

        vec4 mouseEffectQuaternion = vec4(
            sin(tiltAngle / 2.0) * toMouseDirection.x,
            0.0,
            sin(tiltAngle / 2.0) * toMouseDirection.z,
            cos(tiltAngle / 2.0)
        );

        adjustedOrientation = quatMultiply(mouseEffectQuaternion, adjustedOrientation);
    }

    vec4 direction = slerp(vec4(0.0, 0.0, 0.0, 1.0), adjustedOrientation, frc);

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

    vTextureIndex = textureIndex / 3.0; // Normaliza para [0,1]

    vUv = uv;
    vColorVariation = colorVariation;

    vec4 worldPosition = modelMatrix * vec4(offset + vPositionLocal, 1.0);
    vPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}

`;
