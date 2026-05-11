import { useContext, useEffect, useState } from "react";

import { useEditingContext } from "../../../../infra/contexts/editing_context";
import { useDialog } from "../../../../infra/hooks/dialog";

import {
  AfinzButton,
  AfinzClose,
  AfinzTopMenu,
  InsertCodeSection,
} from "@afinz/design-system";
import { useLoginContext } from "../../contexts/login_context";
import {
  LoginDrawerStackContext,
  Paths,
} from "../../contexts/login_drawer_stack";
import styles from "./style.module.scss";

interface Props {
  onClickClose: () => void;
}

export function AfinzTokenDrawer({ onClickClose }: Props) {
  const { setEditing } = useEditingContext();

  const { push } = useContext(LoginDrawerStackContext);
  const { popDialogOfQueue, showConfirmDialog } = useDialog();
  const {
    setCode,
    code,
    ttlSeconds,
    handleConfirm,
    handleFirstAccess,
    errorCode,
    isLoading,
    receiverOtpMail,
  } = useLoginContext();

  const [isError, setIsError] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    setEditing(true);
    return () => setEditing(false);
  }, []);

  const defaultAlertMessage =
    "Lembre-se de atualizar e conferir sua caixa de entrada, lixo eletrônico, spam e lixeira.";

  const drawerTitle = `Informe o código que você recebeu no seu e-mail`;

  const drawerSubtitle = `O código de verificação foi enviado para o e-mail ${receiverOtpMail.toLowerCase()}.`;

  const drawerAlertTitle = `Não recebeu esse email?`;

  const drawerAlertMessage = defaultAlertMessage;

  async function handleSendToken() {
    await handleFirstAccess(() => {});
    return true;
  }

  function confirmCloseDialog(onConfirm: () => void) {
    showConfirmDialog({
      title: "Você quer sair sem alterar?",
      subtitle:
        "Ao sair, você vai continuar com seus dados como estavam antes.",
      customExitButtonText: "Sair sem alterar",
      onConfirm: () => {
        if (onConfirm) onConfirm();
        popDialogOfQueue();
      },
      onBack: () => popDialogOfQueue(),
      onClose: () => popDialogOfQueue(),
    });
  }

  const handleComplete = (enteredCode: string) => {
    setCode(enteredCode);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    if (isButtonDisabled && newCode !== errorCode) {
      setIsButtonDisabled(false);
      setIsError(false);
    }
  };

  return (
    <div className={styles.container}>
      <AfinzTopMenu
        disabled={isLoading}
        hasBackButton
        trailingIcon={<AfinzClose />}
        backFunction={() => push(Paths.Document)}
        trailingFunction={() => confirmCloseDialog(onClickClose)}
      />
      <div className={styles.editSection}>
        <InsertCodeSection
          key={ttlSeconds}
          title={drawerTitle}
          subtitle={drawerSubtitle}
          alertTitle={drawerAlertTitle}
          alertMessage={drawerAlertMessage}
          onComplete={handleComplete}
          onCodeChange={handleCodeChange}
          handleResend={handleSendToken}
          isError={isError}
          isBlurred={isLoading}
          remainingTime={ttlSeconds}
        />

        <div className={styles.buttonContainer}>
          <AfinzButton
            onClick={() => handleConfirm(() => push(Paths.ChangePassword))}
            disabled={isButtonDisabled || code.length !== 6}
            isLoading={isLoading}
            variant="primary"
            size="big"
            className={styles.confirmButton}
          >
            Informar código
          </AfinzButton>
        </div>
      </div>
    </div>
  );
}
