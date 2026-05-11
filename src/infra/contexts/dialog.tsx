import { AfinzConfirmDialog, AfinzGenericDialog } from "@afinz/design-system";
import { createContext, ReactElement, ReactNode, useState } from "react";

interface BaseDialog {
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  className?: string;
  withoutClose?: boolean;
  dialogClassName?: string;
  titleSectionClassName?: string;
  onClose: () => void;
}

export interface Dialog extends BaseDialog {
  main?: ReactNode;
}

interface ConfirmDialog extends Dialog {
  title: string;
  subtitle?: string;
  customExitButtonText?: string;
  onConfirm: () => void;
  onBack: () => void;
}

interface Context {
  showConfirmDialog(confirmDialog: ConfirmDialog): void;
  setLoadingConfirmation(loading: boolean): void;
  showDialog(dialog: Dialog): void;
  popDialogOfQueue(): void;
}

export const DialogContext = createContext<Context>({
  showConfirmDialog(_confirmDialog: ConfirmDialog) {},
  setLoadingConfirmation(_loading: boolean) {},
  showDialog(_dialog: Dialog) {},
  popDialogOfQueue() {},
});

export function DialogManager({ children }: { children: ReactElement }) {
  const [dialogsQueue, setDialogsQueue] = useState<BaseDialog[]>([]);
  const dialogToShow: BaseDialog | undefined =
    dialogsQueue[dialogsQueue.length - 1];
  const [loadingConfirmation, setLoadingConfirmation] = useState(false);

  function popDialogOfQueue() {
    setDialogsQueue((oldValues) => {
      if (oldValues.length > 0) {
        const lastIndexOfQueue = oldValues.length - 1;
        return oldValues.filter((_, index) => index !== lastIndexOfQueue);
      }

      return [];
    });
  }

  function showConfirmDialog(confirmDialog: ConfirmDialog) {
    setDialogsQueue((oldValues) => [...oldValues, confirmDialog]);
  }

  function showDialog(dialog: Dialog) {
    setDialogsQueue((oldValues) => [...oldValues, dialog]);
  }

  function renderDialog() {
    const genericObject = Object(dialogToShow);

    if (typeof genericObject.onConfirm === "function") {
      const confirmDialog = dialogToShow as ConfirmDialog;
      return (
        <AfinzConfirmDialog
          {...confirmDialog}
          loadingConfirmation={loadingConfirmation}
        />
      );
    } else if (genericObject.main) {
      return (
        <AfinzGenericDialog
          title={genericObject.title}
          onClose={genericObject.onClose}
          subtitle={genericObject.subtitle}
          className={genericObject.className}
          withoutClose={genericObject.withoutClose}
          dialogClassName={genericObject.dialogClassName}
          titleSectionClassName={genericObject.titleSectionClassName}
        >
          {genericObject.main}
        </AfinzGenericDialog>
      );
    }
  }

  return (
    <>
      {dialogToShow && renderDialog()}

      <DialogContext.Provider
        value={{
          showConfirmDialog,
          showDialog,
          popDialogOfQueue,
          setLoadingConfirmation,
        }}
      >
        {children}
      </DialogContext.Provider>
    </>
  );
}
