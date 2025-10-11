'use client';

import logger from '@/utils/logger';
import { useEffect, useState, useRef, useCallback } from "react";
import socket from "@/services/socketService";

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Options for socket connection
 */
interface UseSocketOptions {
  shouldConnect: boolean;
  userId?: string;
  scriptId?: string;
  versionId?: string;
}

/**
 * Progress update data
 */
interface ProgressUpdate {
  overallProgress: number;
  stages: StageProgress[];
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Stage progress information
 */
interface StageProgress {
  name: string;
  status: string;
  progress: number;
  [key: string]: unknown;
}

/**
 * Status update data
 */
interface StatusUpdate {
  analysisType: string;
  status: string;
  progress?: number;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Scene update data
 */
interface SceneUpdate {
  analysisType: string;
  sceneId: number | string;
  shotId?: number | string;
  status: string;
  progress?: number;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Function update data
 */
interface FunctionUpdate {
  functionName: string;
  status: string;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Pipeline snapshot data
 */
interface PipelineSnapshot {
  userId: string;
  scriptId: string;
  versionId: string;
  overallProgress: number;
  stages: StageProgress[];
  analyses?: Record<string, unknown>;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Connection status data
 */
interface ConnectionStatus {
  connected: boolean;
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * Room data for socket events
 */
interface RoomData {
  userId: string;
  scriptId?: string;
  versionId?: string;
}

/**
 * Hook return type
 */
interface UseSocketReturn {
  progressUpdates: ProgressUpdate[];
  statusUpdates: StatusUpdate[];
  sceneUpdates: SceneUpdate[];
  functionUpdates: FunctionUpdate[];
  pipelineSnapshot: PipelineSnapshot | null;
  connectionStatus: ConnectionStatus | null;
  requestStatusRefresh: () => boolean;
  rejoinAndRefresh: () => void;
}

// ===========================
// MAIN HOOK
// ===========================

/**
 * Custom hook for managing Socket.IO connection and real-time updates
 * Handles pipeline progress, status updates, and connection management
 * 
 * @param options - Socket connection options
 * @returns Socket state and control functions
 * 
 * @example
 * ```tsx
 * const {
 *   progressUpdates,
 *   pipelineSnapshot,
 *   requestStatusRefresh
 * } = useSocket({
 *   shouldConnect: true,
 *   userId: 'user-123',
 *   scriptId: 'script-456',
 *   versionId: 'version-789'
 * });
 * ```
 */
export function useSocket({
  shouldConnect,
  userId,
  scriptId,
  versionId
}: UseSocketOptions): UseSocketReturn {
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [sceneUpdates, setSceneUpdates] = useState<SceneUpdate[]>([]);
  const [functionUpdates, setFunctionUpdates] = useState<FunctionUpdate[]>([]);
  const [pipelineSnapshot, setPipelineSnapshot] = useState<PipelineSnapshot | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);

  const lastHeartbeatRef = useRef<number>(0);
  const lastEventReceivedRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstConnectionRef = useRef<boolean>(true);

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  /**
   * Track event reception time
   */
  const updateLastEventTime = useCallback(() => {
    lastEventReceivedRef.current = Date.now();
  }, []);

  /**
   * Request a status refresh from the server
   */
  const requestStatusRefresh = useCallback(() => {
    if (socket.connected && userId && scriptId && versionId) {
      logger.debug("Requesting status refresh from server");
      socket.emit("requestStatusRefresh", { userId, scriptId, versionId });
      return true;
    }
    logger.warn("Cannot request status refresh - socket not connected or missing parameters");
    return false;
  }, [userId, scriptId, versionId]);

  /**
   * Rejoin room and request latest status
   */
  const rejoinAndRefresh = useCallback(() => {
    if (userId) {
      const roomData: RoomData = scriptId && versionId
        ? { userId, scriptId, versionId }
        : { userId };

      logger.info("Rejoining room and requesting status refresh");
      socket.emit("initialize", { userId });
      socket.emit("joinRoom", roomData);

      if (scriptId && versionId) {
        // Wait a short time to ensure the server has processed the join room event
        setTimeout(() => {
          requestStatusRefresh();
        }, 500);
      }
    }
  }, [userId, scriptId, versionId, requestStatusRefresh]);

