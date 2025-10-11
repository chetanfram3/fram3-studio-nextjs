/**
 * Process Google profile picture URL to get higher resolution
 * Google profile pics come with size parameter that can be adjusted
 */
export function processGoogleProfilePic(url: string): string {
  if (!url) return '';

  // Replace the size parameter with s400 for 400x400 resolution
  return url.replace(/=s\d+-c/, '=s400-c');
}

/**
 * Generate a default profile picture using UI Avatars service
 * Creates an avatar with initials from the display name
 */
export function getDefaultProfilePic(displayName: string): string {
  if (!displayName) {
    return 'https://ui-avatars.com/api/?name=User&background=random&size=200&bold=true';
  }

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=200&bold=true`;
}

/**
 * Validate if URL is a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const path = parsedUrl.pathname.toLowerCase();

    // Check if URL ends with valid image extension or is from known avatar services
    return validExtensions.some(ext => path.endsWith(ext)) ||
      url.includes('googleusercontent.com') ||
      url.includes('ui-avatars.com') ||
      url.includes('gravatar.com');
  } catch {
    return false;
  }
}

/**
 * Get profile picture with fallback
 * Returns the provided URL if valid, otherwise returns a default avatar
 */
export function getProfilePicWithFallback(url: string | null | undefined, displayName: string): string {
  if (!url) {
    return getDefaultProfilePic(displayName);
  }

  // Process Google profile pics
  if (url.includes('googleusercontent.com')) {
    return processGoogleProfilePic(url);
  }

  // Validate and return URL or fallback
  return isValidImageUrl(url) ? url : getDefaultProfilePic(displayName);
}

/**
 * Create a data URL from initials for inline use
 * Useful for SSR or when external services are unavailable
 */
export function createInitialsDataUrl(initials: string, size: number = 200): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  if (!context) {
    return '';
  }

  // Random background color
  const hue = Math.floor(Math.random() * 360);
  context.fillStyle = `hsl(${hue}, 70%, 60%)`;
  context.fillRect(0, 0, size, size);

  // White text
  context.fillStyle = '#FFFFFF';
  context.font = `bold ${size / 2}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(initials, size / 2, size / 2);

  return canvas.toDataURL();
}

// Helper function to convert GCS path to public URL
export const convertPathToPublicUrl = (path: string): string => {
  // Remove the "gs://" prefix if present
  const cleanPath = path.replace(/^gs:\/\//, "");

  // Split to get bucket and file path
  const [bucketName, ...pathParts] = cleanPath.split("/");
  const filePath = pathParts.join("/");

  // URL encode the file path to handle spaces and special characters
  const encodedFilePath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  // Return the public Google Cloud Storage URL
  return `https://storage.googleapis.com/${bucketName}/${encodedFilePath}`;
};