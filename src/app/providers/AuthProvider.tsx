import { useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../hooks/useAuth";
import type { LoginReq, LoginRes } from "@/shared/schema/auth.controller";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if token is stored in localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("accessToken");
        if (storedToken) {
            setAccessToken(storedToken);
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (password: string) => {
        const req: LoginReq = { password };
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
        });

        if (!response.ok) {
            throw new Error("Login failed");
        }

        const data: LoginRes = await response.json();
        setAccessToken(data.accessToken);
        setIsAuthenticated(true);
        localStorage.setItem("accessToken", data.accessToken);
    }, []);

    const logout = useCallback(() => {
        setAccessToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem("accessToken");
    }, []);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, accessToken, login, logout }}>{children}</AuthContext.Provider>
    );
}
