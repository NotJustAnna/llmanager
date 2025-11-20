import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { type Model, Pricing } from "@/shared/schema/model.controller";
import { AlertCircle, Check } from "lucide-react";

interface ModelCardProps {
    model: Model;
    onToggle: () => void;
    isLoading?: boolean;
    isOpenRouter?: boolean;
}

export function ModelCard({ model, onToggle, isLoading = false, isOpenRouter = false }: ModelCardProps) {
    const isFree = model.pricing.type === "free";
    const modelId = model.id.split(".")[1] || model.id;

    return (
        <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex gap-4">
                {/* Model image */}
                <div className="flex-shrink-0 hidden sm:block">
                    <img
                        src={model.imageUrl.toString()}
                        alt={model.name}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e5e7eb' width='100' height='100'/%3E%3C/svg%3E";
                        }}
                    />
                </div>

                {/* Model info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm md:text-base truncate">{model.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{modelId}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {isFree && <Badge variant="outline">Free</Badge>}
                        {isOpenRouter && isFree && <Badge variant="outline">OpenRouter</Badge>}
                        {model.allowed && (
                            <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                                <Check className="h-3 w-3 mr-1" />
                                Allowed
                            </Badge>
                        )}
                        {!model.allowed && (
                            <Badge variant="secondary">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Blocked
                            </Badge>
                        )}
                    </div>

                    <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">{model.description}</p>

                    {/* Pricing info */}
                    {model.pricing.type === "paid" && (
                        <div className="text-xs space-y-1 text-muted-foreground mb-3">
                            <p>Prompt: ${model.pricing.prompt}/1M tokens</p>
                            <p>Completion: ${model.pricing.completion}/1M tokens</p>
                        </div>
                    )}
                </div>

                {/* Toggle switch */}
                <div className="flex-shrink-0 flex items-start pt-1">
                    <Switch checked={model.allowed} onCheckedChange={onToggle} disabled={isLoading} />
                </div>
            </div>
        </Card>
    );
}
