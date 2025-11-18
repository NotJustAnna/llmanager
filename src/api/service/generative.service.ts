import { injectable } from "tsyringe";
import OpenWebUiClient from "@/api/client/openwebui.client.ts";
import DatabaseService from "@/api/service/database.service.ts";
import type { JsonObject } from "../lib/types";

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
    constructor(
        private readonly client: OpenWebUiClient,
        private readonly database: DatabaseService,
    ) {}

    async makeBriefDescription(data: JsonObject) {
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
            return null;
        }

        const jsonMatch = content.match(descriptionJsonRegex);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]).description as string;
        }

        return null;
    }

    async generateDescription(data: JsonObject) {
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
            return null;
        }

        const jsonMatch = content.match(descriptionJsonRegex);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]).description as string;
        }

        return null;
    }

    private getModel() {
        return this.database.getOrSetValue(
            "settings.generative_model",
            process.env.OPENWEBUI_DEFAULT_MODEL ?? "ollama.gemma3:12b",
        );
    }
}
