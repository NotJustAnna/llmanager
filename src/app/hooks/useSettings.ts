import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import type { Settings } from "@/shared/schema/settings.controller";

export function useSettings() {
    const { accessToken } = useAuth();
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accessToken) return;

        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/settings", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch settings");
                }
                const data: Settings = await response.json();
                setSettings(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
                setSettings(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [accessToken]);

    return { settings, isLoading, error };
}
