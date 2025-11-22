import {memo, useCallback, useState} from "react";
import {Card} from "./ui/card";
import {Switch} from "./ui/switch";
import {Badge} from "./ui/badge";
import {Avatar, AvatarImage, AvatarFallback} from "./ui/avatar";
import {Button} from "./ui/button";
import {Tooltip, TooltipTrigger, TooltipContent} from "./ui/tooltip";
import type {Model} from "@/shared/schema/model.controller";
import {formatTokensPerCent} from "@/shared/lib/pricing";
import {AlertCircle, Check, X, Pencil, Sparkles} from "lucide-react";
import EditModelSheet from "./EditModelSheet";

interface ModelCardProps {
    model: Model;
    onToggle: (modelId: string) => void;
    isLoading?: boolean;
    isOpenRouter?: boolean;
    isPending?: boolean;
    refetch?: () => Promise<void>;
    isGenerativeModel?: boolean;
}

export const ModelCard = memo(function ModelCard({
                                                     model,
                                                     onToggle,
                                                     isLoading = false,
                                                     isOpenRouter = false,
                                                     isPending = false,
                                                     refetch,
                                                     isGenerativeModel = false,
                                                 }: ModelCardProps) {
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const isFree = model.pricing.type === "free";
    const dotIndex = model.id.indexOf(".");
    const modelId = dotIndex !== -1 ? model.id.substring(dotIndex + 1) : model.id;

    // Determine the visual state: if pending, show the opposite of current state
    const visuallyAllowed = isPending ? !model.allowed : model.allowed;

    const handleToggle = useCallback(() => {
        onToggle(model.id);
    }, [onToggle, model.id]);

    return (
        <Card className="p-4 hover:shadow-lg transition-shadow gap-1">
            <div className="flex gap-4 mb-3 items-center">
                {/* Model avatar */}
                <Avatar className="h-6 w-6 sm:h-12 sm:w-12 flex-shrink-0">
                    <AvatarImage src={model.imageUrl.toString()} alt={model.name}/>
                    <AvatarFallback>{model.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                {/* Model info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm md:text-base truncate">{model.name}</h3>
                            <a
                                href={
                                    isOpenRouter
                                        ? `https://openrouter.ai/${modelId}`
                                        : `https://ollama.com/library/${modelId}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground truncate font-mono hover:underline"
                            >
                                {modelId}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Toggle switch and Edit button */}
                <div className="flex-shrink-0 flex pt-1 items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditSheetOpen(true)}
                        disabled={isLoading}
                        className="-my-1"
                    >
                        <Pencil className="h-4 w-4"/>
                    </Button>
                    <div className="flex flex-wrap gap-2">
                        {isGenerativeModel && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">
                                        <Sparkles className="h-3 w-3"/>
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    Generative Model used by <span className="font-bold">LLManager</span> for description generation.
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {isOpenRouter && isFree && <Badge variant="outline">Free</Badge>}
                        {!isOpenRouter && isFree && <Badge variant="outline">Local</Badge>}
                        {(model.id === "openrouter.openrouter/auto") && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                                        <AlertCircle className="h-3 w-3 mr-1"/>
                                        Dynamic Pricing
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <div className="w-68">
                                        Your prompt will be processed by a meta-model and routed to one of dozens of models,
                                        optimizing for the best possible output.
                                        Your response will be priced at the same rate as the routed model.
                                    </div>

                                </TooltipContent>
                            </Tooltip>


                        )}
                        {/*{visuallyAllowed && (
                            <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                                <Check className="h-3 w-3 mr-1"/>
                                Allowed
                            </Badge>
                        )}
                        {!visuallyAllowed && (
                            <Badge variant="secondary">
                                <X className="h-3 w-3 mr-1"/>
                                Blocked
                            </Badge>
                        )}*/}
                        {isPending && (
                            <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
                                Pending
                            </Badge>
                        )}
                    </div>

                    {isGenerativeModel ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Switch checked={visuallyAllowed} disabled={true} className="bg-primary"/>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                This model is set as the generative model.
                                To disable it, change it in Settings.
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <Switch checked={visuallyAllowed} onCheckedChange={handleToggle} disabled={isLoading}/>
                    )}
                </div>
            </div>

            {/* Description and pricing info side by side */}
            <div className="flex gap-4">
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 flex-1">{model.description}</p>

                {/* Pricing info card */}
                {model.pricing.type === "paid" && model.id !== "openrouter.openrouter/auto" && (
                    <Card className="bg-muted/50 p-2 flex-shrink-0">
                        <div className="text-xs space-y-0.5 text-muted-foreground text-right">
                            <div>
                                <span className="font-medium text-foreground pr-1.5">Input:</span>
                                {formatTokensPerCent(model.pricing.prompt)}
                                <span className="pl-1.5 text-foreground">t/¢</span>
                            </div>
                            <div>
                                <span className="font-medium text-foreground pr-1.5">Output:</span>
                                {formatTokensPerCent(model.pricing.completion)}
                                <span className="pl-1.5 text-foreground">t/¢</span>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            <EditModelSheet model={model} open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen} refetch={refetch}/>
        </Card>
    );
});
