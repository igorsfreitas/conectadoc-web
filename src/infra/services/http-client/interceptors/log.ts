import { HttpLogInterceptors } from "@afinz/rest-client";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { afinzStorageKeys } from "../../../afinz_storage/afinz_storage_keys";
import { OpenSearchService } from "../../open-search/open-search.service";
import {
  AfinzLogModel,
  LogFlagType,
} from "../../open-search/open-search.models";

export class LogInterceptor implements HttpLogInterceptors {
  private openSearchService?: OpenSearchService;

  public setOpenSearchService(service: OpenSearchService) {
    this.openSearchService = service;
  }

  private buildLogModel(
    logFlagType: LogFlagType,
    config: AxiosRequestConfig,
    response?: AxiosResponse,
    error?: AxiosError,
  ): AfinzLogModel {
    return {
      logFlagType,
      requestTime: new Date().toISOString(),
      error: error
        ? { message: error.message, code: error.code, stack: error.stack }
        : undefined,
      request: {
        method: config.method?.toUpperCase(),
        baseUrl: config.baseURL,
        route: config.url,
        url: `${config.baseURL}${config.url}`,
        headers: config.headers || {},
        queryParameters: config.params,
        data: config.data,
      },
      response: response
        ? {
            statusCode: response.status,
            body: response.data,
          }
        : undefined,
    };
  }

  public getRequestInterceptor(): void {}

  public getResponseInterceptor(response: AxiosResponse): void {
    if (!response.config.url?.includes("opensearch/document")) {
      localStorage.setItem(
        afinzStorageKeys.lastRequest,
        JSON.stringify(`${response.config.baseURL}${response.config.url}`),
      );
      localStorage.setItem(
        afinzStorageKeys.lastBody,
        JSON.stringify(response.data),
      );

      const logModel = this.buildLogModel(
        LogFlagType.API_SUCCESS,
        response.config,
        response,
      );
      this.openSearchService?.log(logModel);
    }
  }

  public getRequestInterceptorObject(): {
    onSuccess: (config: AxiosRequestConfig) => AxiosRequestConfig;
    onError: (error: AxiosError) => Promise<AxiosError>;
  } {
    return {
      onSuccess: (config: AxiosRequestConfig) => config,
      onError: (error: AxiosError) => Promise.reject(error),
    };
  }

  public getResponseInterceptorObject(): {
    onSuccess: (response: AxiosResponse) => AxiosResponse;
    onError: (error: AxiosError) => Promise<AxiosError>;
  } {
    return {
      onSuccess: (response: AxiosResponse) => {
        this.getResponseInterceptor(response);
        return response;
      },
      onError: (error: AxiosError) => {
        if (!error.config?.url?.includes("opensearch/document")) {
          const logModel = this.buildLogModel(
            LogFlagType.API_ERROR,
            error.config!,
            undefined,
            error,
          );
          this.openSearchService?.log(logModel);
        }
        return Promise.reject(error);
      },
    };
  }
}
