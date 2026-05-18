import { DataTable } from '../../../../infra/components/data_table';
import { useTipoInteressadosViewModel } from '../../use_tipoInteressados.view-model';
import styles from './style.module.scss';

export function TipoInteressadosPage() {
  const { data, loading, error, columns } = useTipoInteressadosViewModel();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>TipoInteressados</h1>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.codigo}
        loading={loading}
      />
    </div>
  );
}
