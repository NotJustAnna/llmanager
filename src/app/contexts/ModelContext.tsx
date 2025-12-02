import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Model } from "@/shared/schema/model.controller";
import { useAuth } from "../hooks/useAuth";

interface ModelContextType {
    openRouterModels: Model[];
    ollamaModels: Model[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    updateAllowlist: (source: "openrouter" | "ollama", whitelistIds: string[]) => Promise<void>;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
    const { accessToken } = useAuth();
    const [openRouterModels, setOpenRouterModels] = useState<Model[]>([]);
    const [ollamaModels, setOllamaModels] = useState<Model[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchModels = useCallback(async () => {
        if (!accessToken) return;

        setIsLoading(true);
        setError(null);
        try {
            const [openRouterRes, ollamaRes] = await Promise.all([
                fetch("/api/models?provider=openrouter", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }),
                fetch("/api/models?provider=ollama", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }),
            ]);

            if (!openRouterRes.ok || !ollamaRes.ok) {
                throw new Error("Failed to fetch models");
            }

            const [openRouterData, ollamaData] = await Promise.all([
                openRouterRes.json(),
                ollamaRes.json(),
            ]);

            setOpenRouterModels(Array.isArray(openRouterData) ? openRouterData : openRouterData.models || []);
            setOllamaModels(Array.isArray(ollamaData) ? ollamaData : ollamaData.models || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [accessToken]);

    const updateAllowlist = useCallback(
        async (source: "openrouter" | "ollama", whitelistIds: string[]) => {
            try {
                let response: Response;

                // If whitelistIds is empty, call the clear endpoint instead
                if (whitelistIds.length === 0) {
                    response = await fetch(`/api/models/allowlist/clear?provider=${source}`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                } else {
                    response = await fetch("/api/models/allowlist", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({ whitelistIds }),
                    });
                }

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

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    return (
        <ModelContext.Provider
            value={{
                openRouterModels,
                ollamaModels,
                isLoading,
                error,
                refetch: fetchModels,
                updateAllowlist,
            }}
        >
            {children}
        </ModelContext.Provider>
    );
}

export function useModelsContext() {
    const context = useContext(ModelContext);
    if (!context) {
        throw new Error("useModelsContext must be used within ModelProvider");
    }
    return context;
}
