import { AfinzClose } from "@afinz/design-system";
import styles from "./style.module.scss";

export function HelpContent({ onClickClose }: { onClickClose: () => void }) {
  return (
    <div className={styles.help}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.title}>
              <h6>Você ficou com alguma dúvida?</h6>
              <div onClick={onClickClose}>
                <AfinzClose />
              </div>
            </div>
            <p className={`paragraph small ${styles.label}`}>
              Dúvidas sobre investimento na Afinz? Entre em contato com nossa
              central de atendimento
            </p>
          </div>
          <div className={styles.contacts}>
            <div className={styles.body}>
              <div className={styles.textContent}>
                <p className={"small"}>Chat investimentos (Whatsapp)</p>
                <span>(15) 99652-3441</span>
              </div>
              <div className={styles.textContent}>
                <p className={"small"}>
                  Central de relacionamento Pessoa Física (Whatsapp)
                </p>
                <span>(11) 4090-1730</span>
              </div>
              <div className={styles.textContent}>
                <p className={"small"}>
                  Central de relacionamento Pessoa Jurídica
                </p>
                <span>0800 771 76 22</span>
              </div>
              <div className={styles.textContent}>
                <p className={"small"}>E-mail</p>
                <span>investimentos@afinz.com.br</span>
              </div>

              <p className="small">
                A nossa central de atendimento funciona das 09h00 às 17h00, de
                segunda a sexta-feira, exceto feriados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
