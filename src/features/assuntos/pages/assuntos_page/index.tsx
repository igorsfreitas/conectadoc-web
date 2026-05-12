import { useAssuntosViewModel } from '../../use_assuntos.view-model';
import { Pagination } from '../../../../infra/components/pagination';

export function AssuntosPage() {
  const { data, loading, error, columns, page, totalPages, total, limit, goToPage } = useAssuntosViewModel();

  return (
    <div className="content-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assuntos</h1>
          <p className="page-subtitle">Tabela de assuntos documentais</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, color: 'var(--danger-500)', fontSize: 13 }}>{error}</div>
      )}

      <div className="card">
        <table className="data">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={{ width: col.width, textAlign: col.align ?? 'left' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key}>
                      <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '70%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="empty-state">Nenhum registro encontrado.</td></tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.codigo}>
                  {columns.map(col => (
                    <td key={col.key} style={{ textAlign: col.align ?? 'left' }}
                        className={col.monospace ? 'num' : undefined}>
                      {col.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={goToPage}
        />
      </div>
    </div>
  );
}
