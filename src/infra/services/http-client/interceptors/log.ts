import { HttpLogInterceptors } from "@afinz/rest-client";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

export class LogInterceptor implements HttpLogInterceptors {
  public getRequestInterceptor(): void {}

  public getResponseInterceptor(_response: AxiosResponse): void {}

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
      onSuccess: (response: AxiosResponse) => response,
      onError: (error: AxiosError) => Promise.reject(error),
    };
  }
}
