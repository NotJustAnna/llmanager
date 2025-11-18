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
    reasoning_content: z.string(),
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
