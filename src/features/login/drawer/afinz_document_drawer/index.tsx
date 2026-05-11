import {
  AfinzButton,
  AfinzClose,
  AfinzInput,
  AfinzTitle,
  AfinzTopMenu,
} from "@afinz/design-system";
import { AfinzTextUtil } from "@afinz/utils";
import { useContext, useState } from "react";
import { LoginFlow, useLoginContext } from "../../contexts/login_context";
import {
  LoginDrawerStackContext,
  Paths,
} from "../../contexts/login_drawer_stack";
import styles from "./style.module.scss";

export function AfinzDocumentDrawer({
  onClickClose,
}: {
  onClickClose: () => void;
}) {
  const {
    flow,
    actionDocumentNumber,
    setActionDocumentNumber,
    handleResetPassword,
    handleFirstAccess,
    isLoading,
  } = useLoginContext();

  const { push } = useContext(LoginDrawerStackContext);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={styles.documentDrawer}>
      <AfinzTopMenu
        trailingIcon={<AfinzClose />}
        trailingFunction={onClickClose}
      />
      <div className={styles.content}>
        <AfinzTitle isLeft>
          <h5>
            {flow === LoginFlow.firstAccess
              ? "Primeiro Acesso"
              : "Redefinir senha"}
          </h5>

          <p>
            {flow === LoginFlow.firstAccess
              ? "Para começar, precisamos que você informe o seu CPF/CNPJ."
              : "Para redefinir sua senha, informe o seu CPF/CNPJ."}
          </p>
        </AfinzTitle>
        <AfinzInput
          notFocusOnMount
          label="CPF/CNPJ"
          name="documentNumber"
          maxLength={18}
          initialContent={actionDocumentNumber}
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

            setActionDocumentNumber(onlyNumbersValue);

            setHasError(errors.length > 0);

            return errors.length > 0 ? errors[0] : null;
          }}
        />
        <div className={styles.leftSection}>
          <AfinzButton
            className={styles.submitButton}
            buttonType="button"
            size="big"
            isLoading={isLoading}
            disabled={
              !(actionDocumentNumber && actionDocumentNumber !== "") || hasError
            }
            onClick={() => {
              if (flow === LoginFlow.firstAccess) {
                handleFirstAccess(() => push(Paths.Token));
              } else {
                handleResetPassword(() => push(Paths.Token));
              }
            }}
          >
            Continuar
          </AfinzButton>
        </div>
      </div>
    </div>
  );
}
