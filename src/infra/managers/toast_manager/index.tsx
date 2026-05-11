import { AfinzTextUtil } from "@afinz/utils";
import { ReactElement, useState } from "react";
import { ToastContext } from "../../contexts/toast_context";

export function ToastsManager({ children }: { children: ReactElement }) {
  const [toasts, setToasts] = useState<ReactElement[]>([]);

  function addToast(
    cb: (index: string, previousIndex: string) => ReactElement,
  ) {
    setToasts((prevState: ReactElement[]) => {
      const element = cb(
        AfinzTextUtil.generateRandomId(6),
        prevState[0]?.key ?? "",
      );
      const elementId = element.props.id;

      if (elementId && elementId === "no-connection-toast") {
        return !prevState.find(
          (toast) => toast.props.id === "no-connection-toast",
        )
          ? [...prevState, element]
          : prevState;
      }

      return [...prevState, element];
    });
  }

  function removeToast(index: string) {
    setToasts((prevState) =>
      prevState.filter((toast, _) => toast.key !== index),
    );
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {toasts}
    </ToastContext.Provider>
  );
}
