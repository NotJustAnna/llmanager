import { useState, useCallback, useEffect } from "react";
import type { Model } from "@/shared/schema/model.controller";
import { useAuth } from "./useAuth";

export function useModels(source: "openrouter" | "ollama") {
    const [models, setModels] = useState<Model[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { accessToken } = useAuth();

    const fetchModels = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint =
                source === "openrouter" ? "/api/models?provider=openrouter" : "/api/models?provider=ollama";
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch models");
            }

            const data = await response.json();
            setModels(Array.isArray(data) ? data : data.models || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, source]);

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    const updateAllowlist = useCallback(
        async (whitelistIds: string[]) => {
            try {
                const response = await fetch("/api/models/allowlist", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ whitelistIds }),
                });

                if (!response.ok) {
                    throw new Error("Failed to update allowlist");
                }

                // Refetch models after update
                await fetchModels();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
                throw err;
            }
        },
        [accessToken, fetchModels],
    );

    return {
        models,
        isLoading,
        error,
        updateAllowlist,
        refetch: fetchModels,
    };
}
