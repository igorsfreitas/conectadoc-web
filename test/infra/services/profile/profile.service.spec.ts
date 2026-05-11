import { ProfileService } from "../../../../src/infra/services/profile/profile.service";

import type { HttpClient } from "@afinz/rest-client";
import { AfinzApiError } from "@afinz/rest-client";
import { ProfileResponse } from "../../../../src/infra/services/profile/profile.model";

jest.mock("@afinz/rest-client", () => {
  class AfinzApiError extends Error {
    status: number;
    constructor({
      status = 500,
      message = "",
    }: { status?: number; message?: string } = {}) {
      super(message);
      this.name = "AfinzApiError";
      this.status = status;
    }
  }
  return { AfinzApiError };
});

const isApiError = (x: unknown): x is AfinzApiError => {
  return typeof x === "object" && x !== null && "status" in x && "message" in x;
};

describe("ProfileService", () => {
  let httpClient: jest.Mocked<Pick<HttpClient, "get">>;
  let service: ProfileService;

  beforeEach(() => {
    httpClient = { get: jest.fn() } as jest.Mocked<Pick<HttpClient, "get">>;
    service = new ProfileService(httpClient as unknown as HttpClient);
    jest.clearAllMocks();
  });

  it("deve retornar dados do perfil no sucesso", async () => {
    const payload: ProfileResponse = {
      id: "usr_9f82a1d3",
      external_ref: 902384,
      document: "98765432100",
      name: "Gabriel Farias",
      address: {
        kind: "HOME",
        line1: "Rua das Palmeiras",
        number: "128",
        line2: "Apto 203, Bloco B",
        district: "Vila Harmonia",
        city: "Curitiba",
        state: "PR",
        country: "BRASIL",
        postalCode: "82035-120",
      },
    };

    httpClient.get.mockResolvedValueOnce({ data: payload });

    const res = await service.getProfile();

    expect(res).toEqual(payload);
    expect(httpClient.get).toHaveBeenCalledWith("/auth/me", {
      withCredentials: true,
    });
  });

  it("deve repassar AfinzApiError quando lançado", async () => {
    const apiErr = new AfinzApiError({ status: 401, message: "unauthorized" });
    httpClient.get.mockRejectedValueOnce(apiErr);

    const res = await service.getProfile();
    expect(res).toBe(apiErr);
  });

  it("deve mapear Error genérico para AfinzApiError 500", async () => {
    httpClient.get.mockRejectedValueOnce(new Error("timeout"));

    const res = await service.getProfile();

    expect(isApiError(res)).toBe(true);
    if (isApiError(res)) {
      expect(res.status).toBe(500);
      expect(res.message).toBe("timeout");
    }
  });

  it("deve mapear erro desconhecido (não-Error) para AfinzApiError 500 com mensagem padrão", async () => {
    httpClient.get.mockRejectedValueOnce("fail");

    const res = await service.getProfile();

    expect(isApiError(res)).toBe(true);
    if (isApiError(res)) {
      expect(res.status).toBe(500);
      expect(res.message).toBe(
        "Erro desconhecido ao recuperar o perfil do usuário",
      );
    }
  });

  it("não deve mutar o objeto data retornado", async () => {
    const data: ProfileResponse = {
      id: "1",
      external_ref: 999,
      document: "98765432100",
      name: "Test User",
      address: {
        kind: "WORK",
        line1: "Av. Paulista",
        number: "1000",
        line2: "Ap 101",
        district: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        country: "BRASIL",
        postalCode: "01310-000",
      },
    };

    httpClient.get.mockResolvedValueOnce({ data });

    const res = await service.getProfile();

    expect(res).toBe(data);

    if (isApiError(res)) {
      throw new Error("Expected ProfileResponse, got AfinzApiError");
    }

    expect(res.address.city).toBe("São Paulo");
  });
});
