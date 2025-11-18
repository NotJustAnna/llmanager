import IntegrationController from "@/api/controllers/integration.controller.ts";
import ModelController from "@/api/controllers/model.controller.ts";
import CORS from "@/api/lib/routing.cors.ts";
import Routes from "@/api/lib/routing.ts";
import Container from "@/api/lib/tsyringe";
import AuthController from "./controllers/auth.controller";
import SettingsController from "./controllers/settings.controller";

export const routes = Routes(({ GET, POST, PUT }, routes) => {
    // Model routes
    const Model = Container.resolve(ModelController);
    GET("/api/models", (req) => Model.listModels(req));
    PUT("/api/models/edit", (req) => Model.editModel(req));
    POST("/api/models/allowlist", (req) => Model.updateAllowlist(req));

    // Integration routes
    const Integration = Container.resolve(IntegrationController);
    GET("/api/integration/openrouter/credits", (req) => Integration.getOpenRouterCredits(req));

    // Settings routes
    const Settings = Container.resolve(SettingsController);
    GET("/api/settings", (req) => Settings.getSettings(req));
    POST("/api/settings", (req) => Settings.updateSettings(req));

    const Auth = Container.resolve(AuthController);
    POST("/api/auth/login", (req) => Auth.login(req));
    POST("/api/auth/change-password", (req) => Auth.changePassword(req));

    // Health check
    GET("/api/health", Response.json({ success: true, status: "healthy" }));

    CORS(routes);
});
