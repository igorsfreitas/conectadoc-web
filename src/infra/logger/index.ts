import { ICrashReporter, ILogOptions } from "./crash_reporter/interface";

export class Log {
  private static crashReporter: ICrashReporter | null = null;

  private static _processLog(
    tag: string,
    message: string,
    options: ILogOptions = {},
  ): void {
    if (Log.crashReporter) {
      Log.crashReporter.sendReport(tag, message, options);
    }
  }

  public static init(crashReporter: ICrashReporter): void {
    Log.crashReporter = crashReporter;
  }

  public static api(message: string, options: ILogOptions = {}): void {
    Log._processLog("API", message, options);
  }

  public static screen(message: string, options: ILogOptions = {}): void {
    Log._processLog("Screen", message, options);
  }
}
