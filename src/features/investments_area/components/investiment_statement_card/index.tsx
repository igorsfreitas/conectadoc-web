import { AfinzDateUtil, AfinzNumberUtil } from "@afinz/utils";
import { useMemo, useState } from "react";
import {
  dateSortKey,
  toLocalDateOnly,
} from "../../../../infra/utils/afinz_locale_utils";
import { Product } from "../../models/statement_applications_api.model";
import styles from "./styles.module.scss";

type TransactionType = {
  date: string;
  previousBalance: number;
  application: number;
  yield: number;
  redemption: number;
  finalBalance: number;
  incomeTax: number;
};

export const InvestmentStatementCard = ({ product }: { product: Product }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mapTituloToTransactions = (product: Product): TransactionType[] => {
    return product.productDetails
      .filter(
        (item) =>
          Number(item.previousBalance) !== 0 ||
          Number(item.applicationValue) !== 0 ||
          Number(item.yieldValue) !== 0 ||
          Number(item.redemptionValue) !== 0 ||
          Number(item.finalBalance) !== 0,
      )
      .map((item) => ({
        date: item.date,
        previousBalance: item.previousBalance,
        incomeTax: item.incomeTax,
        application: item.applicationValue,
        yield: item.yieldValue,
        redemption: item.redemptionValue,
        finalBalance: item.finalBalance,
      }));
  };

  const transactions = mapTituloToTransactions(product);

  const sortedTransactions = [...transactions].sort(
    (a, b) => dateSortKey(a.date) - dateSortKey(b.date),
  );

  const totals = useMemo(() => {
    if (sortedTransactions.length === 0) {
      return {
        previousBalance: 0,
        finalBalance: 0,
        application: 0,
        yield: 0,
        redemption: 0,
        days: 0,
      };
    }

    const first = sortedTransactions[0];
    const last = sortedTransactions[sortedTransactions.length - 1];

    const firstDayKey = dateSortKey(first.date);
    const lastDayKey = dateSortKey(last.date);

    const firstDayTransactions = sortedTransactions.filter(
      (t) => dateSortKey(t.date) === firstDayKey,
    );

    const lastDayTransactions = sortedTransactions.filter(
      (t) => dateSortKey(t.date) === lastDayKey,
    );

    const movements = sortedTransactions.reduce(
      (out, t) => {
        out.application += Number(t.application) || 0;
        out.yield += Number(t.yield) || 0;
        out.redemption += Number(t.redemption) || 0;
        return out;
      },
      { application: 0, yield: 0, redemption: 0 },
    );

    const firstDayPrevSum = firstDayTransactions.reduce(
      (sum, t) => sum + (Number(t.previousBalance) || 0),
      0,
    );

    const firstDayRed = firstDayTransactions.reduce(
      (sum, t) =>
        sum +
        ((Number(t.previousBalance) || 0) > 0 ? Number(t.redemption) || 0 : 0),
      0,
    );

    const firstDayApp = firstDayTransactions.reduce(
      (sum, t) =>
        sum +
        ((Number(t.previousBalance) || 0) > 0 ? Number(t.application) || 0 : 0),
      0,
    );

    const lastDayFinalSum = lastDayTransactions.reduce(
      (sum, t) => sum + (Number(t.finalBalance) || 0),
      0,
    );

    return {
      previousBalance: firstDayPrevSum + firstDayApp - firstDayRed,
      finalBalance: lastDayFinalSum,
      ...movements,
      days: sortedTransactions.length,
    };
  }, [sortedTransactions]);

  const calculateDailyAvgYield = () => {
    const totalDias = transactions.length;
    if (totalDias === 0) return 0;
    return totals.yield / totalDias;
  };

  const calculateYieldPercentage = () => {
    if (!totals.previousBalance) return 0;
    return (totals.yield / totals.previousBalance) * 100;
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.investmentCard}>
      <div className={styles.header} onClick={toggleExpand}>
        <div className={styles.titleContainer}>
          <span
            className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ""}`}
          >
            ▼
          </span>
          <h3 className={styles.title}>{product.indexer}</h3>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className={styles.summaryContainer}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Saldo Inicial</span>
              <span className={styles.summaryValue}>
                {AfinzNumberUtil.toMoneyFormat(totals.previousBalance)}
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Rendimento Total</span>
              <span className={styles.summaryValue}>
                {AfinzNumberUtil.toMoneyFormat(totals.yield)}
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>
                Rendimento Diário Médio
              </span>
              <span className={styles.summaryValue}>
                {AfinzNumberUtil.toMoneyFormat(calculateDailyAvgYield())}
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Saldo Final</span>
              <span className={styles.summaryValue}>
                {AfinzNumberUtil.toMoneyFormat(totals.finalBalance)}
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Rentabilidade</span>
              <span
                className={`${styles.summaryValue} ${
                  calculateYieldPercentage() >= 0
                    ? styles.positive
                    : styles.negative
                }`}
              >
                {calculateYieldPercentage() >= 0 ? "+" : ""}
                {calculateYieldPercentage().toFixed(2).replace(".", ",")}%
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Dias no Período</span>
              <span className={styles.summaryValue}>{transactions.length}</span>
            </div>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.transactionsTable}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Saldo Anterior</th>
                  <th>Aplicação</th>
                  <th>Rendimento</th>
                  <th>Resg/Rep. Juros</th>
                  <th>Taxa IR</th>
                  <th>Saldo Final</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td>
                      {AfinzDateUtil.formatDate(
                        toLocalDateOnly(transaction.date),
                      )}
                    </td>
                    <td>
                      {AfinzNumberUtil.toMoneyFormat(
                        transaction.previousBalance,
                      )}
                    </td>
                    <td>
                      {AfinzNumberUtil.toMoneyFormat(transaction.application)}
                    </td>
                    <td
                      className={`${styles.yieldColumn} ${transaction.yield < 0 && styles.negative}`}
                    >
                      {AfinzNumberUtil.toMoneyFormat(transaction.yield)}
                    </td>
                    <td>
                      {AfinzNumberUtil.toMoneyFormat(transaction.redemption)}
                    </td>
                    <td>
                      {AfinzNumberUtil.toMoneyFormat(transaction.incomeTax)}
                    </td>
                    <td>
                      {AfinzNumberUtil.toMoneyFormat(transaction.finalBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
