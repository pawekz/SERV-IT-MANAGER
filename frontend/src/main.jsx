import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"

// Configure axios adapter BEFORE any other imports that use axios
// This prevents "Cannot destructure property 'fetch' of 'undefined'" errors in axios 1.12.0
import axios from "axios"
if (typeof window !== 'undefined') {
  axios.defaults.adapter = 'xhr'
}

import App from "./App"
import { QueryClientProvider } from "@tanstack/react-query"
import queryClient from "./config/queryClient"

import buffer from "buffer"
window.Buffer = buffer.Buffer

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
