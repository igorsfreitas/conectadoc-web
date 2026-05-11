import { createContext, useContext, useState, ReactNode } from "react";

interface EditingContextProps {
  editing: boolean;
  setEditing: (value: boolean) => void;
}

const EditingContext = createContext<EditingContextProps | undefined>(
  undefined,
);

export const EditingProvider = ({ children }: { children: ReactNode }) => {
  const [editing, setEditing] = useState(false);

  return (
    <EditingContext.Provider value={{ editing, setEditing }}>
      {children}
    </EditingContext.Provider>
  );
};

export const useEditingContext = (): EditingContextProps => {
  const context = useContext(EditingContext);
  if (!context) {
    throw new Error("useEditingContext must be used within an EditingProvider");
  }
  return context;
};
