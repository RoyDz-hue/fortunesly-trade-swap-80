
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Log environment information
console.log("Starting application...");
console.log("Current working directory:", process.cwd?.() || "unknown");
console.log("Environment:", process.env.NODE_ENV || "unknown");

try {
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
} catch (error) {
  console.error("Error rendering application:", error);
  // Display error visibly on the page for debugging
  const errorDiv = document.createElement("div");
  errorDiv.style.padding = "20px";
  errorDiv.style.margin = "20px";
  errorDiv.style.backgroundColor = "#ffeeee";
  errorDiv.style.border = "1px solid red";
  errorDiv.innerHTML = `<h2>Error Starting Application</h2><pre>${error instanceof Error ? error.message : String(error)}</pre>`;
  document.body.appendChild(errorDiv);
}
