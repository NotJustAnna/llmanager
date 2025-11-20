import { injectable } from "tsyringe";
import OpenWebUiClient from "@/api/client/openwebui.client.ts";
import DatabaseService from "@/api/service/database.service.ts";
import type { JsonObject } from "../lib/types";
import {log4js} from "@notjustanna/log4js";

const BRIEF_DESCRIPTION_PROMPT = `
You are a description processing agent.
Your task is to rewrite a given text into a concise and engaging brief description suitable for display in a model catalog.
The brief description should capture the essence of the model, highlighting its key features and benefits in a way that is easy to understand and appealing to potential users.

# Guidelines:
 - Keep it between 16 to 24 words.
 - Use clear, simple, direct language.
    - Avoid filler phrases: "It features", "This fast AI", "The model"
    - Avoid vague adjectives: "powerful", "advanced", "cutting-edge"
    - Focus on specific capabilities and use cases.
    - Avoid mentioning the full model name, as it's already displayed separately.
 - Return only valid JSON with a single field "description".
 - Produce no additional text outside the JSON object.
 
# Response Format:
{
  "description": "Your concise and engaging brief description here."
}
`;

const DESCRIPTION_GENERATOR_PROMPT = `
You are a description generation agent.
Your task is to, given raw details from the model, generate a concise and engaging brief description suitable for display in a model catalog.
The brief description should capture the essence of the model, highlighting its key features and benefits in a way that is easy to understand and appealing to potential users.

# Guidelines:
 - Keep it between 16 to 24 words.
 - Use clear, simple, direct language.
    - Avoid filler phrases: "It features", "This fast AI", "The model"
    - Avoid vague adjectives: "powerful", "advanced", "cutting-edge"
    - Focus on specific capabilities and use cases.
    - Avoid mentioning the full model name, as it's already displayed separately.
 - Return only valid JSON with a single field "description".
 - Produce no additional text outside the JSON object.

# Response Format:
{
  "description": "Your concise and engaging brief description here."
}
`;

const descriptionJsonRegex = /\{[^}]*"description"[^}]*\}/;

@injectable()
export default class GenerativeService {
    private readonly logger = log4js("GenerativeService");
    private requestQueue: Promise<void> = Promise.resolve();

    constructor(
        private readonly client: OpenWebUiClient,
        private readonly database: DatabaseService,
    ) {}

    private async enqueueRequest<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.requestQueue = this.requestQueue.then(async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async makeBriefDescription(data: JsonObject) {
        return this.enqueueRequest(async () => {
            this.logger.debug("Starting makeBriefDescription", { data });
            const startTime = Date.now();

            try {
                const res = await this.client.complete({
                    model: this.getModel(),
                    messages: [
                        {
                            role: "system",
                            content: BRIEF_DESCRIPTION_PROMPT.trim(),
                        },
                        {
                            role: "user",
                            content: JSON.stringify(data),
                        },
                    ],
                    temperature: 0.85,
                    max_tokens: 100,
                });

                const content = res.choices[0]?.message?.content;
                if (!content) {
                    this.logger.debug(`makeBriefDescription completed (no content) in ${Date.now() - startTime}ms`, { data });
                    return null;
                }

                const jsonMatch = content.match(descriptionJsonRegex);
                if (jsonMatch) {
                    const description = JSON.parse(jsonMatch[0]).description as string;
                    this.logger.debug(`makeBriefDescription completed successfully in ${Date.now() - startTime}ms`, { data });
                    return description;
                }

                this.logger.debug(`makeBriefDescription completed (no JSON match) in ${Date.now() - startTime}ms`, { data });
                return null;
            } catch (error) {
                this.logger.debug(`makeBriefDescription failed after ${Date.now() - startTime}ms: ${error}`, { data });
                throw error;
            }
        });
    }

    async generateDescription(data: JsonObject) {
        return this.enqueueRequest(async () => {
            this.logger.debug("Starting generateDescription", { data });
            const startTime = Date.now();

            try {
                const res = await this.client.complete({
                    model: this.getModel(),
                    messages: [
                        {
                            role: "system",
                            content: DESCRIPTION_GENERATOR_PROMPT.trim(),
                        },
                        {
                            role: "user",
                            content: JSON.stringify(data),
                        },
                    ],
                    temperature: 0.85,
                    max_tokens: 100,
                });

                const content = res.choices[0]?.message?.content;
                if (!content) {
                    this.logger.debug(`generateDescription completed (no content) in ${Date.now() - startTime}ms`, { data });
                    return null;
                }

                const jsonMatch = content.match(descriptionJsonRegex);
                if (jsonMatch) {
                    const description = JSON.parse(jsonMatch[0]).description as string;
                    this.logger.debug(`generateDescription completed successfully in ${Date.now() - startTime}ms`, { data });
                    return description;
                }

                this.logger.debug(`generateDescription completed (no JSON match) in ${Date.now() - startTime}ms`, { data });
                return null;
            } catch (error) {
                this.logger.debug(`generateDescription failed after ${Date.now() - startTime}ms: ${error}`, { data });
                throw error;
            }
        });
    }

    private getModel() {
        return this.database.getOrSetValue(
            "settings.generativeModel",
            process.env.OPENWEBUI_DEFAULT_MODEL ?? "ollama.gemma3:12b",
        );
    }
}
