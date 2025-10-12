import type { Scene } from "@/types/overview/emotionTypes";

interface TimeCalculationResult {
    timePoints: number[]
    sceneBoundaries: number[]
    sceneEndBoundaries: number[]
}

export function calculateTimePoints(scenes: Scene[]): TimeCalculationResult {
    let currentTime = 0
    const timePoints: number[] = []
    const sceneBoundaries: number[] = [0] // Start with 0 for the first scene
    const sceneEndBoundaries: number[] = []

    if (!scenes || !Array.isArray(scenes)) {
        return { timePoints: [0], sceneBoundaries: [0], sceneEndBoundaries: [0] }
    }

    scenes.forEach((scene) => {
        const sceneDuration = scene.sceneDuration
        const lineCount = scene.lines.length

        // Handle edge cases: no lines or single line
        if (lineCount === 0) {
            currentTime += sceneDuration
        } else if (lineCount === 1) {
            timePoints.push(currentTime)
            currentTime += sceneDuration
        } else {
            // Calculate time points for each line, ensuring even distribution
            for (let i = 0; i < lineCount; i++) {
                const progress = i / (lineCount - 1) // This will give us 0 to 1
                const timePoint = currentTime + progress * sceneDuration
                timePoints.push(Number(timePoint.toFixed(3)))
            }
            currentTime += sceneDuration
        }

        // Add scene boundary after processing all lines in the scene
        sceneBoundaries.push(currentTime)
        sceneEndBoundaries.push(currentTime)
    })

    // Ensure the last time point exactly matches the scene end
    if (timePoints.length > 0 && sceneEndBoundaries.length > 0) {
        timePoints[timePoints.length - 1] = sceneEndBoundaries[sceneEndBoundaries.length - 1]
    }

    return { timePoints, sceneBoundaries, sceneEndBoundaries }
}