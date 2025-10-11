
export function cleanText(text: string): string {
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Helper function to capitalize first letter of each word
export function capitalizeWords(str: string | null | undefined): string {
  if (!str || typeof str !== "string") return "";  // Handle null/undefined
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Re-export token functions from tokenization.ts
export { countTokens, isTokenLimitExceeded, getTokenStatus } from './tokenization';

interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export const formatTimestamp = (timestamp: string | FirestoreTimestamp | null): string => {
  if (!timestamp) return '';

  if (typeof timestamp === 'string') {
    return new Date(timestamp).toLocaleString();
  }

  return new Date(
    timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000
  ).toLocaleString();
};
