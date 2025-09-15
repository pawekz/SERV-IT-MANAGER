import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"

import buffer from "buffer"
window.Buffer = buffer.Buffer

// Debug log: App entry point loaded
console.debug("[DEBUG] main.jsx loaded: App is starting up.");

// Global error handler: logs uncaught errors to console (visible in Azure Log Stream)
window.addEventListener("error", function(event) {
  console.error("[GLOBAL ERROR] Uncaught error:", event.error || event.message, event);
});

window.addEventListener("unhandledrejection", function(event) {
  console.error("[GLOBAL ERROR] Unhandled promise rejection:", event.reason, event);
});

// ...existing code...
const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
