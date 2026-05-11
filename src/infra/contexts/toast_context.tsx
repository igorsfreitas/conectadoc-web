import { createContext, ReactElement } from "react";

export interface ToastContextObject {
  toasts: ReactElement[];
  addToast: (
    cb: (index: string, previousIndex?: string) => ReactElement,
  ) => void;
  removeToast: (index: string) => void;
}

/**
 * Providencia o contexto dos toasts para o app
 *
 * @example
 * consumindo o contexto
 * ```ts
 * const toast = useContext(ToastContext)
 * toasts?.addToast((currentIndex) => (
 * <Toast key={currentIndex} text={"teste"}
 * onClose={() => toasts?.removeToast(currentIndex)} />
 * ))
 * ```
 */
export const ToastContext = createContext<ToastContextObject | null>(null);
