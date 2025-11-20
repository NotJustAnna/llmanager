import { singleton } from "tsyringe";
import OllamaClient from "@/api/client/ollama.client.ts";
import DatabaseService from "@/api/service/database.service.ts";
import * as Ollama from "@/api/schema/ollama.client.ts";
import type { Model } from "@/api/schema/model.database.ts";
import IconService from "@/api/service/icon.service.ts";
import GenerativeService from "@/api/service/generative.service.ts";
import type { JsonObject } from "@/api/lib/types.ts";

const buildMap = <K, V>(block: (map: Map<K, V>) => void) => {
    const map = new Map<K, V>();
    block(map);
    return map;
};

@singleton()
export default class OllamaIngest {
    constructor(
        private readonly client: OllamaClient,
        private readonly database: DatabaseService,
        private readonly iconService: IconService,
        private readonly generativeService: GenerativeService,
    ) {}

    start() {
        this.ingestModels();
        setInterval(() => this.ingestModels(), 60 * 1000); // every minute
    }

    async ingestModels() {
        const { models } = await this.client.getModels();

        await Promise.all(models.map((it) => this.processModel(it)));
    }

    /**
     * Generate auto name for a model by querying Ollama API for fresh data.
     */
    async generateAutoName(modelName: string): Promise<string> {
        const models = await this.client.getModels();
        const model = models.models.find((m) => m.name === modelName);
        if (!model) {
            return modelName; // fallback to original name
        }
        return this.normalizedName(model);
    }

    /**
     * Generate auto description for a model by querying Ollama API for fresh data.
     */
    async generateAutoDescription(modelName: string): Promise<string> {
        const detail = await this.client.getDetails(modelName);
        const models = await this.client.getModels();
        const model = models.models.find((m) => m.name === modelName);
        if (!model) {
            return "No description available.";
        }
        return this.normalizedDescription(model, detail);
    }

    async processModel(model: Ollama.Model) {
        const id = `ollama.${model.name}`;
        if (this.database.getModel(id) != null) {
            return;
        }
        const detail = await this.client.getDetails(model.name);

        const dbModel: Model = {
            id,
            name: this.normalizedName(model),
            description: await this.normalizedDescription(model, detail),
            imageUrl: await this.iconService.getIconForModel(model.name),
            promptPrice: "Local",
            completionPrice: "Local",
        };

        this.database.setModel(dbModel);
    }

    async normalizedDescription(model: Ollama.Model, detail: Ollama.ModelDetailsResponse): Promise<string> {
        const data: JsonObject = { model_id: model.name };

        const basename = detail.model_info["general.basename"];
        if (basename) {
            data.basename = basename;
        }

        data.parameters = detail.details.parameter_size;
        const sizeLabel = detail.model_info["general.size_label"];
        if (sizeLabel) {
            data.size_label = sizeLabel;
        }

        const contextLengthKey = `${detail.model_info["general.architecture"]}.context_length`;
        if (contextLengthKey in detail.model_info) {
            // @ts-expect-error
            data.context_length = detail.model_info[contextLengthKey];
        }

        const systemPrompt = detail.system;
        if (systemPrompt) {
            data.system_prompt = systemPrompt;
        }

        const extraCapabilities = detail.capabilities.filter((it) => it !== "completion");
        if (extraCapabilities.length > 0) {
            data.extra_capabilities = extraCapabilities;
        }

        let description = (await this.generativeService.generateDescription(data)) ?? "No description available.";

        description += " | Local";

        return description;
    }

    private lookup = buildMap<string | RegExp, string>((map) => {
        map.set("deepseek-", "");
        map.set("phi", "phi-");
        map.set("-vl", "&#45;VL");
        map.set('tiny-h', 'Tiny&#45;H');
    });

    private sizeIsParamsRegex = /^(?<pre>[a-z])(?<number>\d+(?:\.\d+)+)(?<post>[a-z])$/;

    private normalizedName(model: Ollama.Model) {
        let [name, size] = model.name.split(":") as [string, string];

        // Remove size if it's "latest"
        if (size === "latest") {
            size = "";
        }

        // Apply lookup replacements
        for (const [key, value] of this.lookup.entries()) {
            name = name.replace(key, value);
        }

        // Convert kebab-case to Title Case
        name = name
            .replace(/-+/, "-")
            .split("-")
            .map((it) => it.charAt(0).toUpperCase() + it.slice(1))
            .join(" ")
            .replace("&#45;", "-"); // revert hyphen replacement

        const match = size.match(this.sizeIsParamsRegex);
        if (match?.groups) {
            size = [match.groups.pre, match.groups.number, match.groups.post]
                .map((it) => (it as string).toUpperCase())
                .join("");
        } else {
            size = size
                .replace(/-+/, "-")
                .split("-")
                .map((it) => it.charAt(0).toUpperCase() + it.slice(1))
                .join(" ")
                .replace("&#45;", "-"); // revert hyphen replacement
        }

        if (size.length === 0) {
            return name;
        }
        return [name, size].join(" ");
    }
}
