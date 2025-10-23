import type { ModerationCategory } from '@/types/analysis';

/**
 * formatModerationData - Formats moderation categories for chart display
 * 
 * Features:
 * - Filters low-confidence categories
 * - Sorts by confidence descending
 * - Scales values for better visualization
 * - Handles empty data gracefully
 * 
 * @param categories - Array of moderation categories
 * @param confidenceThreshold - Minimum confidence to include (default: 0.01 = 1%)
 * @param scalingFactor - Factor to scale confidence values (default: 100 for percentage)
 * @returns Formatted data and labels for chart rendering
 */
export function formatModerationData(
    categories: ModerationCategory[],
    confidenceThreshold: number = 0.01,
    scalingFactor: number = 100
): { data: number[]; labels: string[] } {
    // Validate input
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
        return {
            data: [],
            labels: []
        };
    }

    // Filter and sort categories
    const significantCategories = categories
        .filter(cat =>
            cat &&
            typeof cat.confidence === 'number' &&
            cat.confidence > confidenceThreshold
        )
        .sort((a, b) => b.confidence - a.confidence);

    // Handle no significant data
    if (significantCategories.length === 0) {
        return {
            data: [],
            labels: []
        };
    }

    // Scale confidence values and format labels
    return {
        data: significantCategories.map(cat =>
            Number((cat.confidence * scalingFactor).toFixed(2))
        ),
        labels: significantCategories.map(cat =>
            cat.name || 'Unknown'
        )
    };
}

/**
 * Helper to calculate average confidence
 */
export function calculateAverageConfidence(categories: ModerationCategory[]): number {
    if (!categories || categories.length === 0) return 0;

    const sum = categories.reduce((acc, cat) => acc + (cat.confidence || 0), 0);
    return sum / categories.length;
}

/**
 * Helper to get highest confidence category
 */
export function getHighestConfidenceCategory(
    categories: ModerationCategory[]
): ModerationCategory | null {
    if (!categories || categories.length === 0) return null;

    return categories.reduce((highest, current) =>
        (current.confidence > highest.confidence) ? current : highest
    );
}