import { sign, verify } from "jsonwebtoken";
import { injectable } from "tsyringe";
import { z } from "zod";
import DatabaseService from "@/api/service/database.service.ts";
import * as Auth from "@/shared/schema/auth.controller.ts";

@injectable()
export default class AuthService {
    constructor(private database: DatabaseService) {}

    verifyToken(jwt: string) {
        try {
            verify(z.jwt().parse(jwt), this.secret(), { complete: false });
            return true;
        } catch (_err) {
            return false;
        }
    }

    verifyPassword(password: string): boolean {
        return Bun.password.verifySync(password, this.passwordHash());
    }

    generateToken(): Auth.LoginRes {
        return { accessToken: sign({}, this.secret(), { expiresIn: "7d" }) };
    }

    updatePassword(password: string): Auth.ChangePasswordRes {
        this.database.setValue("auth_passwd_hash", Bun.password.hashSync(password));
        return this.generateToken();
    }

    private secret(): string {
        return this.database.getOrSetValue("auth_secret", process.env.AUTH_SECRET || crypto.randomUUID());
    }

    private passwordHash(): string {
        return this.database.getOrComputeValue("auth_passwd_hash", () =>
            Bun.password.hashSync(process.env.AUTH_PASSWORD || "admin"),
        );
    }
}
