/**
 * File utilities (Node.js only)
 */
import { promises as fs } from "node:fs";
import type { Readable } from "node:stream";

/**
 * Read file contents as string
 * @param filePath
 * @param encoding
 * @returns
 */
export const readFile = async (
  filePath: string,
  encoding: BufferEncoding = "utf-8"
): Promise<string> => {
  return fs.readFile(filePath, encoding);
};

/**
 * Write a readable stream to a file
 * @param filepath - Path to write the file to
 * @param buffer - Readable stream to write
 */
export const writeBufferToFile = async (
  filepath: string,
  buffer: Readable | undefined
) => {
  const chunks: Buffer[] = [];
  for await (const chunk of buffer as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  await fs.writeFile(filepath, Buffer.concat(chunks));
};
