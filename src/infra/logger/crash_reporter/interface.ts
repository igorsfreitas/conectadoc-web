export interface ICrashReporter {
  sendReport(tag: string, message: string, logOptions: ILogOptions): void;
}

export interface ILogOptions {
  error?: unknown;
  stackTrace?: unknown;
  lastApi?: {
    url: string;
    body: unknown;
  };
}
