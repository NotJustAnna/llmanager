import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useModels } from "../hooks/useModels";
import { usePendingChanges } from "../hooks/usePendingChanges";
import { useUpdateButton } from "../contexts/UpdateButtonContext";
import { useSettings } from "../hooks/useSettings";
import { ModelCard } from "./ModelCard";
import type { Model } from "@/shared/schema/model.controller";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { AlertCircle, Check, ChevronDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "./ui/dropdown-menu";

interface ModelsPageProps {
    source: "openrouter" | "ollama";
}

export function ModelsPage({ source }: ModelsPageProps) {
    const { models, isLoading, error, updateAllowlist, refetch } = useModels(source);
    const {
        hasPendingChanges,
        toggleModel,
        getPendingAllowlistIds,
        clearPendingChanges,
        pendingChanges,
        setModelsAllowed,
    } = usePendingChanges();
    const { setUpdateButton } = useUpdateButton();
    const { settings } = useSettings();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "allowed" | "blocked">("all");
    const [filterFree, setFilterFree] = useState<"all" | "free" | "paid">("all");
    const [sortBy, setSortBy] = useState<"name" | "provider" | "input-cost" | "output-cost" | "combined-cost">("name");
    const [isSaving, setIsSaving] = useState(false);

    const currentAllowed = useMemo(() => new Set(models.filter((m) => m.allowed).map((m) => m.id)), [models]);

    const filteredModels = useMemo(() => {
        const filtered = models.filter((model) => {
            const dotIndex = model.id.indexOf(".");
            const modelId = dotIndex !== -1 ? model.id.substring(dotIndex + 1) : model.id;
            const matchesSearch =
                model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                modelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                filterStatus === "all" ||
                (filterStatus === "allowed" && model.allowed) ||
                (filterStatus === "blocked" && !model.allowed);

            if (source === "openrouter") {
                const isFree = model.pricing.type === "free";
                const matchesPrice =
                    filterFree === "all" || (filterFree === "free" && isFree) || (filterFree === "paid" && !isFree);
                return matchesSearch && matchesStatus && matchesPrice;
            }

            return matchesSearch && matchesStatus;
        });

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "provider": {
                    const providerA = a.id.split(".", 2)[0] || "";
                    const providerB = b.id.split(".", 2)[0] || "";
                    const providerCompare = providerA.localeCompare(providerB);
                    if (providerCompare !== 0) return providerCompare;
                    return a.name.localeCompare(b.name);
                }
                case "input-cost": {
                    const costA = a.pricing.type === "free" ? 0 : a.pricing.prompt;
                    const costB = b.pricing.type === "free" ? 0 : b.pricing.prompt;
                    return costA - costB;
                }
                case "output-cost": {
                    const costA = a.pricing.type === "free" ? 0 : a.pricing.completion;
                    const costB = b.pricing.type === "free" ? 0 : b.pricing.completion;
                    return costA - costB;
                }
                case "combined-cost": {
                    const costA = a.pricing.type === "free" ? 0 : a.pricing.prompt + a.pricing.completion;
                    const costB = b.pricing.type === "free" ? 0 : b.pricing.prompt + b.pricing.completion;
                    return costA - costB;
                }
                default:
                    return 0;
            }
        });
    }, [models, searchQuery, filterStatus, filterFree, source, sortBy]);

    const handleAllowAll = () => {
        setModelsAllowed(
            filteredModels.map((m) => ({ id: m.id, originalAllowed: m.allowed })),
            true,
        );
    };

    const handleDisallowAll = () => {
        // Don't disallow the generative model
        const modelsToDisallow = filteredModels
            .filter((m) => m.id !== settings?.generativeModel)
            .map((m) => ({ id: m.id, originalAllowed: m.allowed }));
        setModelsAllowed(modelsToDisallow, false);
    };

    const handleSaveChanges = useCallback(async () => {
        setIsSaving(true);
        try {
            const allowedIds = getPendingAllowlistIds(
                models.map((m) => ({ id: m.id, allowed: m.allowed })),
                currentAllowed,
            );
            await updateAllowlist(allowedIds);
            clearPendingChanges();
            toast.success("Changes saved successfully");
        } catch {
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    }, [models, currentAllowed, getPendingAllowlistIds, updateAllowlist, clearPendingChanges]);

    // Update the global update button state based on pending changes
    useEffect(() => {
        if (hasPendingChanges) {
            setUpdateButton({
                hasPendingChanges: true,
                isLoading: isSaving,
                onUpdate: handleSaveChanges,
            });
        } else {
            setUpdateButton(null);
        }
    }, [hasPendingChanges, handleSaveChanges, isSaving, setUpdateButton]);

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
                <Skeleton className="h-30 mb-14" />
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={`skelly-${i + 1}`} className="h-48" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto">
                <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <div>
                            <h3 className="font-semibold">Error loading models</h3>
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full flex-shrink-0">
                {/* Search and Filter Card */}
                <Card className="p-4 mb-6 -space-y-2">
                    <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, ID, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-between space-x-2">
                        {/*<div className="flex items-center gap-2 text-sm">*/}
                            <span className="text-muted-foreground">Models which are</span>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-8 px-3 text-sm font-medium">
                                        {filterStatus === "all" ? "allowed and blocked" : filterStatus}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="min-w-32">
                                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup
                                        value={filterStatus}
                                        onValueChange={(value) =>
                                            setFilterStatus(value as "all" | "allowed" | "blocked")
                                        }
                                    >
                                        <DropdownMenuRadioItem value="all">All below</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="allowed">Allowed</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="blocked">Blocked</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {source === "openrouter" && (
                                <>
                                    <span className="text-muted-foreground">and</span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="h-8 px-3 text-sm font-medium">
                                                {filterFree === "all" ? "free and paid" : filterFree}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="min-w-32">
                                            <DropdownMenuLabel>Pricing</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuRadioGroup
                                                value={filterFree}
                                                onValueChange={(value) =>
                                                    setFilterFree(value as "all" | "free" | "paid")
                                                }
                                            >
                                                <DropdownMenuRadioItem value="all">All below</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="free">Free</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="paid">Paid</DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}

                            <span className="text-muted-foreground">sorted by</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-8 px-3 text-sm font-medium">
                                        {sortBy.replace("-", " ")}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="min-w-32">
                                    <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup
                                        value={sortBy}
                                        onValueChange={(value) =>
                                            setSortBy(
                                                value as
                                                    | "name"
                                                    | "provider"
                                                    | "input-cost"
                                                    | "output-cost"
                                                    | "combined-cost",
                                            )
                                        }
                                    >
                                        <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                                        {source === "openrouter" && (
                                            <DropdownMenuRadioItem value="provider">Provider</DropdownMenuRadioItem>
                                        )}
                                        <DropdownMenuRadioItem value="input-cost">Input Cost</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="output-cost">Output Cost</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="combined-cost">
                                            Combined Cost
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        {/*</div>*/}

                        <div className="flex-1 flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-8 px-3 text-sm"
                                        disabled={filteredModels.length === 0}
                                    >
                                        Bulk actions <ChevronDown />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={handleAllowAll}>
                                        <Check /> Allow all models
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDisallowAll}>
                                        <X /> Disallow all models
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Models Grid - Takes up remaining space */}
            {filteredModels.length === 0 ? (
                <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full">
                    <Card className="p-8 text-center">
                        <p className="text-muted-foreground">No models found</p>
                    </Card>
                </div>
            ) : (
                <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full flex-1 min-h-0 flex flex-col">
                    <VirtualizedModelsList
                        models={filteredModels}
                        totalModels={models.length}
                        onToggleModel={toggleModel}
                        isSaving={isSaving}
                        isOpenRouter={source === "openrouter"}
                        pendingChanges={pendingChanges}
                        refetch={refetch}
                        generativeModelId={settings?.generativeModel ?? undefined}
                    />
                </div>
            )}
        </div>
    );
}

