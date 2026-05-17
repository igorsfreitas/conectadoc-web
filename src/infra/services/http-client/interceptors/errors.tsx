import { AfinzApiError, HttpErrorInterceptors } from "@afinz/rest-client";
import { AxiosError } from "axios";
import { afinzAppPaths } from "../../../router/paths/afinz_app";
import { Log } from "../../../logger/log_wrapper";

export class PinErrorInterceptors implements HttpErrorInterceptors {
  handleConnectionErrorInterceptor(error: unknown): void | never {
    if (error instanceof AfinzApiError) {
      throw error;
    }

    if (error instanceof AxiosError && error.code === AxiosError.ERR_NETWORK) {
      throw new AfinzApiError({
        message: "Sem conexão com a internet",
        status: 0,
        content: { originalError: error },
      });
    }

    if (error instanceof AxiosError && error.code !== AxiosError.ERR_NETWORK) {
      Log.api(error.message, {
        error: error.response?.data,
        lastApi: {
          url: error.config?.url ?? "",
          body: error.response?.data,
        },
      });
    }

    if (error instanceof AxiosError && error.response) {
      const statusCode = error.response.status;
      const responseData = error.response.data;

      let errorMessage = "Erro na comunicação com o servidor";

      if (
        responseData &&
        typeof responseData === "object" &&
        responseData !== null
      ) {
        if (
          "message" in responseData &&
          typeof responseData.message === "string"
        ) {
          errorMessage = responseData.message;
        }
      }

      switch (statusCode) {
        case 400:
          errorMessage = errorMessage || "Requisição inválida";
          break;
        case 401:
          if (window.location.pathname !== afinzAppPaths.login.path) {
            errorMessage = "Sessão expirada. Faça login novamente";
            window.location.href = afinzAppPaths.login.path;
          }
          break;
        case 403:
          errorMessage = "Você não tem permissão para esta ação";
          break;
        case 404:
          errorMessage = "Recurso não encontrado";
          break;
        case 422:
          errorMessage = errorMessage || "Dados inválidos enviados";
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = "Erro no servidor. Tente novamente mais tarde";
          break;
        default:
          if (statusCode >= 400) {
            errorMessage = errorMessage || "Erro desconhecido";
          }
      }

      throw new AfinzApiError({
        message: errorMessage,
        status: statusCode,
        content: {
          responseData,
          originalError: error,
        },
      });
    }

    if (error instanceof Error) {
      throw new AfinzApiError({
        message: "Erro inesperado",
        status: 500,
        content: { originalError: error },
      });
    }

    throw new AfinzApiError({
      message: "Erro desconhecido",
      status: 500,
      content: { originalError: String(error) },
    });
  }
}
