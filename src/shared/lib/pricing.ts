/**
 * Format a price per token (in dollars) to tokens per cent (K/M/B units).
 * Examples:
 * - $0.000001 per token → "1M" tokens per cent
 * - $0.00002 per token → "50K" tokens per cent
 * - Free (0) → "Free"
 */
export function formatTokensPerCent(price: number): string {
    if (price === 0) return "Free";

    const tokensPerCent = 1 / price / 100;

    const units = [
        { threshold: 1_000_000_000, unit: "B" },
        { threshold: 1_000_000, unit: "M" },
        { threshold: 1_000, unit: "K" },
    ];

    for (const { threshold, unit } of units) {
        if (tokensPerCent >= threshold) {
            const value = (tokensPerCent / threshold).toFixed(1);
            const formatted = value.endsWith(".0") ? value.slice(0, -2) : value;
            return `${formatted}${unit}`;
        }
    }

    const value = tokensPerCent.toFixed(1);
    const formatted = value.endsWith(".0") ? value.slice(0, -2) : value;
    return `${formatted}`;
}
