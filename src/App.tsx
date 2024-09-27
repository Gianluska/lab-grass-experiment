import { Canvas } from "@react-three/fiber";
import { Home } from "./pages/Home";

import "./index.css";

function App() {
  return (
    <div className="w-full h-screen">
      <Canvas dpr={[1, 2]} shadows>
        <Home />
      </Canvas>
    </div>
  );
}

export default App;
