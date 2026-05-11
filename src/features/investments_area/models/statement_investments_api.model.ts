export interface StatementInvestmentResponse {
  items: Data[];
}

interface Data {
  code: number;
  startDate: string;
  maturityDate: string;
  product: string;
  productDescription: string;
  indexer: string;
  indexerPercentage: number;
  rate: number;
  initialValue: number;
  grossValue: number;
  netValue: number;
  iofValue: number;
  incomeTaxValue: number;
  dailyNetYieldValue: number;
  totalYieldValue: number;
  paidNetYieldValue: number;
}

export interface StatementInvestmentPDFResponse {
  data: DataPDF;
}

interface DataPDF {
  extratoInvestimentoPDF: string;
}
