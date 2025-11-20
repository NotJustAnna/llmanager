import { ModelsPage } from "../components/ModelsPage";
import { PendingChangesProvider } from "../hooks/usePendingChanges";

export default function OllamaPage() {
    return (
        <PendingChangesProvider>
            <ModelsPage source="ollama" />
        </PendingChangesProvider>
    );
}
