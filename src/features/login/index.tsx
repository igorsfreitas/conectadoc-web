import styles from "./style.module.scss";

import { AfinzLogo } from "@afinz/design-system";
import { DocumentStep } from "./components/document_step";
import { LoginManager } from "./contexts/login_context";
import { LoginDrawerStackManager } from "./contexts/login_drawer_stack";
import { FirstAccessModal } from "./dialogs/first_access_modal";

export function Login() {
  return (
    <LoginManager>
      <LoginDrawerStackManager>
        <LoginContent />
      </LoginDrawerStackManager>
    </LoginManager>
  );
}

function LoginContent() {
  return (
    <>
      <FirstAccessModal />
      <div className={styles.login}>
        <main className={styles.container}>
          <aside className={styles.aside}>
            <div className={styles.asideContent}>
              <h2>
                Bem-vindo, <br /> Investidor
              </h2>
              <AfinzLogo />
            </div>
          </aside>
          <DocumentStep />
        </main>
      </div>
    </>
  );
}
