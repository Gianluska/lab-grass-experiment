import { Color, DoubleSide } from "three";
import { shaderMaterial } from "@react-three/drei"
import { extend } from "@react-three/fiber"

import { vertexShader } from "./shaders/vertex";
import { fragmentShader } from "./shaders/fragment";

const GrassMaterial = shaderMaterial(
  {
    bladeHeight: 1,
    map: null,
    alphaMap: null,
    time: 0,
    tipColor: new Color(0.1, 0.4, 0.2).convertSRGBToLinear(),
    bottomColor: new Color(0.0, 0.1, 0.0).convertSRGBToLinear(),
  },
  vertexShader,
  fragmentShader,
  (self) => {
    if (!self) return;
    self.side = DoubleSide
  },
)

extend({ GrassMaterial })
