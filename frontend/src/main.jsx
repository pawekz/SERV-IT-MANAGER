import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"

import buffer from "buffer"
window.Buffer = buffer.Buffer

// Debug log: App entry point loaded
console.debug("[DEBUG] main.jsx loaded: App is starting up.");
console.debug("[DEBUG] Buffer polyfill loaded:", !!window.Buffer);
console.debug("[DEBUG] Global object:", typeof global !== 'undefined' ? 'defined' : 'undefined');

// Global error handler: logs uncaught errors to console (visible in Azure Log Stream)
window.addEventListener("error", function(event) {
  console.error("[GLOBAL ERROR] Uncaught error:", {
    message: event.error?.message || event.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener("unhandledrejection", function(event) {
  console.error("[GLOBAL ERROR] Unhandled promise rejection:", {
    reason: event.reason,
    promise: event.promise
  });
});

// Log module loading progress
console.debug("[DEBUG] About to render React app");

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
