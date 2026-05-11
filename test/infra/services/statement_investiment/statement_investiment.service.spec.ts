import { FinancialInvestmentsService } from "../../../../src/infra/services/statement_investment/statement_investiment.service";

// Importa HttpClient apenas como tipo
import type { HttpClient } from "@afinz/rest-client";
import { AfinzApiError } from "@afinz/rest-client";
import {
  ReportFinancialIncomePDFRequest,
  ReportFinancialIncomeResponse,
} from "../../../../src/features/investments_area/models/report_financial_income_api.model";
import {
  StatementApplicationsRequest,
  StatementApplicationsResponse,
} from "../../../../src/features/investments_area/models/statement_applications_api.model";
import { StatementInvestmentResponse } from "../../../../src/features/investments_area/models/statement_investments_api.model";

// Mock do módulo (somente AfinzApiError precisa existir em runtime)
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

// Mock do model
jest.mock(
  "../../../../src/features/investments_area/models/investment_position.model",
  () => ({
    InvestmentPositionModel: {
      fromJson: jest.fn((data) => data.items || []),
    },
  }),
);

const { InvestmentPositionModel } = jest.requireMock(
  "../../../../src/features/investments_area/models/investment_position.model",
);

const isApiError = (x: unknown): x is AfinzApiError =>
  typeof x === "object" && x !== null && "status" in x && "message" in x;

describe("FinancialInvestmentsService", () => {
  let httpClient: jest.Mocked<Pick<HttpClient, "get">>;
  let service: FinancialInvestmentsService;

  beforeEach(() => {
    httpClient = { get: jest.fn() } as jest.Mocked<Pick<HttpClient, "get">>;
    service = new FinancialInvestmentsService(
      httpClient as unknown as HttpClient,
    );
    jest.clearAllMocks();
  });

  describe("statementApplications", () => {
    const req: StatementApplicationsRequest = {
      dateIn: "2024-01-01",
      dateOut: "2024-01-31",
    };

    it("deve retornar dados no sucesso", async () => {
      const payload: StatementApplicationsResponse = {
        products: [{ indexer: "CDI", productDetails: [] }],
      };
      httpClient.get.mockResolvedValueOnce({ data: payload });

      const res = await service.statementApplications(req);

      expect(res).toEqual(payload);
      expect(httpClient.get).toHaveBeenCalledWith("/statements", {
        params: { startDate: "2024-01-01", endDate: "2024-01-31" },
        withCredentials: true,
      });
    });

    it("deve lançar erro se data estiver vazia", async () => {
      httpClient.get.mockResolvedValueOnce({ data: undefined });

      const res = await service.statementApplications(req);
      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.message).toContain("extrato de aplicações");
      }
    });

    it("deve repassar AfinzApiError", async () => {
      const apiErr = new AfinzApiError({ status: 400, message: "erro api" });
      httpClient.get.mockRejectedValueOnce(apiErr);

      const res = await service.statementApplications(req);
      expect(res).toBe(apiErr);
    });

    it("deve mapear erro genérico para AfinzApiError", async () => {
      httpClient.get.mockRejectedValueOnce(new Error("timeout"));

      const res = await service.statementApplications(req);
      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.status).toBe(500);
        expect(res.message).toBe("timeout");
      }
    });

    it("deve mapear erro desconhecido para AfinzApiError padrão", async () => {
      httpClient.get.mockRejectedValueOnce("falha");

      const res = await service.statementApplications(req);
      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.message).toContain(
          "Erro desconhecido ao buscar extrato de aplicações",
        );
      }
    });
  });

  describe("statementInvestment", () => {
    const req: StatementApplicationsRequest = {
      dateIn: "2024-05-10",
      dateOut: "2024-05-20",
      page: 2,
    };

    it("deve retornar InvestmentPosition[] no sucesso", async () => {
      const payload: StatementInvestmentResponse = {
        items: [],
      };

      httpClient.get.mockResolvedValueOnce({ data: payload });

      const res = await service.statementInvestment(req);

      expect(InvestmentPositionModel.fromJson).toHaveBeenCalledWith(payload);
      expect(res).toEqual(payload.items);
      expect(httpClient.get).toHaveBeenCalledWith("/user-positions", {
        params: { date: "2024-05-10", page: 2, size: 100 },
        withCredentials: true,
      });
    });

    it("deve lançar AfinzApiError se data vazia", async () => {
      httpClient.get.mockResolvedValueOnce({ data: undefined });

      const res = await service.statementInvestment(req);
      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.message).toContain(
          "Erro desconhecido ao buscar extrato de investimentos",
        );
      }
    });

    it("deve repassar AfinzApiError", async () => {
      const apiErr = new AfinzApiError({
        status: 404,
        message: "não encontrado",
      });
      httpClient.get.mockRejectedValueOnce(apiErr);

      const res = await service.statementInvestment(req);
      expect(res).toBe(apiErr);
    });

    it("deve mapear erro genérico para AfinzApiError", async () => {
      httpClient.get.mockRejectedValueOnce(new Error("erro interno"));

      const res = await service.statementInvestment(req);
      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.message).toBe("erro interno");
      }
    });

    it("deve mapear erro desconhecido para AfinzApiError padrão", async () => {
      httpClient.get.mockRejectedValueOnce("bad");

      const res = await service.statementInvestment(req);
      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.message).toContain(
          "Erro desconhecido ao buscar extrato de investimentos",
        );
      }
    });
  });

  describe("reportFinancialIncomePDF", () => {
    const req: ReportFinancialIncomePDFRequest = { year: "2023" };

    it("deve retornar PDF string no sucesso", async () => {
      const payload: ReportFinancialIncomeResponse = {
        listReleases: {
          company: 1,
          endDate: "2023-12-31",
          incomeReportPDF: "base64pdfdata",
          startDate: "2023-01-01",
        },
      };

      httpClient.get.mockResolvedValueOnce({ data: payload });

      const res = await service.reportFinancialIncomePDF(req);

      expect(res).toBe("base64pdfdata");
      expect(httpClient.get).toHaveBeenCalledWith("/financial-income", {
        params: { year: "2023" },
        withCredentials: true,
      });
    });

    it("deve repassar AfinzApiError", async () => {
      const apiErr = new AfinzApiError({ status: 500, message: "erro pdf" });
      httpClient.get.mockRejectedValueOnce(apiErr);

      const res = await service.reportFinancialIncomePDF(req);
      expect(res).toBe(apiErr);
    });

    it("deve mapear erro genérico para AfinzApiError", async () => {
      httpClient.get.mockRejectedValueOnce(new Error("falha de rede"));

      const res = await service.reportFinancialIncomePDF(req);
      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.message).toBe("falha de rede");
      }
    });

    it("deve mapear erro desconhecido para AfinzApiError padrão", async () => {
      httpClient.get.mockRejectedValueOnce("unknown");

      const res = await service.reportFinancialIncomePDF(req);
      expect(isApiError(res)).toBe(true);
      if (isApiError(res)) {
        expect(res.message).toContain(
          "Erro desconhecido ao gerar relatório de rendimentos financeiros",
        );
      }
    });
  });
});
