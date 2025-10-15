// src/constants/legalVersions.ts

/**
 * Legal Document Versions
 * 
 * Centralized version management for all legal documents.
 * Update these versions when terms, privacy policy, or cookie policy change.
 * 
 * Version format: "MAJOR.MINOR"
 * - MAJOR: Significant changes requiring re-acceptance
 * - MINOR: Minor clarifications or updates
 * 
 * @example
 * // When updating terms:
 * 1. Update TERMS version (e.g., "1.0" -> "1.1")
 * 2. Add entry to CHANGE_LOGS
 * 3. Update lastUpdated date in respective legal page
 */

export const LEGAL_VERSIONS = {
  /** Terms of Service version */
  TERMS: "1.0",
  
  /** Privacy Policy version */
  PRIVACY: "1.0",

/** Cookie Policy version */
  COPYRIGHT: "1.0",
  
  /** Cookie Policy version */
  COOKIES: "1.0",
} as const;

/**
 * Change logs for legal documents
 * Used to display what changed in the ConsentUpdateModal
 */
export const LEGAL_CHANGE_LOGS: Record<string, string[]> = {
  "1.0": [
    "Initial Terms of Service",
    "Initial Privacy Policy",
    "Initial Copyright Policy",
    "Initial Cookie Policy",
  ],
  // Add new versions here as they are released
  // "1.1": [
  //   "Updated data retention policy",
  //   "Added GDPR compliance details",
  //   "Clarified cookie usage",
  // ],
};

/**
 * Get changes for a specific version
 */
export function getChangesForVersion(version: string): string[] {
  return LEGAL_CHANGE_LOGS[version] || [];
}

/**
 * Get the latest version number
 */
export function getLatestVersion(): string {
  return LEGAL_VERSIONS.TERMS; // Assuming all docs version together
}

/**
 * Check if a version is outdated
 */
export function isVersionOutdated(
  currentVersion: string,
  latestVersion: string = getLatestVersion()
): boolean {
  return currentVersion !== latestVersion;
}

/**
 * Type guard for legal version
 */
export type LegalVersion = typeof LEGAL_VERSIONS[keyof typeof LEGAL_VERSIONS];