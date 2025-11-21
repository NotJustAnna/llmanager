import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import type { ChangePasswordReq } from "@/shared/schema/auth.controller";
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
    const { accessToken } = useAuth();

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

                    <DialogFooter className="flex gap-2">
                        <Button type="button" variant="destructive" onClick={onLogout} disabled={isLoading}>
                            Logout
                        </Button>
                        <Button type="submit" disabled={isLoading || !currentPassword || !newPassword}>
                            {isLoading ? "Changing..." : "Change Password"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
