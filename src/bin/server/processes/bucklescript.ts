import Session from "../session";

export default class BuckleScript {
  constructor(private readonly session: Session) {}

  public run(): Promise<string> {
    let buffer = "";
    return new Promise(resolve => {
      const command = this.session.settings.reason.path.bsb;

      const useWSL = this.session.settings.reason.command.useWSL;
      const shell = this.session.settings.reason.command.shell;
      const shellargs = this.session.settings.reason.command.shellargs;

      const process = useWSL
        ? this.session.environment.spawn(shell, [...shellargs, command, "-make-world"])
        : this.session.environment.spawn(command, ["-make-world"]);

      process.on("error", (error: Error & { code: string }) => {
        if ("ENOENT" === error.code) {
          const msg = `Cannot find bsb binary at "${command}".`;
          this.session.connection.window.showWarningMessage(msg);
          this.session.connection.window.showWarningMessage(
            `Double check your path or try configuring "reason.path.bsb" under "User Settings". Alternatively, disable "bsb" in "reason.diagnostics.tools"`,
          );
        }
        resolve("");
      });
      process.stdout.on("data", (data: Buffer | string) => (buffer += data.toString()));
      process.stdout.on("end", () => resolve(buffer));
      process.on("uncaughtException", (error: Error & { code: string }) => {
        // Useful for some specific cases, like bsb not having permissions to write to the file system
        this.session.connection.window.showWarningMessage(error.message);
      });
    });
  }
}
