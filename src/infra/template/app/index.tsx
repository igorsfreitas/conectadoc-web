import styles from "./style.module.scss";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <main className={styles.appLayout}>
        <header>
          <div className={styles.logoCenter}>
            <h5>ConectaDoc</h5>
          </div>
        </header>
        <div className={styles.innerContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
