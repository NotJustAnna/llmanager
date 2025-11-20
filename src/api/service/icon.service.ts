import { injectable } from "tsyringe";
import upfetch from "@/shared/lib/upfetch.ts";

type FileNode = { name: string } & ({ type: "file" } | { type: "directory"; children: FileNode[] });

type DirNode = FileNode & { type: "directory" };

function indexedLookup(str: string, values: string[], override: Record<string, string> = {}) {
    const matches: Record<string, number> = {};
    for (const v of values) {
        const i = str.indexOf(v);
        if (i >= 0) {
            matches[override[v] ?? v] = i;
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
        microsoft: "copilot",
        phi: "copilot",
        llama: "ollama",
        granite: "ibm",
    };
    private readonly preferredIconOrder = [
        "dark-colorbg-avatarfit",
        "light-colorbg-avatarfit",
        "dark-color-bg-avatarfit",
        "light-color-bg-avatarfit",
        "dark-bg-avatarfit",
        "light-bg-avatarfit",
    ].flatMap((it) => [`${it}.webp`, `${it}.png`]);

    async getIconForModel(modelId: string): Promise<string> {
        const index = await this.getOrDownloadIndex();
        const brands = index.children.map((it) => it.name);
        const iconNames = this.extractIconNames(modelId, brands);

        const iconName = iconNames[0] ?? "openrouter"; // Assume OpenRouter is always there.
        return this.getBestIconOfBrand(index, iconName);
    }

    private async getOrDownloadIndex(): Promise<DirNode> {
        if (this._index) {
            return this._index.children.find(it => it.name === "icons" && it.type === "directory") as DirNode;
        } else {
            const newIndex = await upfetch(this.indexUrl);
            this._index = newIndex;
            return newIndex.children.find((it: any) => it.name === "icons" && it.type === "directory") as DirNode;
        }
    }

    private extractIconNames(modelId: string, brands: string[]): string[] {
        if (modelId.includes("/")) {
            // Handle OpenRouter-style names (provider/model)
            const [provider, modelPart] = modelId.split("/", 2) as [string, string];
            return [
                ...indexedLookup(modelPart, brands, this.iconOverride),
                ...indexedLookup(provider, brands, this.iconOverride),
            ];
        } else {
            // Handle Ollama-style names (no provider)
            return indexedLookup(modelId, brands, this.iconOverride);
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
        let bestRank = Number.MAX_SAFE_INTEGER;
        for (const child of brandNode.children) {
            if (child.type !== "file") continue;
            const rank = this.preferredIconOrder.indexOf(child.name);
            if (rank < bestRank) {
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
