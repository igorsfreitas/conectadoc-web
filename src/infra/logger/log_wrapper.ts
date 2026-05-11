import { Log as LibLog } from "@afinz/logger";
import { Vortex as LibVortex } from "@afinz/logger/dist/vortex";
import { ICrashReporter, ILogOptions } from "@afinz/logger/dist/interface";
import { afinzStorageKeys } from "../afinz_storage/afinz_storage_keys";

/**
 * Wrapper para manter compatibilidade com a API antiga do Log
 * enquanto usa a biblioteca @afinz/logger
 */
export class Log {
  private static getCpf(): string {
    return localStorage.getItem(afinzStorageKeys.authenticatedCpf) ?? "";
  }

  private static getLastRequest(): string {
    return localStorage.getItem(afinzStorageKeys.lastRequest) ?? "";
  }

  private static getLastBody(): string {
    const body = localStorage.getItem(afinzStorageKeys.lastBody);
    return body ? JSON.parse(body) : "";
  }

  public static init(crashReporter: ICrashReporter): void {
    LibLog.init(crashReporter);
  }

  public static api(message: string, options: ILogOptions = {}): void {
    const cpf = Log.getCpf();
    const lastRequest = Log.getLastRequest();
    const lastBody = Log.getLastBody();

    LibLog.api(message, options, cpf, lastRequest, lastBody);
  }

  public static screen(message: string, options: ILogOptions = {}): void {
    const cpf = Log.getCpf();
    const lastRequest = Log.getLastRequest();
    const lastBody = Log.getLastBody();

    LibLog.screen(message, options, cpf, lastRequest, lastBody);
  }
}

/**
 * Wrapper para Vortex que adapta o constructor
 */
export class Vortex implements ICrashReporter {
  private vortex: LibVortex;

  constructor() {
    const baseURL = import.meta.env.VITE_APP_BASE_URL;
    const plataform = "PIN";
    this.vortex = new LibVortex(baseURL, plataform);
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
