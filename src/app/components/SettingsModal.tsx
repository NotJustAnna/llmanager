import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import type { ChangePasswordReq } from "@/shared/schema/auth.controller";
import type { Model } from "@/shared/schema/model.controller";
import type { Settings } from "@/shared/schema/settings.controller";
import { formatTokensPerCent } from "@/shared/lib/pricing";
import { useAuth } from "../hooks/useAuth";

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLogout: () => void;
}

export default function SettingsModal({ open, onOpenChange, onLogout }: SettingsModalProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [models, setModels] = useState<Model[]>([]);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const { accessToken } = useAuth();

    const loadModelsAndSettings = useCallback(async () => {
        try {
            setIsLoadingSettings(true);
            // Load available models
            const modelsResponse = await fetch("/api/models", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (modelsResponse.ok) {
                const modelsData = await modelsResponse.json();
                setModels(modelsData);
            }

            // Load current settings
            const settingsResponse = await fetch("/api/settings", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (settingsResponse.ok) {
                const settingsData: Settings = await settingsResponse.json();
                setSelectedModel(settingsData.generativeModel);
            }
        } catch (error) {
            console.error("Failed to load models and settings:", error);
        } finally {
            setIsLoadingSettings(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (open) {
            loadModelsAndSettings();
        }
    }, [open, loadModelsAndSettings]);

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    generativeModel: selectedModel,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update settings");
            }

            toast.success("Settings saved successfully");
        } catch (_) {
            toast.error("Failed to save settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const req: ChangePasswordReq = {
                currentPassword,
                newPassword,
            };

            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(req),
            });

            if (!response.ok) {
                throw new Error("Failed to change password");
            }

            toast.success("Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            onOpenChange(false);
        } catch (_) {
            toast.error("Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="password" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="password">Password</TabsTrigger>
                        <TabsTrigger value="model">Model</TabsTrigger>
                    </TabsList>

                    <TabsContent value="password" className="min-h-70 flex flex-col justify-center">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    placeholder="Enter current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || !currentPassword || !newPassword}
                            >
                                {isLoading ? "Changing..." : "Change Password"}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="model" className="space-y-6 min-h-70 flex flex-col justify-center">
                        <div className="space-y-2">
                            <Label htmlFor="model-select">Generative Model</Label>
                            <Select
                                value={selectedModel || ""}
                                onValueChange={(value) => setSelectedModel(value || null)}
                                disabled={isLoadingSettings || isSavingSettings}
                            >
                                <SelectTrigger id="model-select">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        const allowedModels = models.filter((m) => m.allowed);
                                        const ollamaModels = allowedModels
                                            .filter((m) => m.id.startsWith("ollama."))
                                            .sort((a, b) => a.name.localeCompare(b.name));
                                        const openrouterModels = allowedModels
                                            .filter((m) => m.id.startsWith("openrouter."))
                                            .sort((a, b) => a.name.localeCompare(b.name));

                                        return (
                                            <>
                                                {ollamaModels.length > 0 && (
                                                    <SelectGroup>
                                                        <SelectLabel>Ollama</SelectLabel>
                                                        {ollamaModels.map((model) => (
                                                            <SelectItem key={model.id} value={model.id}>
                                                                {model.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                )}
                                                {openrouterModels.length > 0 && (
                                                    <SelectGroup>
                                                        <SelectLabel>OpenRouter</SelectLabel>
                                                        {openrouterModels.map((model) => (
                                                            <SelectItem key={model.id} value={model.id}>
                                                                {model.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                )}
                                            </>
                                        );
                                    })()}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Current Model Card */}
                        {selectedModel &&
                            models.find((m) => m.id === selectedModel) &&
                            (() => {
                                const model = models.find((m) => m.id === selectedModel);
                                if (!model) return null;
                                const isOpenRouter = model.id.startsWith("openrouter.");
                                const dotIndex = model.id.indexOf(".");
                                const modelId = dotIndex !== -1 ? model.id.substring(dotIndex + 1) : model.id;
                                const isFree = model.pricing.type === "free";

                                return (
                                    <div>
                                        <span className="text-xs leading-none font-medium select-none">Selected:</span>
                                        <div className="border rounded-lg p-3 bg-muted/50 space-y-2 mt-1">
                                            <div className="flex gap-3">
                                                <Avatar className="h-10 w-10 flex-shrink-0">
                                                    <AvatarImage src={model.imageUrl.toString()} alt={model.name} />
                                                    <AvatarFallback>
                                                        {model.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{model.name}</div>
                                                    <a
                                                        href={
                                                            isOpenRouter
                                                                ? `https://openrouter.ai/${modelId}`
                                                                : `https://ollama.com/library/${modelId}`
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-muted-foreground hover:underline font-mono"
                                                    >
                                                        {modelId}
                                                    </a>
                                                </div>

                                                <div className="flex-shrink-0">
                                                    {isFree ? (
                                                        <Badge variant="outline" className="text-xs">
                                                            {isOpenRouter ? "Free" : "Local"}
                                                        </Badge>
                                                    ) : model.pricing.type === "paid" ? (
                                                        <div className="text-xs text-muted-foreground text-right space-y-0.5">
                                                            <div>
                                                                <span className="text-foreground">In:</span>{" "}
                                                                {formatTokensPerCent(model.pricing.prompt)}
                                                            </div>
                                                            <div>
                                                                <span className="text-foreground">Out:</span>{" "}
                                                                {formatTokensPerCent(model.pricing.completion)}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                        <Button
                            onClick={handleSaveSettings}
                            className="w-full"
                            disabled={isLoadingSettings || isSavingSettings}
                        >
                            {isSavingSettings ? "Saving..." : "Save Settings"}
                        </Button>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onLogout}
                        disabled={isLoading || isSavingSettings}
                    >
                        Logout
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
