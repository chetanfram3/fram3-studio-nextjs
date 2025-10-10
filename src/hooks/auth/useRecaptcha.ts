'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  loadRecaptchaScript, 
  executeRecaptcha as executeRecaptchaService,
  isRecaptchaEnabled,
  getRecaptchaSiteKey,
} from '@/services/auth/reCaptchaService';
import logger from '@/utils/logger';

interface UseRecaptchaReturn {
  token: string;
  isLoading: boolean;
  error: string | null;
  execute: () => Promise<string>;
  reset: () => void;
}

/**
 * Custom hook for reCAPTCHA v3 integration
 * Automatically loads script and executes reCAPTCHA
 */
export function useRecaptcha(
  action: string,
  executeOnMount = true
): UseRecaptchaReturn {
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Execute reCAPTCHA and get token
   */
  const execute = useCallback(async (): Promise<string> => {
    if (!isRecaptchaEnabled()) {
      logger.warn('reCAPTCHA is not enabled');
      setIsLoading(false);
      return '';
    }

    try {
      setIsLoading(true);
      setError(null);
      
      logger.debug('Executing reCAPTCHA for action:', action);
      
      const newToken = await executeRecaptchaService(action);
      
      setToken(newToken);
      setIsLoading(false);
      
      logger.debug('reCAPTCHA token generated successfully');
      
      return newToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute reCAPTCHA';
      logger.error('reCAPTCHA execution error:', err);
      setError(errorMessage);
      setIsLoading(false);
      return '';
    }
  }, [action]);

  /**
   * Reset reCAPTCHA state
   */
  const reset = useCallback(() => {
    setToken('');
    setError(null);
    setIsLoading(false);
  }, []);

  /**
   * Load script and execute on mount if enabled
   */
  useEffect(() => {
    if (!isRecaptchaEnabled()) {
      logger.debug('reCAPTCHA is disabled');
      setIsLoading(false);
      return;
    }

    if (executeOnMount) {
      execute();
    } else {
      setIsLoading(false);
    }
  }, [execute, executeOnMount]);

  return {
    token,
    isLoading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook for manual reCAPTCHA execution
 * Does not execute on mount
 */
export function useRecaptchaManual(action: string): UseRecaptchaReturn {
  return useRecaptcha(action, false);
}

/**
 * Hook to check if reCAPTCHA is available
 */
export function useRecaptchaAvailable(): {
  isAvailable: boolean;
  siteKey: string | null;
} {
  const [isAvailable, setIsAvailable] = useState(false);
  const [siteKey, setSiteKey] = useState<string | null>(null);

  useEffect(() => {
    const available = isRecaptchaEnabled();
    setIsAvailable(available);
    
    if (available) {
      try {
        setSiteKey(getRecaptchaSiteKey());
      } catch {
        setSiteKey(null);
      }
    }
  }, []);

  return {
    isAvailable,
    siteKey,
  };
}

/**
 * Hook to preload reCAPTCHA script
 * Useful for pages that will need reCAPTCHA later
 */
export function useRecaptchaPreload() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRecaptchaEnabled()) {
      return;
    }

    loadRecaptchaScript()
      .then(() => {
        logger.debug('reCAPTCHA script preloaded');
        setLoaded(true);
      })
      .catch((err) => {
        logger.error('Failed to preload reCAPTCHA script:', err);
        setError(err instanceof Error ? err.message : 'Failed to load reCAPTCHA');
      });
  }, []);

  return {
    loaded,
    error,
  };
}