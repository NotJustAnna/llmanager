import { injectable } from "tsyringe";
import OllamaIngest from "@/api/ingest/ollama.ingest.ts";
import OpenrouterIngest from "@/api/ingest/openrouter.ingest.ts";

@injectable()
export default class ModelService {
    constructor(
        private readonly openrouterIngest: OpenrouterIngest,
        private readonly ollamaIngest: OllamaIngest,
    ) {
        openrouterIngest.start();
        ollamaIngest.start();
    }
}
