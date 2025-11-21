import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useUpdateButton } from "../contexts/UpdateButtonContext";
import { useModels } from "../hooks/useModels";
import { useOpenRouterCredits } from "../hooks/useOpenRouterCredits";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from "../components/ui/sidebar";
import { Button } from "../components/ui/button";
import { Moon, Sun, Settings, Router, Laptop, Menu, CheckCircle, Loader } from "lucide-react";
import SettingsModal from "../components/SettingsModal";
import { useState } from "react";
import { Separator } from "@/app/components/ui/separator.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { Badge } from "../components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";
import icon from "../favicon.svg";

function MobileMenuButton() {
    const { toggleSidebar } = useSidebar();
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden text-white hover:bg-purple-600"
        >
            <Menu className="h-4 w-4" />
        </Button>
    );
}

export default function MainLayout() {
    const { logout } = useAuth();
    const { isDark, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { state: updateButtonState } = useUpdateButton();
    const { models: openRouterModels } = useModels("openrouter");
    const { models: ollamaModels } = useModels("ollama");
    const { data: openRouterCredits } = useOpenRouterCredits();

    const openRouterEnabledCount = openRouterModels.filter((m) => m.allowed).length;
    const ollamaEnabledCount = ollamaModels.filter((m) => m.allowed).length;

    const getBreadcrumbLabel = () => {
        switch (location.pathname) {
            case "/from-openrouter":
                return "OpenRouter Models";
            case "/from-ollama":
                return "Ollama Models";
            default:
                return null;
        }
    };

    const breadcrumbLabel = getBreadcrumbLabel();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="bg-gradient-to-r from-purple-400 to-purple-700 text-white p-4">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            type="button"
                            className="flex-1 flex gap-2 items-center text-left cursor-pointer"
                            onClick={() => navigate("/")}
                        >
                            <img src={icon} alt="LLManager Logo" className="h-8 w-8" />
                            <div className="flex-1">
                                <h1 className="text-lg md:text-xl font-bold">LLManager</h1>
                                <p className="text-xs md:text-sm text-purple-100">for Open WebUI</p>
                            </div>
                        </button>
                        <div className="flex gap-2">
                            <MobileMenuButton />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(isDark ? "light" : "dark")}
                                className="text-white hover:bg-purple-600"
                            >
                                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sm px-4">Models</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-2">
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        className="cursor-pointer px-3 py-4.5"
                                        variant={location.pathname === "/from-openrouter" ? "outline" : "default"}
                                        onClick={() => navigate("/from-openrouter")}
                                    >
                                        <Router />
                                        <span>From OpenRouter</span>
                                    </SidebarMenuButton>
                                    <SidebarMenuBadge className="px-2">{openRouterEnabledCount}</SidebarMenuBadge>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        className="cursor-pointer px-3 py-4.5"
                                        variant={location.pathname === "/from-ollama" ? "outline" : "default"}
                                        onClick={() => navigate("/from-ollama")}
                                    >
                                        <Laptop />
                                        <span>From Ollama</span>
                                    </SidebarMenuButton>
                                    <SidebarMenuBadge className="px-2">{ollamaEnabledCount}</SidebarMenuBadge>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <Button variant="outline" className="w-full" onClick={() => setSettingsOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>

            <SidebarInset>
                <header className="z-1 bg-background sticky top-0 flex shrink-0 items-center justify-between gap-2 border-b p-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="#" asChild>
                                        <Link to={"/"}>Home</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {breadcrumbLabel && (
                                    <>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </>
                                )}
                            </BreadcrumbList>
                        </Breadcrumb>

                        {openRouterCredits && location.pathname === "/from-openrouter" && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href="https://openrouter.ai/settings/credits" target="_blank" rel="noopener noreferrer">
                                        <Badge variant="secondary" className="cursor-help">
                                            ${(openRouterCredits.credits - openRouterCredits.usage).toFixed(2)} remaining
                                        </Badge>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="w-fit max-w-xs">
                                    <div className="space-y-1 text-xs">
                                        <div className="font-semibold">OpenRouter Credits</div>
                                        <div>${openRouterCredits.credits.toFixed(2)} (added)</div>
                                        <div className="text-muted-foreground">${openRouterCredits.usage.toFixed(2)} (spent)</div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    {updateButtonState?.hasPendingChanges && (
                        <Button
                            onClick={updateButtonState.onUpdate}
                            disabled={updateButtonState.isLoading}
                            size="sm"
                            className="-my-0.5 gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {updateButtonState.isLoading ? (
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
                    )}
                </header>
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </SidebarInset>

            <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} onLogout={handleLogout} />
        </SidebarProvider>
    );
}
