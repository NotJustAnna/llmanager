import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Router, Zap } from "lucide-react";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
            <div className="text-center space-y-4 max-w-2xl">
                <h1 className="text-5xl font-bold">
                    Welcome to{" "}
                    <span className="bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
                        LLManager
                    </span>
                </h1>
                <p className="text-lg text-muted-foreground">Manage your Open WebUi connections in one place.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
                <Card
                    className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/from-openrouter")}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">OpenRouter Models</h2>
                            <p className="text-sm text-muted-foreground">Manage OpenRouter models</p>
                        </div>
                    </div>
                    <Button className="w-full" onClick={() => navigate("/from-openrouter")}>
                        Browse Models
                    </Button>
                </Card>

                <Card
                    className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/from-ollama")}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                            <Router className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">Ollama Models</h2>
                            <p className="text-sm text-muted-foreground">Manage Ollama models</p>
                        </div>
                    </div>
                    <Button className="w-full" onClick={() => navigate("/from-ollama")}>
                        Browse Models
                    </Button>
                </Card>
            </div>
        </div>
    );
}
