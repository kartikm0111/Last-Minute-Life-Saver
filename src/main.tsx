import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Gracefully handle iframe/sandbox script restrictions and telemetry noise
if (typeof window !== "undefined") {
  window.onerror = function (message, source, lineno, colno, error) {
    const msg = String(message).toLowerCase();
    // Catch generic "Script error." which is typical of cross-site snippets
    if (msg.includes("script error") || msg.includes("access is denied for this document")) {
      console.warn("[Safe-Guard] Suppressed generic external/cross-origin sandbox error propagation.");
      return true; // Prevents the browser's default handler and external bubble
    }
    // Support non-blocking fallback if speechSynthesis or AudioContext are disabled/blocked by context policy
    if (msg.includes("speechsynthesis") || msg.includes("audiocontext") || msg.includes("not allowed") || msg.includes("play()")) {
      console.warn("[Safe-Guard] Suppressed sandboxed media security constraint error gracefully.");
      return true;
    }
    return false; // Allow legitimate local runtime crashes through to our app boundary
  };

  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason) {
      const reasonStr = String(event.reason.message || event.reason).toLowerCase();
      if (
        reasonStr.includes("speechsynthesis") || 
        reasonStr.includes("audiocontext") || 
        reasonStr.includes("not allowed") || 
        reasonStr.includes("play()") || 
        reasonStr.includes("permission")
      ) {
        console.warn("[Safe-Guard] Caught unhandled promise rejection under media security contexts.");
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
