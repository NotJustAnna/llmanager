import { injectable } from "tsyringe";
import AuthService from "@/api/service/auth.service.ts";
import { Responses_error } from "@/shared/schema/responses.ts";

@injectable()
export default class AuthMiddleware {
    constructor(private authService: AuthService) {}

    /**
     * Checks if the user is logged in.
     * @param req - The incoming request object
     * @return The request object if not logged in, otherwise false
     */
    valid(req: Request): boolean {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        return this.authService.verifyToken(authHeader.substring(7));
    }

    reject(): Response {
        return Response.json(
            Responses_error.parse({
                hint: "unauthorized",
                message: "Unauthorized",
            }),
            {
                status: 401, // Unauthorized
            },
        );
    }
}
