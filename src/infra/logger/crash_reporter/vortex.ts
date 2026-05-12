import axios, { AxiosInstance } from "axios";
import { ICrashReporter, ILogOptions } from "./interface";

export class Vortex implements ICrashReporter {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: import.meta.env.VITE_APP_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
  }

  sendReport(tag: string, message: string, options: ILogOptions): void {
    const reportData = {
      MensagemErro: `[${tag}] ${message}`,
      UltimaApi: options.lastApi?.url ?? "",
      UltimoRetorno: JSON.stringify(options.lastApi?.body) ?? "",
      Plataforma: "ConectaDoc",
    };

    this.httpClient
      .post(`/log-vortex/error`, reportData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      })
      .catch((err) => {
        console.error("Erro ao enviar relatório:", err);
      });
  }
}
