import { Log as LibLog } from "@afinz/logger";
import { Vortex as LibVortex } from "@afinz/logger/dist/vortex";
import { ICrashReporter, ILogOptions } from "@afinz/logger/dist/interface";

export class Log {
  public static init(crashReporter: ICrashReporter): void {
    LibLog.init(crashReporter);
  }

  public static api(message: string, options: ILogOptions = {}): void {
    LibLog.api(message, options, "", "", "");
  }

  public static screen(message: string, options: ILogOptions = {}): void {
    LibLog.screen(message, options, "", "", "");
  }
}

export class Vortex implements ICrashReporter {
  private vortex: LibVortex;

  constructor() {
    const baseURL = import.meta.env.VITE_APP_BASE_URL;
    this.vortex = new LibVortex(baseURL, "CONECTADOC");
  }

  sendReport(
    tag: string,
    message: string,
    options: ILogOptions,
    cpf: string,
    lastRequest: string,
    lastBody: string,
  ): void {
    this.vortex.sendReport(tag, message, options, cpf, lastRequest, lastBody);
  }
}
