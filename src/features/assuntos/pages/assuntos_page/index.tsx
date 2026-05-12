import { DataTable } from '../../../../infra/components/data_table';
import { useAssuntosViewModel } from '../../use_assuntos.view-model';
import styles from './style.module.scss';

export function AssuntosPage() {
  const { data, loading, error, columns } = useAssuntosViewModel();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Assuntos</h1>
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
