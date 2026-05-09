import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Inline CSS for simplicity in this artifact
const style = document.createElement('style');
style.textContent = `
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  
  body { @apply bg-slate-50 font-quicksand text-slate-900; }
  .glass-panel { @apply bg-white/80 backdrop-blur-md border border-white/20 shadow-xl; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
