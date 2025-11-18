import { z } from "zod";

export const LoginReq = z.object({
    password: z.string(),
});
export type LoginReq = z.infer<typeof LoginReq>;

export const LoginRes = z.object({
    accessToken: z.string(),
});
export type LoginRes = z.infer<typeof LoginRes>;

export const ChangePasswordReq = z.object({
    currentPassword: z.string(),
    newPassword: z.string(),
});
export type ChangePasswordReq = z.infer<typeof ChangePasswordReq>;

export const ChangePasswordRes = LoginRes;
export type ChangePasswordRes = z.infer<typeof ChangePasswordRes>;
