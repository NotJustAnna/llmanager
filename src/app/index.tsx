/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const elem = document.getElementById("root");
if (!elem) {
    throw new Error("Root element not found");
}

const app = (
    <StrictMode>
        <App />
    </StrictMode>
);

if (import.meta.hot) {
    // biome-ignore lint/suspicious/noAssignInExpressions: Bun hot module reloading pattern
    (import.meta.hot.data.root ??= createRoot(elem)).render(app);
} else {
    // The hot module reloading API is not available in production.
    createRoot(elem).render(app);
}
