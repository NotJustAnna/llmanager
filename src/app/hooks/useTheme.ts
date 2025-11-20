import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
    const { theme, setTheme, systemTheme } = useNextTheme();
    const currentTheme = theme === "system" ? systemTheme : theme;

    return {
        theme: currentTheme,
        setTheme,
        isDark: currentTheme === "dark",
    };
}
