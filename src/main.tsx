import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Редирект на HTTPS при открытии по HTTP (кроме localhost)
if (typeof window !== "undefined" && window.location.protocol === "http:" && window.location.hostname !== "localhost" && !window.location.hostname.startsWith("127.")) {
  window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
  