import { ModelsPage } from "../components/ModelsPage";
import { PendingChangesProvider } from "../hooks/usePendingChanges";

export default function OpenRouterPage() {
    return (
        <PendingChangesProvider>
            <ModelsPage source="openrouter" />
        </PendingChangesProvider>
    );
}
