// src/services/pipelineService.ts

import { auth } from '@/lib/firebase';
import logger from '@/utils/logger';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface PipelineConfig {
  stages: Record<string, {
    id: number;
    name: string;
    types: string[];
    description: string;
    detailedInfo: string;
  }>;
  processingTypes: Record<string, string>;
  subscription?: string;
}

export interface TaskInfo {
  taskId: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number;
  subscription: string | null;
  createdAt: string;
  completedAt?: string;
  stages: unknown[];
  jobStatus: unknown | null;
}

export interface PipelineStatus {
  taskInfo: TaskInfo | null;
  currentSubscription: string | null;
  subscriptionChanged: boolean;
  message: string;
}

export async function fetchPipelineConfiguration(subscription?: string): Promise<PipelineConfig> {
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  const url = subscription 
    ? `${API_BASE_URL}/scripts/pipeline-configuration?subscription=${subscription}`
    : `${API_BASE_URL}/scripts/pipeline-configuration`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch pipeline configuration');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Pipeline configuration fetch failed:', error);
    throw error;
  }
}

export async function fetchPipelineStatus(scriptId: string, versionId: string): Promise<PipelineStatus | null> {
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/scripts/pipeline-status?scriptId=${scriptId}&versionId=${versionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch pipeline status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Pipeline status fetch failed:', error);
    throw error;
  }
}

export async function triggerPipeline(scriptId: string, versionId: string): Promise<{ message: string }> {
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/scripts/pipeline-run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ scriptId, versionId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to trigger pipeline');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Pipeline trigger failed:', error);
    throw error;
  }
}