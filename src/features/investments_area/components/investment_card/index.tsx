import { AfinzDivider } from "@afinz/design-system";
import styles from "./style.module.scss";

type InvestimentsCardProps = {
  title: string;
  children: React.ReactNode;
};

export function InvestimentsCard({ title, children }: InvestimentsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span>{title}</span>
      </div>
      <AfinzDivider color="lightGrey" />
      <div className={styles.options}>{children}</div>
    </div>
  );
}
