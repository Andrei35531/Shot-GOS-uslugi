import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { MockupFrame } from "./app/components/MockupFrame";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <MockupFrame>
    <App />
  </MockupFrame>
);
  