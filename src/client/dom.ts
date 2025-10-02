/**
 * DOM manipulation utilities
 */

/**
 * Get element by ID
 * @param id
 * @returns
 */
export const getElement = (id: string): HTMLElement | null => {
  return document.getElementById(id);
};

/**
 * Query selector
 * @param selector
 * @returns
 */
export const querySelector = (selector: string): Element | null => {
  return document.querySelector(selector);
};

/**
 * Query selector all
 * @param selector
 * @returns
 */
export const querySelectorAll = (selector: string): NodeListOf<Element> => {
  return document.querySelectorAll(selector);
};

/**
 * Scroll to top of page
 */
export const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/**
 * Scroll to coordinates
 * @param x
 * @param y
 */
export const scrollTo = (x: number, y: number): void => {
  window.scrollTo({ top: y, left: x, behavior: "smooth" });
};

/**
 * Get current scroll position
 * @returns
 */
export const getScrollPosition = (): { x: number; y: number } => {
  return {
    x: window.scrollX || window.pageXOffset,
    y: window.scrollY || window.pageYOffset,
  };
};

/**
 * Check if element is in viewport
 * @param el
 * @returns
 */
export const isInViewport = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Scroll element into view
 * @param el
 * @param options
 */
export const scrollIntoView = (
  el: HTMLElement,
  options?: ScrollIntoViewOptions
): void => {
  el.scrollIntoView(options);
};

/**
 * Copy text to clipboard
 * @param text
 * @returns
 */
export const copy = async (text: string): Promise<void> => {
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
