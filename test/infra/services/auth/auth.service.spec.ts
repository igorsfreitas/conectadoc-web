import { AuthService } from "../../../../src/infra/services/auth/auth.service";

import type { HttpClient } from "@afinz/rest-client";
import { AfinzApiError } from "@afinz/rest-client";

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

type FirstAccessBody = {
  document: { kind: "CPF"; value: string };
  channel: "PORTAL_INVESTIDOR";
  login: string;
};

type SendOtpBody = {
  purpose: "PASSWORD_RESET";
  login: string;
  delivery: "EMAIL";
  channel: "PORTAL_INVESTIDOR";
};

type VerifyOtpBody = {
  challenge_id: string;
  code: string;
};

type ResetPasswordBody = {
  reset_token: string;
  new_password: string;
};

type LoginBody = {
  login: string;
  password: string;
};

const isApiError = (x: unknown): x is AfinzApiError => {
  return typeof x === "object" && x !== null && "status" in x && "message" in x;
};

describe("AuthService", () => {
  let httpClient: jest.Mocked<Pick<HttpClient, "post">>;
  let service: AuthService;
  const doc = "12345678909";

  beforeEach(() => {
    httpClient = { post: jest.fn() } as jest.Mocked<Pick<HttpClient, "post">>;
    service = new AuthService(httpClient as unknown as HttpClient);
    jest.clearAllMocks();
  });

  describe("firstAccess", () => {
    it("deve retornar dados no sucesso", async () => {
      const payload = { ok: true };
      httpClient.post.mockResolvedValueOnce({ data: payload });

      const res = await service.firstAccess({ document: doc });

      expect(res).toEqual(payload);
      expect(httpClient.post).toHaveBeenCalledWith("/auth/first-access", {
        document: { kind: "CPF", value: doc },
        channel: "PORTAL_INVESTIDOR",
        login: doc,
      } as FirstAccessBody);
    });

    it("deve repassar AfinzApiError quando lançado", async () => {
      const apiErr = new AfinzApiError({ status: 400, message: "erro" });
      httpClient.post.mockRejectedValueOnce(apiErr);

      const res = await service.firstAccess({ document: doc });
      expect(res).toBe(apiErr);
    });

    it("deve mapear Error genérico para AfinzApiError 500 (com message)", async () => {
      httpClient.post.mockRejectedValueOnce(new Error("falha"));

      const res = await service.firstAccess({ document: doc });

      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.status).toBe(500);
        expect(res.message).toBe("falha");
      }
    });

    it("deve enviar o body correto (valores específicos)", async () => {
      httpClient.post.mockResolvedValueOnce({ data: { ok: true } });

      await service.firstAccess({ document: doc });

      const [path, body] = httpClient.post.mock.calls[0] as [
        string,
        FirstAccessBody,
      ];
      expect(path).toBe("/auth/first-access");
      expect(body.document.kind).toBe("CPF");
      expect(body.document.value).toBe(doc);
      expect(body.login).toBe(doc);
      expect(body.channel).toBe("PORTAL_INVESTIDOR");
    });
  });

  describe("sendOtp", () => {
    it("deve retornar dados no sucesso", async () => {
      const payload = { ok: true };
      httpClient.post.mockResolvedValueOnce({ data: payload });

      const res = await service.sendOtp({ document: doc });

      expect(res).toEqual(payload);
      expect(httpClient.post).toHaveBeenCalledWith("/auth/otp/send", {
        purpose: "PASSWORD_RESET",
        login: doc,
        delivery: "EMAIL",
        channel: "PORTAL_INVESTIDOR",
      } as SendOtpBody);
    });

    it("deve repassar AfinzApiError quando lançado", async () => {
      const apiErr = new AfinzApiError({ status: 429, message: "rate" });
      httpClient.post.mockRejectedValueOnce(apiErr);

      const res = await service.sendOtp({ document: doc });
      expect(res).toBe(apiErr);
    });

    it("deve mapear Error genérico para AfinzApiError", async () => {
      httpClient.post.mockRejectedValueOnce(new Error("xpto"));

      const res = await service.sendOtp({ document: doc });

      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.status).toBe(500);
        expect(res.message).toBe("xpto");
      }
    });

    it("deve validar delivery/purpose/channel", async () => {
      httpClient.post.mockResolvedValueOnce({ data: { ok: true } });

      await service.sendOtp({ document: doc });

      const [, body] = httpClient.post.mock.calls[0] as [string, SendOtpBody];
      expect(body.delivery).toBe("EMAIL");
      expect(body.purpose).toBe("PASSWORD_RESET");
      expect(body.channel).toBe("PORTAL_INVESTIDOR");
    });
  });

  describe("verifyOtp", () => {
    const req: VerifyOtpBody = { challenge_id: "ch_1", code: "123456" };

    it("deve retornar dados no sucesso", async () => {
      const payload = { ok: true, reset_token: "rt" };
      httpClient.post.mockResolvedValueOnce({ data: payload });

      const res = await service.verifyOtp(req);

      expect(res).toEqual(payload);
      expect(httpClient.post).toHaveBeenCalledWith("/auth/otp/verify", req);
    });

    it("deve repassar AfinzApiError quando lançado", async () => {
      const apiErr = new AfinzApiError({ status: 401, message: "invalid" });
      httpClient.post.mockRejectedValueOnce(apiErr);

      const res = await service.verifyOtp(req);
      expect(res).toBe(apiErr);
    });

    it("deve mapear Error genérico para AfinzApiError 500", async () => {
      httpClient.post.mockRejectedValueOnce(new Error("boom"));

      const res = await service.verifyOtp(req);

      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.status).toBe(500);
        expect(res.message).toBe("boom");
      }
    });

    it("deve enviar challenge_id e code corretamente", async () => {
      httpClient.post.mockResolvedValueOnce({ data: { ok: true } });

      await service.verifyOtp(req);

      const [, body] = httpClient.post.mock.calls[0] as [string, VerifyOtpBody];
      expect(body.challenge_id).toBe("ch_1");
      expect(body.code).toBe("123456");
    });
  });

  describe("resetPassword", () => {
    const req: ResetPasswordBody = {
      reset_token: "rt_1",
      new_password: "S3nh@",
    };

    it("deve retornar dados no sucesso", async () => {
      const payload = { ok: true };
      httpClient.post.mockResolvedValueOnce({ data: payload });

      const res = await service.resetPassword(req);

      expect(res).toEqual(payload);
      expect(httpClient.post).toHaveBeenCalledWith("/auth/password/reset", req);
    });

    it("deve repassar AfinzApiError quando lançado", async () => {
      const apiErr = new AfinzApiError({ status: 400, message: "weak" });
      httpClient.post.mockRejectedValueOnce(apiErr);

      const res = await service.resetPassword(req);
      expect(res).toBe(apiErr);
    });

    it("deve mapear Error genérico para AfinzApiError 500", async () => {
      httpClient.post.mockRejectedValueOnce(new Error("oops"));

      const res = await service.resetPassword(req);

      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.status).toBe(500);
        expect(res.message).toBe("oops");
      }
    });

    it("deve enviar reset_token e new_password corretamente", async () => {
      httpClient.post.mockResolvedValueOnce({ data: { ok: true } });

      await service.resetPassword(req);

      const [, body] = httpClient.post.mock.calls[0] as [
        string,
        ResetPasswordBody,
      ];
      expect(body.reset_token).toBe("rt_1");
      expect(body.new_password).toBe("S3nh@");
    });
  });

  describe("login", () => {
    const req: LoginBody = { login: "user", password: "pass" };

    it("deve retornar dados no sucesso", async () => {
      const payload = { token: "jwt" };
      httpClient.post.mockResolvedValueOnce({ data: payload });

      const res = await service.login(req);

      expect(res).toEqual(payload);
      expect(httpClient.post).toHaveBeenCalledWith("/auth/login", req, {
        withCredentials: true,
      });
    });

    it("deve repassar AfinzApiError quando lançado", async () => {
      const apiErr = new AfinzApiError({
        status: 401,
        message: "unauthorized",
      });
      httpClient.post.mockRejectedValueOnce(apiErr);

      const res = await service.login(req);
      expect(res).toBe(apiErr);
    });

    it("deve mapear Error genérico para AfinzApiError 500", async () => {
      httpClient.post.mockRejectedValueOnce(new Error("timeout"));

      const res = await service.login(req);

      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.status).toBe(500);
        expect(res.message).toBe("timeout");
      }
    });

    it("deve enviar login e password corretamente", async () => {
      httpClient.post.mockResolvedValueOnce({ data: { ok: true } });

      await service.login(req);

      const [, body] = httpClient.post.mock.calls[0] as [string, LoginBody];
      expect(body.login).toBe("user");
      expect(body.password).toBe("pass");
    });
  });

  describe("contrato geral", () => {
    it("deve chamar endpoints corretos em sequência", async () => {
      httpClient.post
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: {} });

      await service.firstAccess({ document: doc });
      await service.sendOtp({ document: doc });
      await service.verifyOtp({ challenge_id: "a", code: "1" });
      await service.resetPassword({ reset_token: "r", new_password: "p" });
      await service.login({ login: "l", password: "p" });

      expect(httpClient.post.mock.calls.map((c) => c[0])).toEqual([
        "/auth/first-access",
        "/auth/otp/send",
        "/auth/otp/verify",
        "/auth/password/reset",
        "/auth/login",
      ]);
    });

    it("não deve mutar o objeto data retornado", async () => {
      const data = { nested: { a: 1 }, array: [1, 2, 3] };
      httpClient.post.mockResolvedValueOnce({ data });

      const res = await service.firstAccess({ document: doc });
      expect(res).toBe(data);
      expect(res).toEqual({ nested: { a: 1 }, array: [1, 2, 3] });
    });
  });
});
