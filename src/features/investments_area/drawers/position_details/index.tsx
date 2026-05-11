import { AfinzClose, AfinzDivider, AfinzTopMenu } from "@afinz/design-system";
import styles from "./styles.module.scss";

interface Props {
  onClickClose: VoidFunction;
}

export function AfinzPositionDetailsDrawer({ onClickClose }: Props) {
  const dateAndHour = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const TABLE_COLUMNS = [
    { title: "Código Título", key: "CDB2252AIIN" },
    { title: "Modalidade", key: "CDB DI / CDB DI" },
    { title: "Tipo Taxa", key: "OVER ANO" },
    { title: "Emissão", key: "05/02/2025" },
    { title: "Prazo Total", key: "1080 dias" },
    { title: "Prazo a Decorrer", key: "1043 dias" },
    { title: "Número Estoque", key: "10000000000000014592" },
    { title: "Quantidade", key: "10.000,00" },
    { title: "Taxa", key: "100,0000%" },
    { title: "Taxa Operação", key: "0,0000" },
    { title: "Vencimento", key: "21/01/2028" },
    { title: "Prazo Decorrido", key: "37 dias" },
    { title: "Data Isenção IOF", key: "07/03/2025" },
  ];

  return (
    <div className={styles.positionDetailsDrawer}>
      <AfinzTopMenu
        trailingIcon={<AfinzClose />}
        trailingFunction={onClickClose}
      />
      <div className={styles.container}>
        <div className={styles.title}>
          <h6>Detalhamento do Título</h6>
        </div>

        <div className={styles.texts}>
          <span className="legend">Cliente</span>
          <h6>GIOVANNI COMUNELLO JUNIOR</h6>
          <span className="legend">atualizado em {dateAndHour}</span>
        </div>

        <div className={styles.box}>
          <div className={styles.boxValues}>
            <div className={styles.cellList}>
              <div className={styles.texts}>
                <p className="paragraph">Valor aplicado:</p>
              </div>
              <div className={styles.slot}>
                <p className="subtitle-secondary">R$ 100,00</p>
              </div>
            </div>
            <div className={styles.cellList}>
              <div className={styles.texts}>
                <p className="paragraph">Valor Curva:</p>
              </div>
              <div className={styles.slot}>
                <p className="subtitle-secondary">R$ 101,23</p>
              </div>
            </div>
            <div className={styles.cellList}>
              <div className={styles.texts}>
                <p className="paragraph">Valor IOF:</p>
              </div>
              <div className={`${styles.slot} ${styles.alert}`}>
                <p className="subtitle-secondary">- R$ 0,00</p>
              </div>
            </div>
            <div className={styles.cellList}>
              <div className={styles.texts}>
                <p className="paragraph">Valor IR:</p>
              </div>
              <div className={`${styles.slot} ${styles.alert}`}>
                <p className="subtitle-secondary">- R$ 0,27</p>
              </div>
            </div>

            <AfinzDivider color="lightGrey" />

            <div className={styles.cellList}>
              <div className={styles.texts}>
                <p className="paragraph">Valor Líquido:</p>
              </div>
              <div className={`${styles.slot} ${styles.success}`}>
                <p className="subtitle-secondary">R$ 100,96</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.box}>
          <div className={styles.boxHeader}>
            <span>Dados do investimento</span>
          </div>

          <div className={styles.boxTable}>
            <div className={styles.boxRow}>
              {TABLE_COLUMNS.map((column, index) => (
                <div className={styles.boxColumn} key={index}>
                  <span className="legend">{column.title}</span>
                  <p>{column.key}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
