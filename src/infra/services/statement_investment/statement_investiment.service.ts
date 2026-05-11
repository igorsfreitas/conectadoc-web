import { AfinzApiError, HttpClient } from "@afinz/rest-client";
import {
  InvestmentPosition,
  InvestmentPositionModel,
} from "../../../features/investments_area/models/investment_position.model";
import {
  ReportFinancialIncomePDFRequest,
  ReportFinancialIncomeResponse,
} from "../../../features/investments_area/models/report_financial_income_api.model";
import {
  StatementApplicationsRequest,
  StatementApplicationsResponse,
} from "../../../features/investments_area/models/statement_applications_api.model";
import { StatementInvestmentResponse } from "../../../features/investments_area/models/statement_investments_api.model";

export class FinancialInvestmentsService {
  constructor(private readonly httpClient: HttpClient) {}

  async statementApplications(
    params: StatementApplicationsRequest,
  ): Promise<StatementApplicationsResponse | AfinzApiError> {
    try {
      const response = await this.httpClient.get<StatementApplicationsResponse>(
        `/statements`,
        {
          params: {
            startDate: params.dateIn,
            endDate: params.dateOut,
          },
          withCredentials: true,
        },
      );

      if (!response.data) {
        throw new AfinzApiError({
          status: 500,
          message: "Erro desconhecido ao buscar extrato de aplicações",
        });
      }

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
            : "Erro desconhecido ao buscar extrato de aplicações",
      });
    }
  }

  async statementApplicationsDownload(
    params: StatementApplicationsRequest,
  ): Promise<StatementApplicationsResponse | AfinzApiError> {
    try {
      const response = await this.httpClient.get<StatementApplicationsResponse>(
        `/statements/download`,
        {
          params: {
            startDate: params.dateIn,
            endDate: params.dateOut,
          },
          withCredentials: true,
        },
      );

      if (!response.data) {
        throw new AfinzApiError({
          status: 500,
          message: "Erro desconhecido ao buscar extrato de aplicações",
        });
      }

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
            : "Erro desconhecido ao buscar extrato de aplicações",
      });
    }
  }

  async statementInvestment(
    params: StatementApplicationsRequest,
  ): Promise<InvestmentPosition[] | AfinzApiError> {
    try {
      const response = await this.httpClient.get<StatementInvestmentResponse>(
        `/user-positions`,
        {
          params: {
            date: params.dateIn,
            page: params.page ?? 1,
            size: 100,
          },
          withCredentials: true,
        },
      );

      if (!response.data) {
        throw new AfinzApiError({
          status: 500,
          message: "Erro desconhecido ao buscar extrato de investimentos",
        });
      }

      return InvestmentPositionModel.fromJson(response.data);
    } catch (error: unknown) {
      if (error instanceof AfinzApiError) {
        return error;
      }
      return new AfinzApiError({
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar extrato de investimentos",
      });
    }
  }

  async reportFinancialIncomePDF(
    params: ReportFinancialIncomePDFRequest,
  ): Promise<string | AfinzApiError> {
    try {
      const response = await this.httpClient.get<ReportFinancialIncomeResponse>(
        `/financial-income`,
        {
          params: {
            year: params.year,
          },
          withCredentials: true,
        },
      );

      return response.data.listReleases.incomeReportPDF;
    } catch (error: unknown) {
      if (error instanceof AfinzApiError) {
        return error;
      }
      return new AfinzApiError({
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao gerar relatório de rendimentos financeiros",
      });
    }
  }

  async downloadPositionPDF(
    params: StatementApplicationsRequest,
  ): Promise<string | AfinzApiError> {
    try {
      const response = await this.httpClient.get<{
        file: string;
      }>(`/user-positions/download`, {
        params: {
          date: params.dateIn,
          page: params.page ?? 1,
          size: 100,
        },
        withCredentials: true,
      });

      if (!response.data) {
        throw new AfinzApiError({
          status: 500,
          message: "Erro: Resposta vazia ao tentar baixar o PDF de posições.",
        });
      }

      return response.data.file;
    } catch (error: unknown) {
      if (error instanceof AfinzApiError) {
        return error;
      }
      return new AfinzApiError({
        status: 500,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao baixar PDF de posições.",
      });
    }
  }

  async downloadStatementPDF(
    params: StatementApplicationsRequest,
  ): Promise<string | AfinzApiError> {
    try {
      const response = await this.httpClient.get<{
        file: string;
      }>(`/statements/download`, {
        params: { startDate: params.dateIn, endDate: params.dateOut },
        withCredentials: true,
      });
      return response.data.file;
    } catch (error) {
      if (error instanceof AfinzApiError) return error;

      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao baixar PDF de extrato.";

      return new AfinzApiError({ status: 500, message });
    }
  }
}
