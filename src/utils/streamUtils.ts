import { StreamChunk, AggregatedData, ProcessedData } from '@/types/streaming';
import { jsonrepair } from "jsonrepair";

export async function* streamReader(response: Response) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  if (!reader) throw new Error('No reader available');

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Append new chunk to buffer
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Split by newlines and process complete lines
      const lines = buffer.split('\n');

      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() || '';

      // Process complete lines
      for (const line of lines) {
        if (!line.trim()) continue;  // Skip empty lines

        try {
          const parsed = JSON.parse(line);
          yield parsed;
        } catch (e) {
          // Special handling for lines that might contain multiple JSON objects
          if (line.includes('}{')) {
            try {
              // Try to split and parse multiple JSON objects
              const jsonParts = line.replace(/\}\s*\{/g, '}\n{').split('\n');

              for (const part of jsonParts) {
                if (!part.trim()) continue;

                try {
                  const parsed = JSON.parse(part);
                  yield parsed;
                } catch (innerError) {
                  console.warn('Failed to parse part:', part);
                }
              }
            } catch (splitError) {
              console.warn('Failed to split multi-JSON line:', line);
            }
          } else {
            // For lines that look like JSON but aren't valid
            if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
              try {
                // Try to repair JSON
                const repairedJson = jsonrepair(line);
                const parsed = JSON.parse(repairedJson);
                yield parsed;
              } catch (repairError) {
                console.warn('Failed to repair JSON line:', line);
              }
            } else {
              console.warn('Failed to parse line:', line);
            }
          }
        }
      }
    }

    // Process any remaining content in the buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        yield parsed;
      } catch (e) {
        console.warn('Failed to parse final buffer:', buffer);
      }
    }
  } catch (error) {
    console.error('Stream reader error:', error);
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export function aggregateStreamedData(chunks: StreamChunk[]): AggregatedData {
  const aggregatedData = chunks.reduce<AggregatedData>(
    (acc, chunk) => {
      const content = chunk.candidates?.[0]?.content || {};

      if (content.parts) {
        // Try to parse the content and extract data field
        try {
          const text = content.parts[0]?.text || '';
          const parsed = JSON.parse(text);
          if (parsed.data) {
            acc.contentParts.push({ text: JSON.stringify({ data: parsed.data }) });
          } else {
            acc.contentParts.push(...content.parts);
          }
        } catch {
          acc.contentParts.push(...content.parts);
        }
      }

      if (chunk.candidates?.[0]?.finishReason) {
        acc.finishReason = chunk.candidates[0].finishReason;
      }

      return acc;
    },
    {
      contentParts: [],
      finishReason: null,
      modelVersion: 'unknown',
      usageMetadata: {} // Add missing usageMetadata property
    }
  );

  aggregatedData.modelVersion = chunks[0]?.modelVersion || 'unknown';

  // If chunk has usageMetadata, use it
  if (chunks[0]?.usageMetadata) {
    aggregatedData.usageMetadata = chunks[0].usageMetadata;
  }

  return aggregatedData;
}

export function processAggregatedData(aggregatedData: AggregatedData): ProcessedData {
  const combinedContent = aggregatedData.contentParts
    .map(part => part.text)
    .join('');

  try {
    const parsedContent = JSON.parse(combinedContent);

    return {
      modelVersion: aggregatedData.modelVersion,
      usageMetadata: aggregatedData.usageMetadata || {}, // Add missing usageMetadata property
      data: parsedContent.data || null
    };
  } catch (error) {
    throw new Error(`Failed to parse JSON content: ${error}`);
  }
}