import { useState, useCallback } from 'react';
import { streamReader, aggregateStreamedData, processAggregatedData } from '@/utils/streamUtils';
import { StreamChunk } from '@/types/streaming';
import { auth } from '@/lib/firebase';

export function useStreamingData() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<StreamChunk[]>([]);

  const startStreaming = useCallback(async (endpoint: string, params: unknown) => {
    setIsStreaming(true);
    setError(null);
    setChunks([]);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/x-ndjson'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Failed to start streaming: ${response.statusText}`);
      }

      const accumulatedChunks: StreamChunk[] = [];

      for await (const rawChunk of streamReader(response)) {
        // Transform raw NDJSON chunk ({ text: string }) to StreamChunk format
        const chunk: StreamChunk = rawChunk.text
          ? {
              candidates: [
                {
                  content: {
                    parts: [{ text: rawChunk.text }],
                  },
                },
              ],
            }
          : rawChunk;
        accumulatedChunks.push(chunk);
        setChunks([...accumulatedChunks]);
      }

      const aggregatedData = aggregateStreamedData(accumulatedChunks);
      const processedData = processAggregatedData(aggregatedData);

      return processedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process stream';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    startStreaming,
    isStreaming,
    error,
    chunks
  };
}