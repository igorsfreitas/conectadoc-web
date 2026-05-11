export interface StatementApplicationsResponse {
  products: Product[];
}

export interface Product {
  indexer: string;
  productDetails: ProductDetail[];
}

export interface ProductDetail {
  product: string;
  productDescription: string;
  date: string;
  indexer: string;
  previousBalance: number;
  applicationValue: number;
  yieldValue: number;
  incomeTax: number;
  iofTax: number;
  redemptionValue: number;
  redemptionDifferenceValue: number;
  rate: number;
  blockedValue: number;
  availableValue: number;
  finalBalance: number;
}

export interface StatementApplicationsRequest {
  name?: string;
  dateIn: string;
  dateOut: string;
  page?: number;
}

export interface StatementApplicationsPDFResponse {
  data: DataPDF;
}

interface DataPDF {
  extratoAplicacaoPDF: string;
}
