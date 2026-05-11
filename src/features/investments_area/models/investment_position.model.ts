import { AfinzDateUtil } from "@afinz/utils";
import { StatementInvestmentResponse } from "./statement_investments_api.model";
import { toLocalDateOnly } from "../../../infra/utils/afinz_locale_utils";

export interface InvestmentPosition {
  id: string;
  description: string;
  index: string;
  indexPercentage: number;
  rate: number;
  startDate: string;
  endDate: string;
  initialValue: number;
  incomeValue: number;
  grossValue: number;
  iofValue: number;
  irfValue: number;
  netValue: number;
}

export class InvestmentPositionModel {
  constructor(
    public id: string,
    public description: string,
    public index: string,
    public indexPercentage: number,
    public rate: number,
    public startDate: string,
    public endDate: string,
    public initialValue: number,
    public incomeValue: number,
    public grossValue: number,
    public iofValue: number,
    public irfValue: number,
    public netValue: number,
  ) {}

  static fromJson(
    json: StatementInvestmentResponse,
  ): InvestmentPositionModel[] {
    if (!json?.items?.length) return [];

    return json.items.map((it) => {
      const id = String(it.code);
      const description = `${it.product}`;
      const index = it.indexer ?? "";
      const indexPercentage = Number(it.indexerPercentage ?? 0);
      const rate = Number(it.rate ?? 0);
      const startDate = AfinzDateUtil.formatDate(toLocalDateOnly(it.startDate));
      const endDate = AfinzDateUtil.formatDate(
        toLocalDateOnly(it.maturityDate),
      );
      const initialValue = Number(it.initialValue ?? 0);
      const incomeValue = Number(it.totalYieldValue ?? 0);
      const grossValue = Number(it.grossValue ?? 0);
      const iofValue = Number(it.iofValue ?? 0);
      const irfValue = Number(it.incomeTaxValue ?? 0);
      const netValue = Number(it.netValue ?? 0);

      return new InvestmentPositionModel(
        id,
        description,
        index,
        indexPercentage,
        rate,
        startDate,
        endDate,
        initialValue,
        incomeValue,
        grossValue,
        iofValue,
        irfValue,
        netValue,
      );
    });
  }
}
