import { AfinzButton } from "@afinz/design-system";
import React from "react";
import styles from "./style.module.scss";

type Action = {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  type?: "primary" | "text" | "secondary";
};

export interface EmptyStateProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  primaryAction?: Action;
  secondaryAction?: Action;
  useContainer?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Nenhum resultado encontrado",
  description,
  primaryAction,
  secondaryAction,
  useContainer = true,
  className,
}) => {
  const rootClass = `${useContainer ? styles.tableContainer : ""} ${
    styles.emptyState
  } ${className ?? ""}`.trim();

  return (
    <div className={rootClass} aria-live="polite">
      <div className={styles.emptyStateContent}>
        {title && <h3 className={styles.emptyTitle}>{title}</h3>}

        {description && <p className={styles.emptyText}>{description}</p>}

        {(primaryAction || secondaryAction) && (
          <div className={styles.emptyActions}>
            {primaryAction && (
              <AfinzButton
                type={primaryAction.type ?? "primary"}
                onClick={primaryAction.onClick}
                isLoading={primaryAction.isLoading}
              >
                {primaryAction.label}
              </AfinzButton>
            )}

            {secondaryAction && (
              <AfinzButton
                type={secondaryAction.type ?? "text"}
                onClick={secondaryAction.onClick}
                isLoading={secondaryAction.isLoading}
              >
                {secondaryAction.label}
              </AfinzButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
