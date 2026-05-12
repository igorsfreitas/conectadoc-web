import { DataTable } from '../../../../infra/components/data_table';
import { useHierarquiaViewModel } from '../../use_hierarquia.view-model';
import styles from './style.module.scss';

export function HierarquiaPage() {
  const { data, loading, error, columns } = useHierarquiaViewModel();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Hierarquias</h1>
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
