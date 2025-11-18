import { injectable } from "tsyringe";
import type { Settings } from "@/shared/schema/settings.controller.ts";
import DatabaseService from "@/api/service/database.service.ts";

@injectable()
export default class SettingsService {
    constructor(private readonly database: DatabaseService) {}

    getSettings(): Settings {
        return {
            generatedModel: this.database.getValue("settings.generatedModel"),
        };
    }

    updateSettings(settings: Settings) {
        if (settings.generatedModel != null) {
            this.database.setValue("settings.generatedModel", settings.generatedModel);
        }
    }
}
