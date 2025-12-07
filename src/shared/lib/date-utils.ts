/**
 * Calculate the age of a model and return a human-readable string.
 * @param createdAt The creation date of the model
 * @returns A string like "2 days old", "3 months old", "1 year old", or null if no date
 */
export function formatModelAge(createdAt: Date | string | undefined): string | null {
    if (!createdAt) {
        return null;
    }

    const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return null; // Future date, shouldn't happen
    }

    if (diffDays === 0) {
        return "Today";
    }

    if (diffDays === 1) {
        return "1 day old";
    }

    if (diffDays < 30) {
        return `${diffDays} days old`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) {
        return "1 month old";
    }

    if (diffMonths < 12) {
        return `${diffMonths} months old`;
    }

    const diffYears = Math.floor(diffMonths / 12);
    if (diffYears === 1) {
        return "1 year old";
    }

    return `${diffYears} years old`;
}
