import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "../components/ui/empty";
import { LockKeyhole } from "lucide-react";
import icon from "../favicon.svg";

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
        } catch (_) {
            toast.error("Invalid password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30">
            <Card className="w-full max-w-md overflow-hidden shadow-lg pt-0">
                <div className="bg-gradient-to-r from-purple-400 to-purple-700 text-white p-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <img src={icon} alt="LLManager Logo" className="h-12 w-12" />
                        <div>
                            <h1 className="text-3xl font-bold">LLManager</h1>
                            <p className="text-sm text-purple-100">for Open WebUI</p>
                        </div>
                    </div>
                </div>

                <Empty className="border-0 p-8">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <LockKeyhole className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>Welcome Back</EmptyTitle>
                        <EmptyDescription>
                            Enter your password to access the dashboard
                        </EmptyDescription>
                    </EmptyHeader>

                    <EmptyContent>
                        <form onSubmit={handleSubmit} className="w-full space-y-4">
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="w-full"
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !password}
                                className="w-full bg-gradient-to-r from-purple-400 to-purple-700 hover:from-purple-500 hover:to-purple-800"
                            >
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                    </EmptyContent>
                </Empty>
            </Card>
        </div>
    );
}
