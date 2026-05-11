import { AfinzApiError, HttpClient } from "@afinz/rest-client";
import { ProfileResponse } from "./profile.model";

export class ProfileService {
  constructor(private readonly httpClient: HttpClient) {}

  async getProfile(): Promise<ProfileResponse | AfinzApiError> {
    try {
      const response = await this.httpClient.get<ProfileResponse>(`/auth/me`, {
        withCredentials: true,
      });

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
            : "Erro desconhecido ao recuperar o perfil do usuário",
      });
    }
  }
}
