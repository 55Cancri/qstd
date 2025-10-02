/**
 * File utilities (Node.js only)
 */
import fs from "node:fs";

/**
 * Read file contents as string
 * @param filePath
 * @param encoding
 * @returns
 */
export const readFile = (
  filePath: string,
  encoding: BufferEncoding = "utf-8"
): string => {
  return fs.readFileSync(filePath, encoding);
};
