import { ModerationCategory } from '@/types/analysis';

export function formatModerationData(
    categories: ModerationCategory[],
    confidenceThreshold: number = 0.01, // Dynamic threshold for filtering
    scalingFactor: number = 100 // Scaling factor for better visualization
) {
    // Filter categories dynamically based on the threshold
    const significantCategories = categories
        .filter(cat => cat.confidence > confidenceThreshold)
        .sort((a, b) => b.confidence - a.confidence); // Sort by descending confidence

    // If no significant categories, return placeholders
    if (significantCategories.length === 0) {
        return {
            data: [0],
            labels: ['No significant data']
        };
    }

    // Dynamically scale confidence values for better visualization
    return {
        data: significantCategories.map(cat => cat.confidence * scalingFactor),
        labels: significantCategories.map(cat => cat.name)
    };
}
