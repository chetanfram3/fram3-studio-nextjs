import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type Stage = {
    id: number;
    name: string;
    progress: number;
    completed: boolean;
    analyses: Record<string, TaskAnalysis>;
    status: number;
};

export interface ResumeTaskResponse {
    success: boolean;
    message: string;
    taskId: string;
    jobId: string;
    resumeResult: {
        status: string;
        jobId: string;
        promotedAt: string;
        queueName: string;
        message: string;
    };
    resumedAt: string;
}

export interface TaskAnalysis {
    status: number;
    retryCount: number;
    shotCount: number;
    completedShots: number;
    scenes: Record<string, unknown>;
    dependencies: string[];
    shotsPerScene?: Array<{ sceneId: number; totalShots: number }>;
    totalScenes?: number;
}

export interface TaskStage {
    id: number;
    name: string;
    progress: number;
    completed: boolean;
    analyses: Record<string, TaskAnalysis>;
}

export interface QueuePosition {
    position: number | null;
    total: number | null;
    state?: string;
    activeJobs?: number;
    estimatedWait?: number;
    estimatedWaitFormatted?: string;
    error?: string;
}

export interface TaskError {
    message?: string;
    timestamp?: unknown; // Firebase timestamp
    pausedAnalyses?: string[];
    pausedAt?: unknown; // Firebase timestamp  
    reason?: string;
    details?: string;
    stack?: string;
    type?: string;
    // Allow for additional error properties
    [key: string]: unknown;
}

export interface Task {
    id: string;
    userId: string;
    scriptId: string;
    versionId: string;
    priority: number;
    type: string;
    jobId?: string;
    status: 'pending' | 'active' | 'completed' | 'failed' | 'paused';
    progress: number;
    error?: TaskError | string;
    createdAt: unknown;
    startedAt?: unknown;
    completedAt?: unknown;
    updatedAt?: unknown;
    attempts: number;
    stages?: Record<string, Stage>;
    queueInfo?: QueuePosition;
    pausedAnalyses?: string[];
    pausedAt?: string;
    reason?: string;
}

export interface JobStatus {
    id: string;
    state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
    progress: number;
    data: unknown;
    attempts: number;
    timestamp: string;
    position?: number;
}

export interface TaskResponse {
    task: Task;
    jobStatus?: {
        id: string;
        state: string;
        progress: number;
        data: unknown;
        attempts: number;
        timestamp: number;
    } | null;
}

export interface UserTasksResponse {
    tasks: Task[];
}

export interface QueueStats {
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    waiting: number;
    status?: string;
    redisConnected?: boolean;
    error?: string;
}

export interface APIErrorData {
    error: string;
    description?: string;
    code?: string;
}

export interface QueueInfo {
    queueName: string;
    stats: QueueStats;
    estimatedWait: {
        averageJobTime: number;
        milliseconds: number;
        formatted: string;
    };
    userTasksInQueue: Array<{
        taskId: string;
        jobId: string;
        scriptId: string;
        versionId: string;
        status: string;
        createdAt: unknown;
        queueInfo: QueuePosition;
    }>;
}

export interface TaskProgressInfo {
    isComplete: boolean;
    isFailed: boolean;
    isActive: boolean;
    isPending: boolean;
    isPaused: boolean;
    progress: number;
    canRetry: boolean;
    canResume: boolean;
    pausedAnalyses?: string[];
    stages: Record<string, Stage> | Record<string, never>;
    currentStage?: Stage;  // Now using the explicit Stage type
    error?: string;
    attempts: number;
    isLoading: boolean;
    isError: boolean;
    queryError: Error | null;
    task?: Task;
    queueInfo?: QueuePosition;
}

export interface StageProgressInfo {
    totalStages: number;
    completedStages: number;
    currentStageNumber: number;
    progress: number;
}

export class TaskAPIError extends Error {
    public response: {
        status: number;
        statusText: string;
        data: unknown;
    };

    constructor(message: string, response: Response, data: unknown) {
        super(message);
        this.name = 'TaskAPIError';
        this.response = {
            status: response.status,
            statusText: response.statusText,
            data: data
        };
    }
}

async function getAuthToken(): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
        throw new Error('Authentication required');
    }
    return token;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData: APIErrorData = await response.json();

        // 🔥 CRITICAL FIX: Throw enhanced error with response data
        throw new TaskAPIError(
            errorData.error || errorData.description || 'API request failed',
            response,
            errorData
        );
    }
    return response.json();
}

export async function findTask(userId: string, scriptId: string, versionId: string): Promise<TaskResponse> {
    const token = await getAuthToken();

    const response = await fetch(
        `${API_BASE_URL}/tasks/find?userId=${userId}&scriptId=${scriptId}&versionId=${versionId}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    return handleResponse<TaskResponse>(response);
}

export async function getTaskStatus(taskId: string): Promise<TaskResponse> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return handleResponse<TaskResponse>(response);
}

export async function getUserTasks(
    userId: string,
    limit: number = 10,
    status?: 'pending' | 'active' | 'completed' | 'failed'
): Promise<UserTasksResponse> {
    const token = await getAuthToken();

    const url = new URL(`${API_BASE_URL}/tasks/user/${userId}`);
    url.searchParams.append('limit', limit.toString());
    if (status) {
        url.searchParams.append('status', status);
    }

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return handleResponse<UserTasksResponse>(response);
}

export async function retryTask(taskId: string): Promise<{ message: string }> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/retry`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return handleResponse<{ message: string }>(response);
}

export async function resumeTask(taskId: string): Promise<ResumeTaskResponse> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/resume`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    return handleResponse<ResumeTaskResponse>(response);
}

export async function deleteTask(taskId: string): Promise<{ message: string }> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return handleResponse<{ message: string }>(response);
}

export async function getQueueStats(): Promise<{ stats: QueueStats }> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/tasks/queue/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return handleResponse<{ stats: QueueStats }>(response);
}

export async function getQueueInfo(queueName?: string): Promise<QueueInfo> {
    const url = `/tasks/queue/info${queueName ? `?queueName=${queueName}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get queue information');
    }

    return response.json();
}

// Helper function to safely extract pausedAnalyses from task
export function getPausedAnalyses(task: Task): string[] {
    // Check if error is an object and has pausedAnalyses
    if (task.error && typeof task.error === 'object' && task.error.pausedAnalyses) {
        return task.error.pausedAnalyses;
    }

    // Fallback to direct pausedAnalyses property
    return task.pausedAnalyses || [];
}

// Helper function to safely extract paused reason
export function getPausedReason(task: Task): string {
    if (task.error && typeof task.error === 'object' && task.error.reason) {
        return task.error.reason;
    }

    return task.reason || "Task paused due to pauseBefore conditions";
}

// Helper function to safely extract error message
export function getErrorMessage(task: Task): string | null {
    if (!task.error) return null;

    if (typeof task.error === 'string') {
        return task.error;
    }

    if (typeof task.error === 'object') {
        return task.error.message || 'An error occurred';
    }

    return null;
}