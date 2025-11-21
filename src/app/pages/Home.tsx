import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import {Router, Laptop} from "lucide-react";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center from-muted/50 to-background h-full bg-gradient-to-b from-30% gap-6 px-4">
            <div className="text-center space-y-2 max-w-2xl">
                <h1 className="text-4xl font-bold">
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
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage
                                src="https://cdn.jsdelivr.net/gh/NotJustAnna/extended-lobe-icons@main/packages/icons/openrouter/dark-colorbg-avatarfit.webp"
                                alt="OpenRouter"
                            />
                            <AvatarFallback>
                                <Router />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold text-md">OpenRouter Models</h2>
                            <p className="text-sm text-muted-foreground">Your gateway to the best models available</p>
                        </div>
                    </div>
                </Card>

                <Card
                    className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/from-ollama")}
                >
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage
                                src="https://cdn.jsdelivr.net/gh/NotJustAnna/extended-lobe-icons@main/packages/icons/ollama/light-bg-avatarfit.webp"
                                alt="Ollama"
                            />
                            <AvatarFallback>
                                <Laptop/>
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold text-md">Ollama Models</h2>
                            <p className="text-sm text-muted-foreground">Local models running on your computer</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
