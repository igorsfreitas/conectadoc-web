import { useContext } from "react";
import { NavigateOptions, useNavigate } from "react-router-dom";
import { DialogContext } from "../contexts/dialog";
import { useEditingContext } from "../contexts/editing_context";

export const useAfinzNavigate = () => {
  const navigate = useNavigate();
  const { editing, setEditing } = useEditingContext();
  const { showConfirmDialog, popDialogOfQueue } = useContext(DialogContext);

  return (path: string, options: NavigateOptions = {}) => {
    if (editing) {
      showConfirmDialog({
        title: "Você quer sair antes de confirmar o ajuste de limite?",
        subtitle: "Ao sair, o valor vai continuar o mesmo do limite anterior.",
        onConfirm: () => {
          setEditing(false);
          popDialogOfQueue();
          navigate(path, options);
        },
        onBack: () => {
          popDialogOfQueue();
        },
        onClose: () => {
          popDialogOfQueue();
        },
      });
      return;
    }
    navigate(path, options);
  };
};
