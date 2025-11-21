// CORS headers
import type { BunRoutes, HTTPMethod } from "./routing.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function applyCorsHeaders(headers: Headers) {
    const newHeaders = new Headers(headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
        newHeaders.set(key, value);
    }
    return newHeaders;
}

const applyCORS = <V = never>(res: Response | V) =>
    !(res instanceof Response)
        ? res
        : new Response(res.body, {
              status: res.status,
              statusText: res.statusText,
              headers: applyCorsHeaders(res.headers),
          });

export default function CORS(routes: BunRoutes) {
    for (const route of Object.values(routes)) {
        let sawOptions = false;
        for (const [method, value] of Object.entries(route)) {
            if (method === "OPTIONS") {
                sawOptions = true;
            }

            if (value instanceof Response) {
                // Add CORS headers to existing Response
                route[method as HTTPMethod] = applyCORS(value);
            } else if (typeof value === "function") {
                route[method as HTTPMethod] = (req) => {
                    const result = value(req);
                    return result instanceof Promise ? result.then(applyCORS) : applyCORS(result);
                };
            }
        }
        if (sawOptions) continue;
        route.OPTIONS = new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }
}
