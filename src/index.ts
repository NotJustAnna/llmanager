import 'core-js';
import { log4js } from "@notjustanna/log4js";
import { serve } from "bun";
import { routes } from "@/api/routes.ts";
import app from "./app/index.html";

const logger = log4js("LLManager");

const server = serve({
    port: Number(process.env.PORT) || 3001,
    routes: { ...routes, "/*": app },
    development: process.env.NODE_ENV !== "production" && { hmr: true, console: true },
});

logger.info(`🚀 Server running at ${server.url}`);

// Graceful shutdown handler
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');

    // Stop accepting new connections
    await server.stop();

    // Give ongoing requests time to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Exit successfully (important for Nomad!)
    process.exit(0);
});

// Also handle SIGINT for local development (Ctrl+C)
process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down...');
    await server.stop();
    process.exit(0);
});
