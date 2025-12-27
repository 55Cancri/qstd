import awaitSpawn from "await-spawn";

/** Allows any string while providing autocomplete for known commands */
type Command =
  | "python3"
  | "node"
  | "bun"
  | "pnpm"
  | "yarn"
  | "npm"
  | (string & {});

/**
 * A command line spawn that awaits properly.
 * Uses shell execution and inherits stdio for full console output.
 * @param cmd - The shell command to execute
 * @returns Promise that resolves when the command completes
 */
export const spawn = (cmd: Command): Promise<Buffer> =>
  awaitSpawn(cmd, { shell: true, stdio: "inherit" });
