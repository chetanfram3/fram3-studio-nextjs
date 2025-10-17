import { jsonrepair } from "jsonrepair";
import logger from "@/utils/logger";


interface FallbackData {
  data: {
    scriptTitle: string;
    script: string;
    scriptDuration: number;
  };
}

/**
 * Sanitizes chunk text to fix escape sequences and edge cases
 * @param text - Input text to sanitize
 */
export const sanitizeChunkText = (text: string): string => {
  try {
    // Check if it's HTML content (error page) - added to match backend
    if (text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html") ||
      text.includes("</html>")) {
      logger.warn("Received HTML content instead of JSON. This is likely an error page.");
      // Return a valid JSON error object instead of HTML
      return JSON.stringify({
        error: "Received HTML error page from server",
        errorType: "HTML_RESPONSE",
      });
    }

    // First try a direct jsonrepair if it appears to be JSON
    if (text.trim().startsWith("{") && text.trim().endsWith("}")) {
      try {
        // If it's valid JSON or repairable JSON, use jsonrepair
        const repaired = jsonrepair(text);

        // Verify it's still valid JSON after repair
        JSON.parse(repaired);

        logger.debug("Successfully repaired JSON chunk with jsonrepair");
        return repaired;
      } catch (jsonError) {
        logger.debug(`Chunk is not valid JSON, proceeding with standard sanitization: ${jsonError.message}`);
        // If it's not valid JSON, continue with standard sanitization
      }
    }

    // Apply standard sanitization for non-JSON content - match backend patterns
    return text
      .replace(/\\(?![\\bfnrtu"])/g, "\\\\") // Fix lone backslashes
      .replace(/[\u0000-\u001F]/g, "") // Remove control characters
      .replace(/\n\s*\n/g, "\n"); // Normalize newlines
  } catch (error) {
    logger.error(`Error sanitizing chunk text: ${error}`);
    return text;
  }
};

/**
 * Extract and parse JSON from text, handling markdown, direct JSON, and duplicated JSON objects
 * @param text - Input text containing JSON
 * @returns Parsed JSON object
 */
export const extractJsonFromText = <T>(text: string): T => {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input for JSON extraction");
  }

  const cleanedText = text.trim().replace(/^\s+/, "");

  // First try: Use jsonrepair to fix any common JSON issues (matches backend order)
  try {
    const repairedJson = jsonrepair(cleanedText);
    const parsedJson = JSON.parse(repairedJson);
    if (parsedJson.data) {
      logger.info("Successfully parsed JSON using jsonrepair");
      return parsedJson as T;
    }
  } catch (repairError) {
    logger.debug(`JSON repair attempt failed: ${repairError.message}`);
    // Continue with existing fallbacks
  }

  // Try parsing directly as JSON
  try {
    const parsedJson = JSON.parse(cleanedText);
    if (parsedJson.data) {
      logger.info("Successfully parsed direct JSON");
      return parsedJson as T;
    }
  } catch (directError) {
    logger.debug(`Direct JSON parse failed: ${directError.message}`);
  }

  // Handle duplicated or concatenated JSON objects
  const jsonObjects = cleanedText
    .replace(/\}\s*\{/g, "}|{")
    .split("|")
    .filter((s) => s.trim());

  for (const jsonStr of jsonObjects) {
    // Try with jsonrepair for each segment
    try {
      const repairedSegment = jsonrepair(jsonStr);
      const parsedJson = JSON.parse(repairedSegment);
      if (parsedJson.data) {
        logger.info(`Successfully parsed JSON object from repaired segment`);
        return parsedJson as T;
      }
    } catch (repairSegmentError) {
      logger.debug(`Failed to repair JSON segment: ${repairSegmentError.message}`);
    }

    // Try parsing segment directly
    try {
      const parsedJson = JSON.parse(jsonStr);
      if (parsedJson.data) {
        logger.info(`Successfully parsed JSON object from segment`);
        return parsedJson as T;
      }
    } catch (segmentError) {
      logger.warn(`Failed to parse JSON segment: ${segmentError.message}`);
    }
  }

  // Check for markdown code block (matches backend order)
  const jsonBlockPattern = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
  const jsonBlockMatch = cleanedText.match(jsonBlockPattern);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      const extractedJson = jsonBlockMatch[1];
      // Try with jsonrepair
      const repairedBlock = jsonrepair(extractedJson);
      const parsedJson = JSON.parse(repairedBlock);
      if (parsedJson.data) {
        logger.info("Successfully extracted JSON from repaired markdown code block");
        return parsedJson as T;
      }
    } catch (repairBlockError) {
      logger.debug(`Failed to repair markdown block: ${repairBlockError.message}`);

      // Try direct parsing as fallback
      try {
        const extractedJson = jsonBlockMatch[1];
        const parsedJson = JSON.parse(extractedJson);
        if (parsedJson.data) {
          logger.info("Successfully extracted JSON from markdown code block");
          return parsedJson as T;
        }
      } catch (blockError) {
        logger.warn(`Failed to parse JSON from markdown block: ${blockError.message}`);
      }
    }
  }

  // Enhanced brace-matching fallback for first valid JSON object with data field
  // Exactly match backend implementation
  let braceCount = 0;
  let dataStart = -1;
  let dataEnd = -1;

  // Find the first {"data": or { "data": (match backend exactly)
  for (let i = 0; i < cleanedText.length; i++) {
    if (
      cleanedText.startsWith('{"data":', i) ||
      cleanedText.startsWith('{ "data":', i)
    ) {
      dataStart = i;
      braceCount = 1;
      i++; // Skip the opening brace
      break;
    }
  }

  if (dataStart === -1) {
    logger.error(`No '{"data":' or '{ "data":' found in response`);
    throw new Error("No valid JSON 'data' object found in response");
  }

  // Find the matching closing brace for the first JSON object
  for (let i = dataStart + 1; i < cleanedText.length; i++) {
    if (cleanedText[i] === "{") braceCount++;
    if (cleanedText[i] === "}") braceCount--;
    if (braceCount === 0) {
      dataEnd = i;
      break;
    }
  }

  if (dataEnd === -1) {
    logger.error(`No matching closing brace found in response`);
    throw new Error("No valid JSON end found in response");
  }

  const jsonString = cleanedText.substring(dataStart, dataEnd + 1);

  // Last attempt: use jsonrepair on the extracted substring
  try {
    const repairedString = jsonrepair(jsonString);
    const parsedContent = JSON.parse(repairedString);
    if (!parsedContent.data) {
      throw new Error("Repaired content does not contain 'data' key");
    }
    logger.info("Successfully parsed JSON using jsonrepair on extracted substring");
    return parsedContent as T;
  } catch (repairError) {
    logger.debug(`Failed to repair extracted substring: ${repairError.message}`);

    // Fall back to standard parsing (match backend)
    try {
      const parsedContent = JSON.parse(jsonString);
      if (!parsedContent.data) {
        throw new Error("Parsed content does not contain 'data' key");
      }
      logger.info("Successfully parsed JSON using enhanced brace matching");
      return parsedContent as T;
    } catch (error) {
      logger.error(`Error parsing extracted JSON: ${error}`);
      throw new Error(`Failed to parse extracted JSON: ${error}`);
    }
  }
};
/**
 * Parses JSON with multiple retries and fallback strategies
 * @param content The content to parse as JSON
 * @param maxRetries Maximum number of retries before using fallback methods
 * @returns The parsed JSON object
 */
