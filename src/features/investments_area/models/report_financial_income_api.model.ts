export interface ReportFinancialIncomeResponse {
  listReleases: ListReleases;
}

interface ListReleases {
  company: number;
  startDate: string;
  endDate: string;
  incomeReportPDF: string;
}

export interface ReportFinancialIncomePDFRequest {
  year: string;
}
