import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

interface OpenRouterCredits {
    credits: number;
    usage: number;
}

export function useOpenRouterCredits() {
    const { accessToken } = useAuth();
    const [data, setData] = useState<OpenRouterCredits | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accessToken) return;

        const fetchCredits = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/integration/openrouter/credits", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch credits");
                }
                const result = await response.json();
                setData({
                    credits: result.totals.credits,
                    usage: result.totals.usage,
                });
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
                setData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCredits();
    }, [accessToken]);

    return { data, isLoading, error };
}
