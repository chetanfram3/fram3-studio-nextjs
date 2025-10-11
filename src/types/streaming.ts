export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface StreamChunk {
  candidates?: {
    content?: {
      parts?: { text: string }[];
    };
    finishReason?: string;
  }[];
  usageMetadata?: UsageMetadata;
  modelVersion?: string;
  text?: string;
}

export interface AggregatedData {
  contentParts: { text: string }[];
  usageMetadata: UsageMetadata | null;
  finishReason: string | null;
  modelVersion: string;
}

export interface ProcessedData {
  usageMetadata: UsageMetadata;
  modelVersion: string;
  data: unknown;
}