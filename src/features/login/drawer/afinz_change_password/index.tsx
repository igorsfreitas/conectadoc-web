import {
  AfinzButton,
  AfinzCheckIcon,
  AfinzClose,
  AfinzInput,
  AfinzTopMenu,
  Toast,
} from "@afinz/design-system";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContext } from "../../../../infra/contexts/toast_context";
import { LoginFlow, useLoginContext } from "../../contexts/login_context";
import { LoginDrawerStackContext } from "../../contexts/login_drawer_stack";
import styles from "./style.module.scss";

interface Props {
  onClickClose: () => void;
}

export function AfinzChangePasswordDrawer({ onClickClose }: Props) {
  const toastManager = useContext(ToastContext);
  const { clear } = useContext(LoginDrawerStackContext);
  const { handleChangePassword, flow, isLoading } = useLoginContext();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasError, setHasError] = useState(false);

  async function updatePassword() {
    const result = await handleChangePassword(password);

    if (result) {
      toastManager?.addToast((currentIndex) => (
        <Toast
          key={currentIndex}
          type="success"
          text={
            flow === LoginFlow.firstAccess
              ? "Senha criada com sucesso!"
              : "Senha alterada com sucesso!"
          }
          icon={<AfinzCheckIcon />}
          onClose={() => toastManager?.removeToast(currentIndex)}
        />
      ));
      return clear();
    }
  }

  return (
    <div className={styles.changePassword}>
      <AfinzTopMenu
        hasBackButton={true}
        trailingIcon={<AfinzClose />}
        backFunction={() => navigate(-1)}
        trailingFunction={onClickClose}
      />
      <div className={styles.body}>
        <h5>Informe sua nova senha</h5>
        <div className={styles.inputGroups}>
          <AfinzInput
            notFocusOnMount
            label="Senha"
            type="password"
            name="password"
            maxLength={14}
            initialContent={password}
            onChanged={setPassword}
          />
          <AfinzInput
            notFocusOnMount
            label="Confirme a senha"
            type="password"
            name="confirmPassword"
            maxLength={14}
            initialContent={confirmPassword}
            onChanged={setConfirmPassword}
            validator={(value) => {
              const errors = [];

              if (value !== password) {
                errors.push("As senhas não conferem.");
              }

              setHasError(errors.length > 0);

              return errors.length > 0 ? errors[0] : null;
            }}
          />
        </div>
        <div className={styles.changePasswordButton}>
          <AfinzButton
            disabled={hasError}
            onClick={updatePassword}
            isLoading={isLoading}
          >
            Alterar senha
          </AfinzButton>
        </div>
      </div>
    </div>
  );
}
