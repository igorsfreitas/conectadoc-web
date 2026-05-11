import { EndDrawer } from "@afinz/design-system";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { useDialog } from "../hooks/dialog";
import { useEditingContext } from "./editing_context";

interface DrawerContextProps {
  openEndDrawer: (content: ReactNode) => void;
  closeEndDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextProps>({
  openEndDrawer: () => {},
  closeEndDrawer: () => {},
});

export const useDrawerContext = () => useContext(DrawerContext);

export const DrawerManager: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<ReactNode>(null);

  const { editing, setEditing } = useEditingContext();
  const { showConfirmDialog, popDialogOfQueue } = useDialog();

  const openEndDrawer = (content: ReactNode) => {
    setDrawerContent(content);
    setIsOpen(true);
  };

  const closeEndDrawer = () => {
    if (editing) {
      showConfirmDialog({
        title: "Você quer sair sem alterar?",
        subtitle:
          "Ao sair, você vai continuar com seus dados como estavam antes.",
        customExitButtonText: "Sair sem alterar",
        onConfirm: () => {
          setEditing(false);
          setIsOpen(false);
          setDrawerContent(null);
          popDialogOfQueue();
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
    setIsOpen(false);
    setDrawerContent(null);
  };

  return (
    <DrawerContext.Provider value={{ openEndDrawer, closeEndDrawer }}>
      {children}
      {isOpen && (
        <EndDrawer content={drawerContent} closeEndDrawer={closeEndDrawer} />
      )}
    </DrawerContext.Provider>
  );
};
