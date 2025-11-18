export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
export type MaybePromise<T> = T | Promise<T>;
// biome-ignore lint/suspicious/noConfusingVoidType: Mirroring Bun's RequestHandler type
export type RouteHandler = (req: Request) => MaybePromise<Response | undefined | void>;
export type RouteValue = RouteHandler | Response | false;
export type RouteDefiner = (path: string, handler: RouteValue) => void;
export type RouteDefinitions = Record<HTTPMethod, RouteDefiner>;
export type RouteFactory = (method: HTTPMethod) => RouteDefiner;
export type BunRoutes = Record<string, Partial<Record<HTTPMethod, RouteValue>>>;

export default function Routes(define: (methods: RouteDefinitions, routes: BunRoutes) => void): BunRoutes {
    const routes: BunRoutes = {};

    const createMethod: RouteFactory = (method) => (path, handler) => {
        // biome-ignore lint/suspicious/noAssignInExpressions: Intentional
        (routes[path] = routes[path] || {})[method] = handler;
    };

    const methods: RouteDefinitions = {
        HEAD: createMethod("HEAD"),
        OPTIONS: createMethod("OPTIONS"),
        GET: createMethod("GET"),
        POST: createMethod("POST"),
        PUT: createMethod("PUT"),
        PATCH: createMethod("PATCH"),
        DELETE: createMethod("DELETE"),
    };

    define(methods, routes);

    return routes;
}
