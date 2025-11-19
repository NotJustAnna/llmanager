import { injectable } from "tsyringe";
import type { Settings } from "@/shared/schema/settings.controller.ts";
import DatabaseService from "@/api/service/database.service.ts";

@injectable()
export default class SettingsService {
    constructor(private readonly database: DatabaseService) {}

    getSettings(): Settings {
        return {
            generativeModel: this.database.getValue("settings.generativeModel"),
        };
    }

    updateSettings(settings: Settings) {
        if (settings.generativeModel != null) {
            this.database.setValue("settings.generativeModel", settings.generativeModel);
        }
    }
}
