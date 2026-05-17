import { AfinzApiError, HttpClient } from "@afinz/rest-client";

export interface LoginRequest {
  cpf: string;
  senha: string;
  persistent?: boolean;
}

export interface LoginResponse {
  usuario: {
    codigo: number;
    nome: string;
    cpf: string;
  };
  isAdmin: boolean;
  permissions: string[];
}

export class AuthService {
  constructor(private readonly httpClient: HttpClient) {}

  async login(body: LoginRequest): Promise<LoginResponse | AfinzApiError> {
    try {
      const response = await this.httpClient.post<LoginResponse>(
        `/v1/auth/login`,
        {
          cpf: body.cpf,
          senha: body.senha,
          persistent: body.persistent ?? false,
        },
        { withCredentials: true },
      );

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AfinzApiError) {
        return error;
      }
      return new AfinzApiError({
        status: 500,
        message:
          error instanceof Error ? error.message : "Erro desconhecido ao fazer login",
      });
    }
  }

  async logout(): Promise<void> {
    try {
      await this.httpClient.post(`/v1/auth/logout`, {}, { withCredentials: true });
    } catch {
      // ignore
    }
  }
}
