import { Canvas } from "@react-three/fiber";
import { Home } from "./pages/Home";

import "./index.css";

function App() {
  return (
    <div className="w-full h-screen">
      <Canvas
        className="bg-slate-950"
        dpr={[1, 2]}
        shadows
        camera={{ position: [0, 5, 15], fov: 60 }}
      >
        <Home />
      </Canvas>
    </div>
  );
}

export default App;
