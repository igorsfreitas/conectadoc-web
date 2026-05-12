interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const atFirst = page <= 1;
  const atLast  = page >= totalPages;

  return (
    <div className="pagination">
      <span className="pagination-info">{from}–{to} de {total}</span>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(1)}
          disabled={atFirst}
          title="Primeira página"
        >
          «
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={atFirst}
          title="Página anterior"
        >
          ‹ Anterior
        </button>
        <span className="pagination-page">{page} / {totalPages}</span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={atLast}
          title="Próxima página"
        >
          Próxima ›
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={atLast}
          title="Última página"
        >
          »
        </button>
      </div>
    </div>
  );
}
