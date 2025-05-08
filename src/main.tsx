
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Make sure we have a root element to render to
const rootElement = document.getElementById("root");

if (!rootElement) {
  // Create a root element if it doesn't exist
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  console.log("Root element was created because none was found");
}

// Create and render root
const renderTarget = document.getElementById("root");

if (renderTarget) {
  createRoot(renderTarget).render(<App />);
  console.log("Application rendered successfully");
} else {
  console.error("Could not find root element even after attempting to create it");
}
