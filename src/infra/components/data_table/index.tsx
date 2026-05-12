import React from "react";
import styles from "./style.module.scss";

// ── Column definition ─────────────────────────────────────────────────────

export type ColumnDef<T> = {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  /** Renderiza em JetBrains Mono — usar para IDs e códigos. */
  monospace?: boolean;
  width?: string | number;
};

// ── Props ─────────────────────────────────────────────────────────────────

export type DataTableProps<T extends object> = {
  columns: ColumnDef<T>[];
  data: T[];
  /** Chave única por linha para o atributo `key` do React. */
  keyExtractor: (row: T, index: number) => string | number;
  loading?: boolean;
  /** Número de linhas skeleton exibidas durante o loading. */
  loadingRows?: number;
  /** Slot exibido quando `!loading && data.length === 0`. */
  emptyState?: React.ReactNode;
  /** Callback disparado ao clicar em uma linha. */
  onRowClick?: (row: T) => void;
  /** Texto alternativo para leitores de tela (caption). */
  caption?: string;
};

// ── Component ─────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  columns,
  data,
  keyExtractor,
  loading = false,
  loadingRows = 5,
  emptyState,
  onRowClick,
  caption,
}: DataTableProps<T>) {
  const isEmpty = !loading && data.length === 0;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        {caption && <caption className={styles.caption}>{caption}</caption>}

        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align ?? "left" }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading
            ? Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={`skeleton-${i}`} className={styles.skeleton}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <span className={styles.skeletonCell} />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row, index) => (
                <tr
                  key={keyExtractor(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? styles.clickable : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align ?? "left" }}
                      className={col.monospace ? styles.mono : undefined}
                    >
                      {col.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>

      {isEmpty && (
        <div className={styles.emptySlot}>
          {emptyState ?? (
            <p className={styles.emptyDefault}>Nenhum registro encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
