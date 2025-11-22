import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { UpdateButtonProvider } from "./contexts/UpdateButtonContext";
import { ModelProvider } from "./contexts/ModelContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import OpenRouterPage from "./pages/OpenRouterPage";
import OllamaPage from "./pages/OllamaPage";
import MainLayout from "./layouts/MainLayout";
import { Toaster } from "sonner";

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <UpdateButtonProvider>
                    <ModelProvider>
                        <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <MainLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/" element={<Home />} />
                                <Route path="/from-openrouter" element={<OpenRouterPage />} />
                                <Route path="/from-ollama" element={<OllamaPage />} />
                            </Route>
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                        </BrowserRouter>
                        <Toaster />
                    </ModelProvider>
                </UpdateButtonProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
