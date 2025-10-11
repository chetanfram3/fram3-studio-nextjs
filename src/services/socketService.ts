// socketService.ts
import logger from '@/utils/logger';
import { io, Socket } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_APP_SOCKET_SERVER_URL;

logger.debug("Connecting to Socket.IO server at:", socketUrl);

const socket: Socket = io(socketUrl, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: false, // Don't auto-connect, let components manage it
});

// Global connection state management
let connectionCount = 0;

export const connectSocket = () => {
  connectionCount++;
  if (!socket.connected) {
    logger.debug('🔌 Socket connecting... (connection count:', connectionCount, ')');
    socket.connect();
  }
};

export const disconnectSocket = () => {
  connectionCount--;
  logger.debug('🔌 Socket disconnect requested (connection count:', connectionCount, ')');

  // Only disconnect if no components need the connection
  if (connectionCount <= 0 && socket.connected) {
    logger.debug('🔌 Socket disconnecting - no more consumers');
    socket.disconnect();
    connectionCount = 0; // Reset to prevent negative counts
  }
};

// Add global socket event listeners for debugging
socket.on('connect', () => {
  logger.debug('🌐 Socket.IO: Connected with id:', socket.id);
});

socket.on('disconnect', (reason) => {
  logger.debug('🌐 Socket.IO: Disconnected, reason:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🌐 Socket.IO: Connection error:', error.message);
});

export default socket;