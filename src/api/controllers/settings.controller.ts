import { injectable } from "tsyringe";
import AuthMiddleware from "@/api/middleware/auth.middleware.ts";
import { Settings } from "@/shared/schema/settings.controller.ts";
import SettingsService from "@/api/service/settings.service.ts";

@injectable()
export default class SettingsController {
    constructor(
        private readonly auth: AuthMiddleware,
        private readonly settingsService: SettingsService,
    ) {}

    async getSettings(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }
        return Response.json(Settings.parse(this.settingsService.getSettings()));
    }

    async updateSettings(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }
        this.settingsService.updateSettings(Settings.parse(await req.json()));
        return Response.json({ ok: true });
    }
}
