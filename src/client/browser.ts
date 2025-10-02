/**
 * Browser API utilities
 */

/**
 * Copy text to clipboard
 * @param text
 * @returns
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

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
