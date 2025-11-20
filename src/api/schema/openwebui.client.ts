import { z } from "zod";

// Message types
export const MessageInputSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
    name: z.string().optional(),
});
export type MessageInput = z.infer<typeof MessageInputSchema>;

// Main Request schema
export const CompletionRequestSchema = z.object({
    messages: z.array(MessageInputSchema),
    model: z.string(),
    temperature: z.number(),
    max_tokens: z.number(),
});
export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;

export const MessageSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
    reasoning_content: z.string().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ChoiceSchema = z.object({
    index: z.number(),
    message: MessageSchema,
});
export type Choice = z.infer<typeof ChoiceSchema>;

export const CompletionResponseSchema = z.object({
    id: z.string(),
    created: z.number(),
    model: z.string(),
    choices: z.array(ChoiceSchema),
    object: z.literal("chat.completion"),
});
export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;

// OpenAI API Config
export const OpenAiConfigSchema = z.object({
    enable: z.boolean(),
    tags: z.array(z.object({ name: z.string() })),
    prefix_id: z.string(),
    model_ids: z.array(z.string()),
    connection_type: z.enum(["external", "local"]),
    auth_type: z.string(),
});
export type OpenAiConfig = z.infer<typeof OpenAiConfigSchema>;

export const OpenAiConfigRequestSchema = z.object({
    ENABLE_OPENAI_API: z.boolean(),
    OPENAI_API_BASE_URLS: z.array(z.string()),
    OPENAI_API_KEYS: z.array(z.string()),
    OPENAI_API_CONFIGS: z.record(z.string(), OpenAiConfigSchema),
});
export type OpenAiConfigRequest = z.infer<typeof OpenAiConfigRequestSchema>;

// Ollama API Config
export const OllamaConfigSchema = z.object({
    enable: z.boolean(),
    tags: z.array(z.object({ name: z.string() })),
    prefix_id: z.string(),
    model_ids: z.array(z.string()),
    connection_type: z.enum(["external", "local"]),
    auth_type: z.string(),
    key: z.string().optional(),
});
export type OllamaConfig = z.infer<typeof OllamaConfigSchema>;

export const OllamaConfigRequestSchema = z.object({
    ENABLE_OLLAMA_API: z.boolean(),
    OLLAMA_BASE_URLS: z.array(z.string()),
    OLLAMA_API_CONFIGS: z.record(z.string(), OllamaConfigSchema),
});
export type OllamaConfigRequest = z.infer<typeof OllamaConfigRequestSchema>;

// Model detail endpoints
export const ModelMetaSchema = z
    .object({
        profile_image_url: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        capabilities: z.record(z.string(), z.any()).nullable().optional(),
    })
    .loose(); // server Pydantic models allow extra fields
export type ModelMeta = z.infer<typeof ModelMetaSchema>;

// Params is effectively free-form
export const ModelParamsSchema = z.record(z.string(), z.any()).optional().nullable();
export type ModelParams = z.infer<typeof ModelParamsSchema>;

export const ModelDetailSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    base_model_id: z.string().optional().nullable(),
    name: z.string(),
    params: z.record(z.any(), z.any()).optional(),
    meta: ModelMetaSchema.optional(),
    access_control: z.any().optional().nullable(),
    is_active: z.boolean(),
    updated_at: z.number().int(),
    created_at: z.number().int(),
});
export type ModelDetail = z.infer<typeof ModelDetailSchema>;

// ModelForm expected by create/update handlers
export const ModelFormSchema = z
    .object({
        id: z.string(),
        base_model_id: z.string().optional().nullable(),
        name: z.string(),
        meta: ModelMetaSchema,
        params: ModelParamsSchema,
        access_control: z.record(z.string(), z.any()).optional().nullable(),
        is_active: z.boolean().optional(),
    })
    .loose();
export type ModelForm = z.infer<typeof ModelFormSchema>;

export const CreateModelRequestSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
});
export type CreateModelRequest = z.infer<typeof CreateModelRequestSchema>;
