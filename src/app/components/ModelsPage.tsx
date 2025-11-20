import {useState, useMemo, useEffect} from "react";
import {useModels} from "../hooks/useModels";
import {usePendingChanges} from "../hooks/usePendingChanges";
import {ModelCard} from "./ModelCard";
import {FloatingUpdateButton} from "./FloatingUpdateButton";
import {Card} from "./ui/card";
import {Input} from "./ui/input";
import {Button} from "./ui/button";
import {Skeleton} from "./ui/skeleton";
import {AlertCircle, Check, ChevronDown, Search, X} from "lucide-react";
import {toast} from "sonner";
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

export function ModelsPage({source}: ModelsPageProps) {
    const {models, isLoading, error, updateAllowlist} = useModels(source);
    const {hasPendingChanges, toggleModel, getPendingAllowlistIds, clearPendingChanges} = usePendingChanges();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "allowed" | "blocked">("all");
    const [filterFree, setFilterFree] = useState<"all" | "free" | "paid">(source === "openrouter" ? "all" : "all");
    const [isSaving, setIsSaving] = useState(false);

    const currentAllowed = useMemo(() => new Set(models.filter((m) => m.allowed).map((m) => m.id)), [models]);

    const filteredModels = useMemo(() => {
        return models.filter((model) => {
            const matchesSearch =
                model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    }, [models, searchQuery, filterStatus, filterFree, source]);

    const handleAllowAll = () => {
        filteredModels.forEach((model) => {
            if (!model.allowed) {
                toggleModel(model.id);
            }
        });
    };

    const handleDisallowAll = () => {
        filteredModels.forEach((model) => {
            if (model.allowed) {
                toggleModel(model.id);
            }
        });
    };

    const handleToggleModel = (modelId: string) => {
        toggleModel(modelId);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const allowedIds = getPendingAllowlistIds(
                models.map((m) => ({id: m.id, allowed: m.allowed})),
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
    };

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
                <Skeleton className="h-30 mb-14"/>
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={`skelly-${i+1}`} className="h-48"/>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto">
                <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400"/>
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
        <>
            <div className="p-4 sm:p-6 max-w-6xl mx-auto">
                {/* Search and Filter Card */}
                <Card className="p-4 mb-6 -space-y-2">
                    <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-muted-foreground"/>
                        <Input
                            placeholder="Search by name, ID, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Models which are</span>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-8 px-3 text-sm font-medium">
                                        {filterStatus === "all" ? "allowed and blocked" : filterStatus}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48">
                                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuRadioGroup value={filterStatus}
                                                            onValueChange={(value) => setFilterStatus(value as "all" | "allowed" | "blocked")}>
                                        <DropdownMenuRadioItem value="all">Allowed and blocked</DropdownMenuRadioItem>
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
                                        <DropdownMenuContent className="w-48">
                                            <DropdownMenuLabel>Pricing</DropdownMenuLabel>
                                            <DropdownMenuSeparator/>
                                            <DropdownMenuRadioGroup value={filterFree}
                                                                    onValueChange={(value) => setFilterFree(value as "all" | "free" | "paid")}>
                                                <DropdownMenuRadioItem value="all">Free and paid</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="free">Free</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="paid">Paid</DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-8 px-3 text-sm"
                                        disabled={filteredModels.length === 0}>
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
                </Card>

                {/* Models Grid */}
                {filteredModels.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-muted-foreground">No models found</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredModels.length} of {models.length} models
                        </p>
                        <div className="grid gap-4">
                            {filteredModels.map((model) => (
                                <ModelCard
                                    key={model.id}
                                    model={model}
                                    onToggle={() => handleToggleModel(model.id)}
                                    isLoading={isSaving}
                                    isOpenRouter={source === "openrouter"}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <FloatingUpdateButton
                hasPendingChanges={hasPendingChanges}
                isLoading={isSaving}
                onUpdate={handleSaveChanges}
            />
        </>
    );
}
