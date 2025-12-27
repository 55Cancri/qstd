declare module "await-spawn" {
  import type { ChildProcess, SpawnOptions } from "child_process";

  type SpawnPromise = Promise<Buffer> & { child: ChildProcess };

  function spawn(command: string, options?: SpawnOptions): SpawnPromise;
  function spawn(
    command: string,
    args: readonly string[],
    options?: SpawnOptions
  ): SpawnPromise;

  export default spawn;
}
