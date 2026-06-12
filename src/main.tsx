import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tokens.css";
import "./styles/globals.css";
import App from "./App.tsx";
import { registerServiceWorker } from "./registerServiceWorker";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

registerServiceWorker();
