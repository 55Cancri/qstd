/**
 * Browser API utilities
 */

/**
 * Copy text to clipboard
 * @param text
 * @returns
 */
export const copyToClipboard = (text: string): Promise<void> =>
  navigator.clipboard.writeText(text);

/**
 * Read text from clipboard
 * @returns
 */
export const readFromClipboard = async (): Promise<string> => {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error("Failed to read from clipboard:", error);
    return "";
  }
};

/**
 * Download a file from blob data
 * @param data
 * @param filename
 */
export const downloadFile = (data: Blob, filename: string): void => {
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Open URL in new tab
 * @param url
 */
export const openInNewTab = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};

/**
 * Get user agent string
 * @returns
 */
export const getUserAgent = (): string => {
  return navigator.userAgent;
};

/**
 * Check if browser is online
 * @returns
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Get window dimensions
 * @returns
 */
export const getWindowDimensions = (): { width: number; height: number } => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};
