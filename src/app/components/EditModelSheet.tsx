import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose, SheetDescription } from "./ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
import type { Model } from "@/shared/schema/model.controller";
import type { EditModelReq } from "@/shared/schema/model.controller";
import { useAuth } from "../hooks/useAuth";
import { Loader2, Sparkles } from "lucide-react";

interface EditModelSheetProps {
    model: Model;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    refetch?: () => Promise<void>;
}

export default function EditModelSheet({ model, open, onOpenChange, refetch }: EditModelSheetProps) {
    const [name, setName] = useState(model.name);
    const [description, setDescription] = useState(model.description);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingName, setIsGeneratingName] = useState(false);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const { accessToken } = useAuth();

    // Reset form when sheet opens/closes
    useEffect(() => {
        if (open) {
            setName(model.name);
            setDescription(model.description);
        }
    }, [open, model.name, model.description]);

    const handleGenerateName = async () => {
        setIsGeneratingName(true);
        try {
            const response = await fetch("/api/models/generate/name", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ modelId: model.id }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate name");
            }

            const data = await response.json();
            setName(data.name);
        } catch (_) {
            toast.error("Failed to generate name");
        } finally {
            setIsGeneratingName(false);
        }
    };

    const handleGenerateDescription = async () => {
        setIsGeneratingDescription(true);
        try {
            const response = await fetch("/api/models/generate/description", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ modelId: model.id }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate description");
            }

            const data = await response.json();
            setDescription(data.description);
        } catch (_) {
            toast.error("Failed to generate description");
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        if (!description.trim()) {
            toast.error("Description cannot be empty");
            return;
        }

        setIsLoading(true);
        try {
            const req: EditModelReq = {
                modelId: model.id,
                name: name !== model.name ? name : undefined,
                description: description !== model.description ? description : undefined,
            };

            const response = await fetch("/api/models/edit", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(req),
            });

            if (!response.ok) {
                throw new Error("Failed to save model");
            }

            toast.success("Model saved successfully");
            onOpenChange(false);
            await refetch?.();
        } catch (_) {
            toast.error("Failed to save model");
        } finally {
            setIsLoading(false);
        }
    };

    const hasChanges = name !== model.name || description !== model.description;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit Model</SheetTitle>
                    <SheetDescription>{model.id}</SheetDescription>
                </SheetHeader>

                <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6 overflow-y-auto">
                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="model-name">Name</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleGenerateName}
                                disabled={isGeneratingName || isLoading}
                            >
                                {isGeneratingName && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                Generate <Sparkles />
                            </Button>
                        </div>
                        <Input
                            id="model-name"
                            placeholder="Enter model name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading || isGeneratingName}
                        />
                    </div>

                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="model-description">Description</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleGenerateDescription}
                                disabled={isGeneratingDescription || isLoading}
                            >
                                {isGeneratingDescription && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                Generate <Sparkles />
                            </Button>
                        </div>
                        <Textarea
                            id="model-description"
                            placeholder="Enter model description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading || isGeneratingDescription}
                            className="min-h-24"
                        />
                    </div>
                </div>

                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="button" variant="outline" disabled={isLoading}>
                            Cancel
                        </Button>
                    </SheetClose>
                    <Button type="button" onClick={handleSave} disabled={isLoading || !hasChanges}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
