import {
  AfinzButton,
  AfinzInput,
  AfinzLogo,
  AfinzVisibilityOffIcon,
  AfinzVisibilityOnIcon,
} from "@afinz/design-system";
import { AfinzTextUtil } from "@afinz/utils";
import { useContext } from "react";
import { LoginFlow, useLoginContext } from "../../contexts/login_context";
import {
  LoginDrawerStackContext,
  Paths,
} from "../../contexts/login_drawer_stack";
import styles from "./style.module.scss";

export function DocumentStep() {
  const {
    documentNumber,
    formattedDocumentNumber,
    password,
    setPassword,
    setDocumentNumber,
    setFlow,
    handleLogin,
    visible,
    setVisible,
    isLoading,
  } = useLoginContext();

  const { push } = useContext(LoginDrawerStackContext);

  return (
    <div className={styles.body}>
      <div className={styles.bodyContent}>
        <div className={styles.logo}>
          <AfinzLogo />
        </div>
        <h6>Insira seus dados abaixo para acessar seus investimentos</h6>
        <div className={styles.bodyContainer}>
          <div className={styles.inputGroup}>
            <AfinzInput
              notFocusOnMount
              label="CPF/CNPJ"
              name="documentNumber"
              maxLength={18}
              initialContent={formattedDocumentNumber}
              validator={(value) => {
                const onlyNumbersValue = value.replace(/[^0-9]/g, "");
                const errors = [];

                if (
                  value.length > 0 &&
                  !AfinzTextUtil.validateCpf(onlyNumbersValue) &&
                  !AfinzTextUtil.validateCnpj(onlyNumbersValue)
                ) {
                  errors.push("Por favor, informe um CPF/CNPJ válido.");
                }

                setDocumentNumber(onlyNumbersValue);
                return errors.length > 0 ? errors[0] : null;
              }}
            />
            <AfinzInput
              notFocusOnMount
              label="Senha"
              type={visible ? "text" : "password"}
              name="password"
              maxLength={14}
              rightIcon={
                visible ? (
                  <div onClick={() => setVisible(false)}>
                    <AfinzVisibilityOffIcon />
                  </div>
                ) : (
                  <div onClick={() => setVisible(true)}>
                    <AfinzVisibilityOnIcon />
                  </div>
                )
              }
              initialContent={password}
              onChanged={setPassword}
            />
            <div className={styles.textBoxRight}>
              <div>
                <span
                  className="small-button"
                  onClick={() => {
                    setFlow(LoginFlow.resetPassword);
                    push(Paths.Document);
                  }}
                >
                  Esqueceu a senha?
                </span>
              </div>
            </div>
          </div>
          <AfinzButton
            isExpanded
            size="big"
            disabled={
              !(documentNumber && documentNumber !== "") ||
              !(password && password !== "")
            }
            isLoading={isLoading}
            onClick={handleLogin}
          >
            Entrar
          </AfinzButton>

          <AfinzButton
            type="secondary"
            isExpanded
            size="big"
            onClick={() => {
              push(Paths.Document);
              setFlow(LoginFlow.firstAccess);
            }}
          >
            Primeiro acesso
          </AfinzButton>
        </div>
      </div>
    </div>
  );
}
