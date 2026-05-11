import { AfinzApiError, HttpClient } from "@afinz/rest-client";
import {
  AuthFirstAccessRequest,
  AuthFirstAccessResponse,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthResetRequest,
  AuthResetResponse,
  AuthSendResponse,
  AuthVerifyRequest,
  AuthVerifyResponse,
} from "../../../features/login/models/auth.model";

export class AuthService {
  constructor(private readonly httpClient: HttpClient) {}

  async firstAccess(
    body: AuthFirstAccessRequest,
  ): Promise<AuthFirstAccessResponse | AfinzApiError> {
    try {
      const response = await this.httpClient.post<AuthFirstAccessResponse>(
        `/auth/first-access`,
        {
          document: {
            kind: "CPF",
            value: body.document,
          },
          channel: "PORTAL_INVESTIDOR",
          login: body.document,
        },
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AfinzApiError) {
        return error;
      }
      return new AfinzApiError({
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao fazer o primeiro acesso",
      });
    }
  }

  async sendOtp(
    body: AuthFirstAccessRequest,
  ): Promise<AuthSendResponse | AfinzApiError> {
    try {
      const response = await this.httpClient.post<AuthSendResponse>(
        `/auth/otp/send`,
        {
          purpose: "PASSWORD_RESET",
          login: body.document,
          delivery: "EMAIL",
          channel: "PORTAL_INVESTIDOR",
        },
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AfinzApiError) {
        return error;
      }
      return new AfinzApiError({
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao enviar OTP",
      });
    }
  }

  async verifyOtp(
    body: AuthVerifyRequest,
  ): Promise<AuthVerifyResponse | AfinzApiError> {
    try {
      const response = await this.httpClient.post<AuthVerifyResponse>(
        `/auth/otp/verify`,
        {
          challenge_id: body.challenge_id,
          code: body.code,
        },
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AfinzApiError) {
        return error;
      }
      return new AfinzApiError({
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao realizar a verificação de OTP",
      });
    }
  }

  async resetPassword(
    body: AuthResetRequest,
  ): Promise<AuthResetResponse | AfinzApiError> {
    try {
      const response = await this.httpClient.post<AuthResetResponse>(
        `/auth/password/reset`,
        {
          reset_token: body.reset_token,
          new_password: body.new_password,
        },
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AfinzApiError) {
        return error;
      }
      return new AfinzApiError({
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao resetar senha",
      });
    }
  }

  async login(
    body: AuthLoginRequest,
  ): Promise<AuthLoginResponse | AfinzApiError> {
    try {
      const response = await this.httpClient.post<AuthLoginResponse>(
        `/auth/login`,
        {
          login: body.login,
          password: body.password,
        },
        {
          withCredentials: true,
        },
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AfinzApiError) {
        return error;
      }
      return new AfinzApiError({
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao fazer login",
      });
    }
  }
}
