import { log4js } from "@notjustanna/log4js";
import { serve } from "bun";
import { routes } from "@/api/routes.ts";
import app from "./app/index.html";

const server = serve({
    port: Number(process.env.PORT) || 3001,
    routes: { ...routes, "/*": app },
    development: process.env.NODE_ENV !== "production" && { hmr: true, console: true },
});

log4js("LLManager").info(`🚀 Server running at ${server.url}`);