interface VirtualizedModelsListProps {
    models: Model[];
    totalModels: number;
    onToggleModel: (modelId: string) => void;
    isSaving: boolean;
    isOpenRouter: boolean;
    pendingChanges: Set<string>;
    refetch?: () => Promise<void>;
    generativeModelId?: string;
}

function VirtualizedModelsList({
    models,
    totalModels,
    onToggleModel,
    isSaving,
    isOpenRouter,
    pendingChanges,
    refetch,
    generativeModelId,
}: VirtualizedModelsListProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: models.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 140, // Estimate card height in pixels
        overscan: 5, // Render 5 items outside visible area for smoother scrolling
        measureElement:
            typeof window !== "undefined" ? (element) => element?.getBoundingClientRect().height : undefined,
    });

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div className="flex flex-col h-full">
            <p className="text-sm text-muted-foreground mb-4 flex-shrink-0">
                Showing {models.length} of {totalModels} models
            </p>
            <div ref={parentRef} className="flex-1 overflow-y-auto min-h-0">
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {virtualItems.map((virtualItem) => {
                        // biome-ignore lint/style/noNonNullAssertion: The models array is guaranteed to have the index since virtualizer count is based on models.length
                        const model = models[virtualItem.index]!;
                        return (
                            <div
                                key={virtualItem.key}
                                data-index={virtualItem.index}
                                ref={(el) => virtualizer.measureElement(el)}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                                className="pb-4"
                            >
                                <ModelCard
                                    model={model}
                                    onToggle={onToggleModel}
                                    isLoading={isSaving}
                                    isOpenRouter={isOpenRouter}
                                    isPending={pendingChanges.has(model.id)}
                                    refetch={refetch}
                                    isGenerativeModel={model.id === generativeModelId}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
