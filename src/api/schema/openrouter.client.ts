import { z } from "zod";

export const CreditsResponse = z.object({
    data: z.object({
        total_credits: z.number(),
        total_usage: z.number(),
    }),
});

export type CreditsResponse = z.infer<typeof CreditsResponse>;

export const PutModalitySchema = z.enum(["audio", "file", "image", "text", "video"]);
export type PutModality = z.infer<typeof PutModalitySchema>;

export const ModalitySchema = z.enum(["text+image->text", "text+image->text+image", "text->text"]);
export type Modality = z.infer<typeof ModalitySchema>;

export const TokenizerSchema = z.enum([
    "Claude",
    "Cohere",
    "DeepSeek",
    "Gemini",
    "GPT",
    "Grok",
    "Llama2",
    "Llama3",
    "Llama4",
    "Mistral",
    "Nova",
    "Other",
    "Qwen",
    "Qwen3",
    "Router",
]);
export type Tokenizer = z.infer<typeof TokenizerSchema>;

export const SupportedParameterSchema = z.enum([
    "frequency_penalty",
    "include_reasoning",
    "logit_bias",
    "logprobs",
    "max_tokens",
    "min_p",
    "presence_penalty",
    "reasoning",
    "repetition_penalty",
    "response_format",
    "seed",
    "stop",
    "structured_outputs",
    "temperature",
    "tool_choice",
    "tools",
    "top_a",
    "top_k",
    "top_logprobs",
    "top_p",
    "web_search_options",
]);
export type SupportedParameter = z.infer<typeof SupportedParameterSchema>;

export const ArchitectureSchema = z.object({
    modality: ModalitySchema,
    input_modalities: z.array(PutModalitySchema),
    output_modalities: z.array(PutModalitySchema),
    tokenizer: TokenizerSchema,
    instruct_type: z.union([z.null(), z.string()]),
});
export type Architecture = z.infer<typeof ArchitectureSchema>;

export const DefaultParametersSchema = z.object({
    temperature: z.union([z.number(), z.null()]).optional(),
    top_p: z.union([z.number(), z.null()]).optional(),
    frequency_penalty: z.null().optional(),
});
export type DefaultParameters = z.infer<typeof DefaultParametersSchema>;

export const PricingSchema = z.object({
    prompt: z.string(),
    completion: z.string(),
    request: z.string().optional(),
    image: z.string().optional(),
    web_search: z.string().optional(),
    internal_reasoning: z.string().optional(),
    input_cache_read: z.string().optional(),
    audio: z.string().optional(),
    input_cache_write: z.string().optional(),
});
export type Pricing = z.infer<typeof PricingSchema>;

export const TopProviderSchema = z.object({
    context_length: z.union([z.number(), z.null()]),
    max_completion_tokens: z.union([z.number(), z.null()]),
    is_moderated: z.boolean(),
});
export type TopProvider = z.infer<typeof TopProviderSchema>;

export const ModelSchema = z.object({
    id: z.string(),
    canonical_slug: z.string(),
    hugging_face_id: z.union([z.null(), z.string()]),
    name: z.string(),
    created: z.number(),
    description: z.string(),
    context_length: z.number(),
    architecture: ArchitectureSchema,
    pricing: PricingSchema,
    top_provider: TopProviderSchema,
    per_request_limits: z.null(),
    supported_parameters: z.array(SupportedParameterSchema),
    default_parameters: z.union([DefaultParametersSchema, z.null()]),
});
export type Model = z.infer<typeof ModelSchema>;

export const ModelsResponse = z.object({
    data: z.array(ModelSchema),
});
export type ModelsResponse = z.infer<typeof ModelsResponse>;
