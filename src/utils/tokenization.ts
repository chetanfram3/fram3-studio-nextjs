/**
 * Utility functions for token handling
 */

/**
 * Count tokens in text using a more accurate tokenization approach.
 * This implementation splits on word boundaries and includes punctuation.
 * @param text - The input string to tokenize.
 * @returns The number of tokens in the text.
 */
export function countTokens(text: string): number {
  if (!text) return 0;

  // Split text into tokens: word boundaries, punctuation, and special characters
  const tokens = text.match(/\b[\w']+\b|\S/g) || [];
  return tokens.length;
}

/**
 * Check if the text exceeds the token limit.
 * @param text - The input string to validate.
 * @param maxTokens - The maximum allowed token count.
 * @returns Whether the token count exceeds the limit.
 */
export function isTokenLimitExceeded(text: string, maxTokens: number): boolean {
  const tokenCount = countTokens(text);
  return tokenCount > maxTokens;
}

/**
 * Get token count status.
 * @param text - The input string to analyze.
 * @param maxTokens - The maximum allowed token count.
 * @param minTokens - The minimum required token count.
 * @returns An object with token count details.
 */
export function getTokenStatus(
  text: string,
  maxTokens: number,
  minTokens: number
) {
  const tokenCount = countTokens(text);
  return {
    count: tokenCount, // Current token count
    isExceeded: tokenCount > maxTokens, // Whether the token count exceeds the maximum
    isBelowMinimum: tokenCount < minTokens, // Whether the token count is below the minimum
    remaining: Math.max(maxTokens - tokenCount, 0), // Remaining tokens within the limit
  };
}
