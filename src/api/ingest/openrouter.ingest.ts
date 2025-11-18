import { singleton } from "tsyringe";
import OpenrouterClient from "@/api/client/openrouter.client.ts";
import DatabaseService from "@/api/service/database.service.ts";
import * as Openrouter from "@/api/schema/openrouter.client.ts";
import type { Model } from "@/api/schema/model.database.ts";
import IconService from "@/api/service/icon.service.ts";
import GenerativeService from "@/api/service/generative.service.ts";

@singleton()
export default class OpenrouterIngest {
    constructor(
        private readonly client: OpenrouterClient,
        private readonly database: DatabaseService,
        private readonly iconService: IconService,
        private readonly generativeService: GenerativeService,
    ) {}

    start() {
        this.ingestModels();
        setInterval(() => this.ingestModels(), 60 * 1000); // every minute
    }

    async ingestModels() {
        const { data: models } = await this.client.getModels();
        const prefixes = this.calculateCommonPrefixes(models.map(({ id, name }) => ({ id, name })));

        await Promise.all(models.map((it) => this.processModel(it, prefixes)));
    }

    async processModel(model: Openrouter.Model, prefixes: Record<string, string>) {
        const id = `openrouter.${model.id}`;
        if (this.database.getModel(id) != null) {
            return;
        }
        const dbModel: Model = {
            id,
            name: this.normalizedName(model, prefixes),
            description: await this.normalizedDescription(model),
            imageUrl: await this.iconService.getIconForModel(model.id),
            promptPrice: model.pricing.prompt.toString(),
            completionPrice: model.pricing.completion.toString(),
        };

        this.database.setModel(dbModel);
    }

    private normalizedName(model: Openrouter.Model, prefixes: Record<string, string>) {
        let processedName = model.name || model.id;

        const commonPrefix = prefixes[model.id.split("/")[0] || ""];
        if (commonPrefix && processedName.startsWith(commonPrefix)) {
            processedName = processedName.substring(commonPrefix.length);
        }

        const freePattern = /\(free\)/i;
        const hasFree = freePattern.test(processedName);

        if (hasFree) {
            processedName = processedName.replace(freePattern, "(Free)");
        } else if (model.id.endsWith(":free")) {
            processedName = `${processedName} (Free)`;
        }

        return processedName;
    }

    /**
     * Calculate common prefixes for each provider group
     */
    private calculateCommonPrefixes(allModels: { id: string; name: string }[]): Record<string, string> {
        const grouped = allModels.reduce(
            (acc, model) => {
                const group = model.id.split("/")[0] || "unknown";
                if (!acc[group]) acc[group] = [];
                acc[group].push(model.name);
                return acc;
            },
            {} as Record<string, string[]>,
        );

        return Object.entries(grouped).reduce(
            (acc, [group, names]) => {
                const prefix = this.calculateCommonPrefix(names);
                if (prefix) acc[group] = prefix;
                return acc;
            },
            {} as Record<string, string>,
        );
    }

    /**
     * Calculate common prefix for a group of model names
     */
    private calculateCommonPrefix(names: string[]): string | null {
        if (!names || names.length < 2) return null;

        const prefixCounts = names.reduce(
            (acc, name) => {
                const colonIndex = name.indexOf(": ");
                if (colonIndex !== -1) {
                    const prefix = name.substring(0, colonIndex + 2);
                    acc[prefix] = (acc[prefix] || 0) + 1;
                }
                return acc;
            },
            {} as Record<string, number>,
        );

        if (Object.keys(prefixCounts).length === 0) return null;

        const { mostCommonPrefix, maxCount } = Object.entries(prefixCounts).reduce(
            (acc, [prefix, count]) => (count > acc.maxCount ? { maxCount: count, mostCommonPrefix: prefix } : acc),
            { maxCount: 0, mostCommonPrefix: null as string | null },
        );

        if (mostCommonPrefix == null) return null;

        if (names.length > 10) {
            return maxCount / names.length > 0.66 ? mostCommonPrefix : null;
        }

        if (names.every((name) => name.startsWith(mostCommonPrefix))) {
            return mostCommonPrefix;
        }

        return null;
    }

    private async normalizedDescription(model: Openrouter.Model) {
        let description =
            (await this.generativeService.makeBriefDescription({
                description: model.description,
                model_name: model.name || model.id,
            })) ?? model.description;

        if (model.id.endsWith(":free")) {
            description += " | Free";
        } else {
            description += ` | Input: ${model.pricing.prompt} | Output: ${model.pricing.completion}`;
        }

        return description;
    }
}
