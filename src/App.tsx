import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Home } from "./pages/Home";

import "./index.css";
import { OrthographicCamera } from "@react-three/drei";
import { useRef } from "react";

function App() {
  function MovingCamera() {
    const { camera } = useThree();
    const cameraRef = useRef(camera);

    useFrame((state) => {
      const { pointer } = state;
      cameraRef.current.position.x = pointer.x * 0.3; 
      cameraRef.current.position.y = pointer.y * 0.3; 
    });

    return null;
  }
  return (
    <div className="w-full h-screen">
      <Canvas className="bg-gray-900">
        <OrthographicCamera makeDefault position={[0, 0, 0]} zoom={55} />
        <MovingCamera />

        <Home />
      </Canvas>
    </div>
  );
}

export default App;
