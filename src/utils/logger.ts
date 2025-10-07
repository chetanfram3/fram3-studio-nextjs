/**
 * Logger utility for consistent logging across the application
 * Only logs debug messages in development mode
 */

const isDev = process.env.NODE_ENV === 'development';

const logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  },
  
  /**
   * Info level logging - always shown
   */
  info: (...args: any[]) => {
    console.log('[INFO]', new Date().toISOString(), ...args);
  },
  
  /**
   * Warning level logging - always shown
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', new Date().toISOString(), ...args);
  },
  
  /**
   * Error level logging - always shown
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', new Date().toISOString(), ...args);
  },
};

export default logger;