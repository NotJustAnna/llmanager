import { injectable } from "tsyringe";
import AuthMiddleware from "@/api/middleware/auth.middleware.ts";
import * as Auth from "@/shared/schema/auth.controller.ts";
import AuthService from "@/api/service/auth.service.ts";
import { Responses_error } from "@/shared/schema/responses.ts";

@injectable()
export default class AuthController {
    constructor(
        private readonly auth: AuthMiddleware,
        private readonly authService: AuthService,
    ) {}

    /*
     * Logs in with a password and returns an access token.
     *
     * This is the only endpoint that does not require authentication.
     *
     * request body:
     *   password: string
     *
     * response body:
     *   accessToken: string
     */
    async login(req: Request): Promise<Response> {
        const { password } = Auth.LoginReq.parse(await req.json());

        if (!this.authService.verifyPassword(password)) {
            return Response.json(
                Responses_error.parse({
                    hint: "invalid-credentials",
                    message: "Invalid Credentials",
                }),
                {
                    status: 401, // Unauthorized
                },
            );
        }

        return Response.json(Auth.LoginRes.parse(this.authService.generateToken()));
    }

    /*
     * Changes the current password.
     *
     * request body:
     *   currentPassword: string
     *   newPassword: string
     *
     * response body:
     *   jwt: string
     */
    async changePassword(req: Request): Promise<Response> {
        if (!this.auth.valid(req)) {
            return this.auth.reject();
        }

        const { currentPassword, newPassword } = Auth.ChangePasswordReq.parse(await req.json());

        if (!this.authService.verifyPassword(currentPassword)) {
            return Response.json(
                Responses_error.parse({
                    hint: "invalid-credentials",
                    message: "Invalid Credentials",
                }),
                {
                    status: 401, // Unauthorized
                },
            );
        }

        return Response.json(Auth.ChangePasswordRes.parse(this.authService.updatePassword(newPassword)));
    }
}
