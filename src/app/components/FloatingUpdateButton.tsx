import { Button } from "./ui/button";
import { CheckCircle, Loader } from "lucide-react";

interface FloatingUpdateButtonProps {
    hasPendingChanges: boolean;
    isLoading?: boolean;
    onUpdate: () => void;
}

export function FloatingUpdateButton({ hasPendingChanges, isLoading = false, onUpdate }: FloatingUpdateButtonProps) {
    if (!hasPendingChanges) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-40">
            <Button
                onClick={onUpdate}
                disabled={isLoading}
                className="gap-2 shadow-lg bg-green-600 hover:bg-green-700 text-white"
            >
                {isLoading ? (
                    <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <CheckCircle className="h-4 w-4" />
                        Update Changes
                    </>
                )}
            </Button>
        </div>
    );
}
