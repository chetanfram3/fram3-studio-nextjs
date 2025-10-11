import { AnalysisType } from '@/config/analysisTypes';

export interface ShotStatus {
  shotNumber: number;
  status: StatusType;
  error: string | null;
}

export interface SceneStatus {
  sceneID: number;
  shots: ShotStatus[];
}

export interface AnalysisTypeStatus {
  status: StatusType;
  data?: SceneStatus[];
}

export type StatusType = 'Completed' | 'Incomplete' | 'Failed' | 'Pending' | 'InProgress' | 'NotStarted';

export interface AnalysisStatusResponse {
  message: string;
  statuses: Record<AnalysisType, AnalysisTypeStatus>;
}