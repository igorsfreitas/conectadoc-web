import { AfinzButton, AfinzHelpOutlineIcon } from "@afinz/design-system";
import styles from "./styles.module.scss";

type InvestimentsHeaderProps = {
  onHelpClick: () => void;
};

export function InvestimentsHeader({ onHelpClick }: InvestimentsHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerTitles}>
          <h6>Área de Investimentos</h6>
          <span className="subtitle-primary">
            Invista com segurança, acompanhe seus investimentos a qualquer
            momento e faça seu dinheiro render com praticidade e taxas
            competitivas.
          </span>
        </div>
        <div className={styles.headerHelp}>
          <AfinzButton
            leadingIcon={<AfinzHelpOutlineIcon />}
            size="medium"
            type="text"
            onClick={onHelpClick}
          >
            Ajuda
          </AfinzButton>
        </div>
      </div>
    </header>
  );
}