  // ===========================
  // SOCKET CONNECTION EFFECT
  // ===========================

  useEffect(() => {
    if (shouldConnect && userId) {
      // Connect the socket if not already connected
      if (!socket.connected) {
        socket.connect();
        logger.debug("Socket.IO connected");
      }

      // Initialize with the server
      socket.emit("initialize", { userId });

      // Determine the room to join
      const roomData: RoomData = scriptId && versionId
        ? { userId, scriptId, versionId }
        : { userId };

      // Join the appropriate room
      socket.emit("joinRoom", roomData);

      // Request status immediately after joining
      if (scriptId && versionId && isFirstConnectionRef.current) {
        setTimeout(() => {
          requestStatusRefresh();
          isFirstConnectionRef.current = false;
        }, 1000);
      }

      // ===========================
      // SOCKET EVENT LISTENERS
      // ===========================

      /**
       * Listen for connection status updates
       */
      socket.on("connectionStatus", (data: ConnectionStatus) => {
        logger.debug("Connection status received:", data);
        setConnectionStatus(data);
        updateLastEventTime();
      });

      /**
       * Listen for errors
       */
      socket.on("error", (error: Error) => {
        logger.error("Socket error:", error);
      });

      /**
       * Listen for no data available message
       */
      socket.on("noDataAvailable", (data: unknown) => {
        logger.warn("No data available:", data);
        updateLastEventTime();
      });

      // Attach event listeners for script-specific updates
      if (scriptId && versionId) {
        /**
         * Listen for complete pipeline snapshot
         */
        socket.on("pipelineSnapshot", (data: PipelineSnapshot) => {
          logger.debug("Pipeline snapshot received:", data);
          if (data) {
            setPipelineSnapshot(data);
            // Reset the updates arrays when we get a new snapshot
            setProgressUpdates([]);
            setStatusUpdates([]);
            setSceneUpdates([]);
            updateLastEventTime();
          }
        });

        /**
         * Listen for heartbeat to maintain connection status
         */
        socket.on("pipelineHeartbeat", (data: Partial<PipelineSnapshot>) => {
          logger.debug("Pipeline heartbeat received:", data);
          lastHeartbeatRef.current = Date.now();
          // Update snapshot with latest data
          setPipelineSnapshot((prev) => prev ? { ...prev, ...data } : null);
          updateLastEventTime();
        });

        /**
         * Listen for progress updates
         */
        socket.on("progressUpdate", (data: ProgressUpdate) => {
          if (data) {
            setProgressUpdates((prev) => {
              // Filter out older updates with the same content
              const hasDuplicate = prev.some(update =>
                update.overallProgress === data.overallProgress &&
                JSON.stringify(update.stages) === JSON.stringify(data.stages)
              );

              updateLastEventTime();
              return hasDuplicate ? prev : [...prev, data];
            });
          }
        });

        /**
         * Listen for individual analysis updates
         */
        socket.on("statusUpdate", (data: StatusUpdate) => {
          if (data) {
            setStatusUpdates((prev) => {
              // Check if we already have an update for this analysis that's newer or the same
              const existingIndex = prev.findIndex(update =>
                update.analysisType === data.analysisType &&
                update.timestamp >= data.timestamp
              );

              updateLastEventTime();

              if (existingIndex >= 0) {
                // Replace the existing update if this one is newer
                const newUpdates = [...prev];
                newUpdates[existingIndex] = data;
                return newUpdates;
              }

              return [...prev, data];
            });
          }
        });

        /**
         * Listen for individual analysis scene updates
         */
        socket.on("sceneUpdate", (data: SceneUpdate) => {
          logger.debug("Scene update received:", data);
          if (data) {
            setSceneUpdates((prev) => {
              // Check for duplicate or superseded updates based on timestamp and data identifiers
              const existingIndex = prev.findIndex(update =>
                update.analysisType === data.analysisType &&
                update.sceneId === data.sceneId &&
                update.shotId === data.shotId &&
                update.timestamp >= data.timestamp
              );

              updateLastEventTime();

              if (existingIndex >= 0) {
                // Replace the existing update if this one is newer
                const newUpdates = [...prev];
                newUpdates[existingIndex] = data;
                return newUpdates;
              }

              return [...prev, data];
            });
          }
        });

        /**
         * Handle pipeline completion
         */
        socket.on("pipelineComplete", (data: Partial<PipelineSnapshot>) => {
          logger.info("Pipeline completed:", data);
          // Update the snapshot with completion data
          setPipelineSnapshot((prev) => prev ? { ...prev, ...data } : null);
          updateLastEventTime();
        });
      } else {
        /**
         * Listen for function updates when only userId is provided
         */
        socket.on("functionUpdate", (data: FunctionUpdate) => {
          if (data) {
            setFunctionUpdates((prev) => [...prev, data]);
            updateLastEventTime();
          }
        });
      }

      // ===========================
      // CONNECTION MONITORING
      // ===========================

      /**
       * Monitor connection and event status
       */
      const monitorInterval = setInterval(() => {
        const now = Date.now();

        // Check time since last heartbeat
        if (lastHeartbeatRef.current > 0) {
          const timeSinceLastHeartbeat = now - lastHeartbeatRef.current;
          // If more than 2 minutes since last heartbeat, connection may be stale
          if (timeSinceLastHeartbeat > 120000) {
            logger.warn("No recent heartbeat, connection may be stale");
            setConnectionStatus(prev => ({
              ...prev,
              connected: false,
              timestamp: now
            }));
          }
        }

        // Check time since last event of any type
        if (lastEventReceivedRef.current > 0) {
          const timeSinceLastEvent = now - lastEventReceivedRef.current;
          // If no events in 3 minutes, try to refresh
          if (timeSinceLastEvent > 180000) {
            logger.warn("No events received for 3 minutes, requesting refresh");
            requestStatusRefresh();
          }

          // If no events in 5 minutes, try to reconnect
          if (timeSinceLastEvent > 300000 && reconnectTimeoutRef.current === null) {
            logger.warn("No events received for 5 minutes, attempting reconnection");
            reconnectTimeoutRef.current = setTimeout(() => {
              logger.info("Attempting to reconnect socket");
              socket.disconnect();
              socket.connect();
              rejoinAndRefresh();
              reconnectTimeoutRef.current = null;
            }, 5000); // Wait 5 seconds before reconnecting
          }
        }
      }, 30000); // Check every 30 seconds

      // ===========================
      // CLEANUP FUNCTION
      // ===========================

      return () => {
        clearInterval(monitorInterval);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        socket.emit("leaveRoom", roomData);
        logger.debug(`Socket.IO left room:`, roomData);

        if (scriptId && versionId) {
          socket.off("pipelineSnapshot");
          socket.off("pipelineHeartbeat");
          socket.off("progressUpdate");
          socket.off("statusUpdate");
          socket.off("sceneUpdate");
          socket.off("pipelineComplete");
          socket.off("noDataAvailable");
        } else {
          socket.off("functionUpdate");
        }

        socket.off("connectionStatus");
        socket.off("error");

        socket.disconnect();
        logger.debug("Socket.IO disconnected");
      };
    }
  }, [shouldConnect, userId, scriptId, versionId, requestStatusRefresh, rejoinAndRefresh, updateLastEventTime]);

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    progressUpdates,
    statusUpdates,
    sceneUpdates,
    functionUpdates,
    pipelineSnapshot,
    connectionStatus,
    requestStatusRefresh,
    rejoinAndRefresh
  };
}

// ===========================
// EXPORT TYPES
// ===========================

export type {
  UseSocketOptions,
  ProgressUpdate,
  StageProgress,
  StatusUpdate,
  SceneUpdate,
  FunctionUpdate,
  PipelineSnapshot,
  ConnectionStatus,
  RoomData,
  UseSocketReturn
};