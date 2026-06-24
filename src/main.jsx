import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/oxygen-mono";
import App from "./App.jsx";
import "./styles.css";
import { captureTokenFromHash } from "./lib/engineClient.js";

// Auto-handshake: se o motor abriu o app com #thebox-token=..., captura e limpa.
captureTokenFromHash();

const rootElement = document.getElementById("root");
rootElement.dataset.ready = "true";

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
