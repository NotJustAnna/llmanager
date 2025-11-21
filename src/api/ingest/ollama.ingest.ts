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
        this.scheduleIngest();
    }

    private async scheduleIngest() {
        await this.ingestModels();
        setTimeout(() => this.scheduleIngest(), 60 * 1000); // every minute after completion
    }

    async ingestModels() {
        const { models } = await this.client.getModels();

        for (const model of models) {
            await this.processModel(model);
        }
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
            imageUrl: await this.iconService.getIconForModel(model.name, "ollama"),
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

        return (await this.generativeService.generateDescription(data)) ?? "No description available.";
    }

    private nameLookup = buildMap<string | RegExp, string>((map) => {
        map.set("deepseek-", "");
        map.set("phi", "phi-");
        map.set(/(qwen[^-]*)vl/, "$1&#45;VL");
        map.set("-vl", "&#45;VL");
        map.set("tiny-h", "Tiny&#45;H");
    });

    private sizeLookup = buildMap<string | RegExp, string>((map) => {
        // "latest" labels are redundant
        map.set("latest", "");

        // Lossless/Near-lossless (very high quality)
        map.set("f32", "HQ");
        map.set("fp32", "HQ");
        map.set("f16", "HQ");
        map.set("fp16", "HQ");

        // High quality (very low quality loss)
        map.set("q8_0", "HQ");
        map.set("q6_k", "HQ");
        map.set("q5_k_m", "HQ");
        map.set("q5_k", "HQ");
        map.set("q5_1", "HQ");

        // Medium quality (balanced quality/size)
        map.set("q5_0", "");
        map.set("q4_k_m", "");
        map.set("q4_k", "");
        map.set("mxfp4", "");

        // Low quality (significant/substantial quality loss)
        map.set("q5_k_s", "LQ");
        map.set("q4_k_s", "LQ");
        map.set("q4_1", "LQ");
        map.set("q4_0", "LQ");
        map.set("q3_k_l", "LQ");
        map.set("q3_k_m", "LQ");
        map.set("q3_k", "LQ");
        map.set("q3_k_s", "LQ");

        // Very low quality (extreme quality loss)
        map.set("q2_k", "LQ");

        // Quantization-aware training
        map.set("qat", "QAT");
    });

    private sizeIsParamsRegex = /(\w)?((?:\d+\.)*\d+)(\w)/;

    private normalizedName(model: Ollama.Model) {
        let [name, size] = model.name.split(":", 2) as [string, string];

        // This should already be lowercase, but just in case
        name = name.toLowerCase();
        size = size.toLowerCase();

        // Apply lookup replacements
        for (const [key, value] of this.nameLookup.entries()) {
            name = name.replace(key, value);
        }

        for (const [key, value] of this.sizeLookup.entries()) {
            size = size.replace(key, value);
        }

        if (name.startsWith("gemma3")) {
            // Gemma 3 models use "it" to denote "instruct"
            size = size.replace("it", "instruct");
        }

        size = size.replace(this.sizeIsParamsRegex, (s) => s.toUpperCase());

        // Convert kebab-case to Title Case
        name = name
            .replace(/-+/, "-") // deduplicate hyphens
            .replace(/^-+|-+$/, "") // trim leading/trailing hyphens
            .trim()
            .split("-")
            .map((it) => it.charAt(0).toUpperCase() + it.slice(1))
            .join(" ")
            .replace("&#45;", "-"); // revert hyphen replacement

        size = size
            .replace(/-+/, "-") // deduplicate hyphens
            .replace(/^-+|-+$/, "") // trim leading/trailing hyphens
            .trim()
            .split("-")
            .map((it) => it.charAt(0).toUpperCase() + it.slice(1))
            .join(" ")
            .replace("&#45;", "-"); // revert hyphen replacement

        if (size.length === 0) {
            return name;
        }
        return [name, size].join(" ");
    }
}
