import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface UpdateButtonState {
    hasPendingChanges: boolean;
    isLoading: boolean;
    onUpdate: () => void;
}

interface UpdateButtonContextType {
    state: UpdateButtonState | null;
    setUpdateButton: (state: UpdateButtonState | null) => void;
}

const UpdateButtonContext = createContext<UpdateButtonContextType | undefined>(undefined);

export function UpdateButtonProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<UpdateButtonState | null>(null);

    return (
        <UpdateButtonContext.Provider value={{ state, setUpdateButton: setState }}>
            {children}
        </UpdateButtonContext.Provider>
    );
}

export function useUpdateButton() {
    const context = useContext(UpdateButtonContext);
    if (!context) {
        throw new Error("useUpdateButton must be used within UpdateButtonProvider");
    }
    return context;
}
