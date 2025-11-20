import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { toast } from "sonner";

export default function Login() {
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(password);
            navigate("/");
            toast.success("Logged in successfully");
        } catch (error) {
            toast.error("Invalid password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-950 dark:to-gray-900">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
                        LLManager
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">for Open WebUI</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !password}
                        className="w-full bg-gradient-to-r from-purple-400 to-purple-700 hover:from-purple-500 hover:to-purple-800"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
