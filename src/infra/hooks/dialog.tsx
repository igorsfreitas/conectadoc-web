import { useContext } from "react";
import { DialogContext } from "../contexts/dialog";

export function useDialog() {
  return useContext(DialogContext);
}
