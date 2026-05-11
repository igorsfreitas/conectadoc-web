import { AfinzButton, AfinzPinLoginIllustration } from "@afinz/design-system";
import { LoginFlow } from "../../contexts/login_context";
import { Paths } from "../../contexts/login_drawer_stack";
import styles from "./style.module.scss";

interface FirstAccessProps {
  onClickClose: () => void;
  onClickFirstAccess: (openDrawer: VoidFunction) => void;
  push: (path: Paths) => void;
  setFlow: (flow: LoginFlow) => void;
}

export function FirstAccess({
  onClickClose,
  onClickFirstAccess,
  push,
  setFlow,
}: FirstAccessProps) {
  return (
    <div className={styles.firstAccess}>
      <div className={styles.cover}>
        <div className={styles.title}>
          <h5>A plataforma de investimentos mudou!</h5>
          <p>
            Para acessar seus investimentos na Afinz, é preciso que você
            atualize seu cadastro e crie uma nova senha.
          </p>
        </div>
        <div className={styles.carrousel}>
          <div className={styles.image}>
            <AfinzPinLoginIllustration />
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <div className={`${styles.actions} big-button`}>
          <AfinzButton
            type="tertiary"
            size="big"
            isExpanded
            onClick={onClickClose}
          >
            Fechar
          </AfinzButton>
          <AfinzButton
            type={"secondary"}
            size="big"
            isExpanded={true}
            onClick={() =>
              onClickFirstAccess(() => {
                push(Paths.Document);
                setFlow(LoginFlow.firstAccess);
              })
            }
          >
            Atualizar cadastro
          </AfinzButton>
        </div>
      </div>
    </div>
  );
}
