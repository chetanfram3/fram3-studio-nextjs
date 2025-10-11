const IMG_TOKEN = process.env.NEXT_PUBLIC_LOGO_API_KEY;

export const getLogoUrl = (websiteUrl: string): string | null => {
  try {
    // Ensure the input has a protocol for `new URL()`
    const normalizedUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;

    // Extract domain name
    const domain = new URL(normalizedUrl).hostname;

    return `https://img.logo.dev/${domain}?token=${IMG_TOKEN}`;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Invalid website URL:", error.message);
    } else {
      console.error("An unknown error occurred");
    }
    return null;
  }
};
