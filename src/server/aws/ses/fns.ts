/**
 * Creates a plain text fallback from HTML email content.
 *
 * SES emails are sent as multipart/alternative with both HTML and text bodies.
 * The text version is needed because some email clients don't render HTML
 * (accessibility settings, security restrictions, older clients), and many
 * clients show the plain text in inbox previews and notifications. Including
 * both versions also improves deliverability/spam scores.
 *
 * @example
 * ```ts
 * stripHtml("<p>Hello <strong>world</strong></p>");
 * // Returns: "Hello world"
 * ```
 */
export const stripHtml = (html: string): string =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove style tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]+>/g, " ") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();

