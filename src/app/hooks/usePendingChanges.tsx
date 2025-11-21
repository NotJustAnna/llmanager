import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface PendingChangesContextType {
    hasPendingChanges: boolean;
    pendingChanges: Set<string>;
    toggleModel: (modelId: string) => void;
    setModelsAllowed: (updates: { id: string; originalAllowed: boolean }[], targetAllowed: boolean) => void;
    getPendingAllowlistIds: (
        allModels: Array<{ id: string; allowed: boolean }>,
        currentAllowed: Set<string>,
    ) => string[];
    clearPendingChanges: () => void;
}

export const PendingChangesContext = createContext<PendingChangesContextType | undefined>(undefined);

export function usePendingChanges() {
    const context = useContext(PendingChangesContext);
    if (!context) {
        throw new Error("usePendingChanges must be used within a PendingChangesProvider");
    }
    return context;
}

export function PendingChangesProvider({ children }: { children: ReactNode }) {
    const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

    const toggleModel = useCallback((modelId: string) => {
        setPendingChanges((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(modelId)) {
                newSet.delete(modelId);
            } else {
                newSet.add(modelId);
            }
            return newSet;
        });
    }, []);

    const setModelsAllowed = useCallback(
        (updates: { id: string; originalAllowed: boolean }[], targetAllowed: boolean) => {
            setPendingChanges((prev) => {
                const newSet = new Set(prev);
                updates.forEach(({ id, originalAllowed }) => {
                    // If the target state is different from the original state, we need a pending change.
                    // If it's the same, we ensure there is NO pending change.
                    if (targetAllowed !== originalAllowed) {
                        newSet.add(id);
                    } else {
                        newSet.delete(id);
                    }
                });
                return newSet;
            });
        },
        [],
    );

    const clearPendingChanges = useCallback(() => {
        setPendingChanges(new Set());
    }, []);

    const getPendingAllowlistIds = useCallback(
        (allModels: Array<{ id: string; allowed: boolean }>, currentAllowed: Set<string>) => {
            // Build the final allowlist by applying pending changes
            const finalAllowed = new Set(allModels.filter((m) => currentAllowed.has(m.id)).map((m) => m.id));

            // Apply pending changes
            pendingChanges.forEach((modelId) => {
                if (finalAllowed.has(modelId)) {
                    finalAllowed.delete(modelId);
                } else {
                    finalAllowed.add(modelId);
                }
            });

            return Array.from(finalAllowed);
        },
        [pendingChanges],
    );

    const value: PendingChangesContextType = {
        hasPendingChanges: pendingChanges.size > 0,
        pendingChanges,
        toggleModel,
        setModelsAllowed,
        getPendingAllowlistIds,
        clearPendingChanges,
    };

    return <PendingChangesContext.Provider value={value}>{children}</PendingChangesContext.Provider>;
}