export const parseJsonWithRetry = async <T>(content: string, maxRetries = 3): Promise<T> => {
  let retryCount = 0;

  // Create a retry loop with exponential backoff
  const attemptParse = async (): Promise<T> => {
    return new Promise((resolve, reject) => {
      try {
        const result = extractJsonFromText<T>(content);
        resolve(result);
      } catch (err) {
        logger.error(`JSON parsing attempt ${retryCount + 1}/${maxRetries} failed:`, err);

        // If we haven't exceeded max retries, try again after a delay
        if (retryCount < maxRetries) {
          retryCount++;
          // Calculate exponential backoff delay: 500ms, 1000ms, 2000ms
          const retryDelay = 500 * Math.pow(2, retryCount - 1);
          setTimeout(() => {
            attemptParse().then(resolve).catch(reject);
          }, retryDelay);
        } else {
          reject(new Error("Failed to parse JSON after maximum retries"));
        }
      }
    });
  };

  return attemptParse();
};

/**
 * Extracts potential script content from a malformed response
 * Uses regex patterns to find common script content patterns
 * @param content - Raw content to extract from
 */
export const extractFallbackData = <T extends FallbackData>(content: string): T | null => {
  // Enhanced regex patterns to match the more complex JSON structure
  const titleRegex = /"scriptTitle"\s*:\s*"([^"]+)"/;
  const scriptRegex = /"script"\s*:\s*"((?:\\"|[^"])+)"/;
  const durationRegex = /"scriptDuration"\s*:\s*(\d+)/;

  // Try to extract title
  const titleMatch = content.match(titleRegex);
  const extractedTitle = titleMatch
    ? titleMatch[1].replace(/\\"/g, '"')
    : "Generated Script";

  // Try to extract script content
  const scriptMatch = content.match(scriptRegex);
  let extractedScript = "";
  if (scriptMatch) {
    // Clean up escaped quotes and other characters
    extractedScript = scriptMatch[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\\\/g, "\\");
  }

  // Try to extract duration
  const durationMatch = content.match(durationRegex);
  const extractedDuration = durationMatch
    ? parseInt(durationMatch[1], 10)
    : 0;

  logger.debug(
    "Extracted script via regex:",
    extractedScript ? extractedScript.substring(0, 100) + "..." : "None found"
  );

  if (extractedScript && extractedScript.length > 20) {
    // Return a data structure that matches what's expected
    return {
      data: {
        scriptTitle: extractedTitle,
        script: extractedScript,
        scriptDuration: extractedDuration,
      }
    } as T;
  }

  return null;
};

/**
 * Extracts basic script content as a last resort
 * @param content - Raw content to extract from
 */
export const extractBasicScriptContent = (content: string): string | null => {
  // Look for patterns that might indicate script content
  // This is a simplified version of what might be in the content
  const possibleScript = content.match(/(?:NARRATOR|VO|VOICE OVER|INT\.|EXT\.|SCENE).*?[\r\n]/i);
  if (possibleScript) {
    // Extract a reasonable chunk of text around the match
    const startIndex = Math.max(0, content.indexOf(possibleScript[0]) - 50);
    const endIndex = Math.min(content.length, startIndex + 5000);
    return content.substring(startIndex, endIndex);
  }

  // If no scripts patterns found, look for large text blocks
  const chunks = content.split(/[\r\n]{2,}/);
  const largestChunk = chunks.reduce((largest, current) =>
    current.length > largest.length ? current : largest, "");

  if (largestChunk.length > 50) {
    return largestChunk;
  }

  return null;
}