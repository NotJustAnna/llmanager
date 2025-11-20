import { injectable } from "tsyringe";
import upfetch from "@/shared/lib/upfetch.ts";

type FileNode = { name: string } & ({ type: "file" } | { type: "directory"; children: FileNode[] });

type DirNode = FileNode & { type: "directory" };

function indexedLookup(str: string, values: string[]) {
    const matches: Record<string, number> = {};
    for (const v of values) {
        const i = str.indexOf(v);
        if (i >= 0) {
            matches[v] = i;
        }
    }
    return Object.entries(matches)
        .sort((a, b) => a[1] - b[1])
        .map(([s]) => s);
}

@injectable()
export default class IconService {
    private readonly baseUrl = `https://cdn.jsdelivr.net/gh/NotJustAnna/extended-lobe-icons@main`;
    private readonly indexUrl = `${this.baseUrl}/packages/index.json`;
    private _index: DirNode | null = null;
    private readonly iconOverride: Record<string, string> = {
        // Personal joke: Microsoft & Phi should use the Copilot icon
        microsoft: "copilot",
        phi: "copilot",
        // Personal preference: use Ollama icons for Llama models
        llama: "ollama",
        // Actual overrides
        granite: "ibm",
        qwq: "qwen",
        "z-ai": "zai",
        // Removing modifiers that don't help with icon selection
        exacto: "",
        free: "",
        instruct: "",
        reasoning: "",
        reason: "",
        thinking: "",
        think: "",
        turbo: "",
        audio: "",
    };
    private readonly preferredIconOrder = [
        "dark-colorbg-avatarfit",
        "light-colorbg-avatarfit",
        "dark-color-bg-avatarfit",
        "light-color-bg-avatarfit",
        "dark-bg-avatarfit",
        "light-bg-avatarfit",
    ].flatMap((it) => [`${it}.webp`, `${it}.png`]);

    async getIconForModel(modelId: string, defaultValue: string): Promise<string> {
        const index = await this.getOrDownloadIndex();
        const brands = index.children.map((it) => it.name);
        const iconNames = this.extractIconNames(modelId, brands);

        const iconName = iconNames[0] ?? defaultValue;
        return this.getBestIconOfBrand(index, iconName);
    }

    private async getOrDownloadIndex(): Promise<DirNode> {
        if (this._index) {
            return this._index.children.find((it) => it.name === "icons" && it.type === "directory") as DirNode;
        } else {
            const newIndex = await upfetch(this.indexUrl);
            this._index = newIndex;
            return newIndex.children.find((it: any) => it.name === "icons" && it.type === "directory") as DirNode;
        }
    }

    private extractIconNames(modelId: string, brands: string[]): string[] {
        // Apply overrides to modelId string (find and replace)
        let effectiveModelId = modelId;
        for (const [key, value] of Object.entries(this.iconOverride)) {
            effectiveModelId = effectiveModelId.replaceAll(key, value);
        }

        if (effectiveModelId.includes("/")) {
            // Handle OpenRouter-style names (provider/model)
            const [provider, modelPart] = effectiveModelId.split("/", 2) as [string, string];
            return [...indexedLookup(modelPart, brands), ...indexedLookup(provider, brands)];
        } else {
            // Handle Ollama-style names (no provider)
            return indexedLookup(effectiveModelId, brands);
        }
    }

    private getBestIconOfBrand(index: DirNode, iconName: string) {
        const brandNode = index.children.find((it) => it.name === iconName && it.type === "directory") as
            | DirNode
            | undefined;
        if (!brandNode) {
            throw new Error(`This should never happen: ${iconName} not found on index`);
        }
        let best: string | null = null;
        let bestRank = this.preferredIconOrder.length + 10;
        for (const child of brandNode.children) {
            if (child.type !== "file") continue;
            const rank = this.preferredIconOrder.indexOf(child.name);
            if (rank > -1 && rank < bestRank) {
                best = child.name;
                bestRank = rank;
            }
        }
        if (!best) {
            throw new Error(`This should never happen: no icons found for brand ${iconName}`);
        }
        return `${this.baseUrl}/packages/icons/${iconName}/${best}`;
    }
}
