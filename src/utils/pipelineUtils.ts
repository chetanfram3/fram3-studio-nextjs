// src/utils/pipelineUtils.ts
export const getStatusColor = (status: number) => {
    switch (status) {
        case 1: // Completed
            return "#22c55e"; // Green
        case 0: // Processing
            return "#eab308"; // Yellow
        case -1: // Failed
            return "#ef4444"; // Red
        default: // Queued
            return "#4b5563"; // Grey
    }
};

export const getStatusText = (status: number) => {
    switch (status) {
        case 1:
            return "Completed";
        case 0:
            return "Processing";
        case -1:
            return "Failed";
        default:
            return "Queued";
    }
};

export const getStatusNumber = (status: string): number => {
    switch (status) {
        case "Completed":
            return 1;
        case "InProgress":
            return 0;
        case "Failed":
            return -1;
        default:
            return -2; // Queued
    }
};

export const calculateStageProgress = (
    stageKey: string,
    analyses: Record<string, { status: number; data?: any[] }>,
    stages: Record<string, any>,
    processingTypes: Record<string, string> = {}
): number => {
    const stage = stages[stageKey];
    if (!stage) return 0;

    let totalTasks = 0;
    let completedTasks = 0;
    let allUnknown = true;

    stage.types.forEach((type: string) => {
        const analysis = analyses[type];
        if (analysis) {
            totalTasks++;
            if (analysis.status === 1) {
                completedTasks++;
            }

            if (analysis.status !== -2) {
                allUnknown = false;
            }

            // Check processing type for special handling
            const processingType = processingTypes[type];
            if (processingType === 'promptGen' || processingType === 'sceneShotProcessor') {
                if (analysis.data) {
                    analysis.data.forEach((item) => {
                        totalTasks++;
                        if (item.status === 1) {
                            completedTasks++;
                        }

                        if (item.shots && Array.isArray(item.shots)) {
                            totalTasks += item.shots.length;
                            completedTasks += item.shots.filter(
                                (shot: { status: number }) => shot.status === 1
                            ).length;
                        }
                    });
                }
            }
        }
    });

    if (allUnknown) return 0;
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
};