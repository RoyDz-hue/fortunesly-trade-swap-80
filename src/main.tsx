
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
}

// Create and render root
createRoot(document.getElementById("root")!).render(<App />);
