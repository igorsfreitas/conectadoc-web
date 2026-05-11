import { AfinzDivider } from "@afinz/design-system";
import { AfinzNumberUtil } from "@afinz/utils";
import { InvestmentPosition } from "../../../../models/investment_position.model";
import styles from "./style.module.scss";

export function PositionsPdfTable({
  positions,
}: {
  positions?: InvestmentPosition[];
}) {
  return (
    <div className={styles.tableContainer}>
      {positions &&
        positions.map((position) => (
          <>
            <div className={styles.positionHeader}>
              <ul>
                <li>
                  <span>Descrição</span>
                  <span>{position.description}</span>
                </li>
                <li>
                  <span>Index</span>
                  <span>{position.index}</span>
                </li>
                <li>
                  <span>%Index</span>
                  <span>{position.indexPercentage.toFixed(2)}%</span>
                </li>
                <li>
                  <span>Data início</span>
                  <span>{position.startDate}</span>
                </li>
                <li>
                  <span>Data vencimento</span>
                  <span>{position.endDate}</span>
                </li>
              </ul>
            </div>
            <AfinzDivider />
            <ul className={styles.valuesList}>
              <li>
                <span>Taxa:</span> <span>{position.rate.toFixed(2)}</span>
              </li>
              <li>
                <span>Valor Inicial:</span>{" "}
                <span>
                  {AfinzNumberUtil.toMoneyFormat(position.initialValue)}
                </span>
              </li>
              <li>
                <span>Valor Rendimento:</span>{" "}
                <span>
                  {AfinzNumberUtil.toMoneyFormat(position.incomeValue)}
                </span>
              </li>
              <li>
                <span>Valor Bruto:</span>{" "}
                <span>
                  {AfinzNumberUtil.toMoneyFormat(position.grossValue)}
                </span>
              </li>
              <li>
                <span>Valor IOF:</span>{" "}
                <span>{AfinzNumberUtil.toMoneyFormat(position.iofValue)}</span>
              </li>
              <li>
                <span>Valor IRF:</span>{" "}
                <span>{AfinzNumberUtil.toMoneyFormat(position.irfValue)}</span>
              </li>
              <li>
                <span>Valor Líquido:</span>{" "}
                <span>{AfinzNumberUtil.toMoneyFormat(position.netValue)}</span>
              </li>
            </ul>
          </>
        ))}
    </div>
  );
}
