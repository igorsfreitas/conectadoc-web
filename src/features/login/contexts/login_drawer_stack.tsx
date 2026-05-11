import { EndDrawer } from "@afinz/design-system";
import { createContext, ReactNode, useMemo, useState } from "react";
import { AfinzChangePasswordDrawer } from "../drawer/afinz_change_password";
import { AfinzDocumentDrawer } from "../drawer/afinz_document_drawer";
import { AfinzTokenDrawer } from "../drawer/afinz_token_drawer";

export enum Paths {
  Document = "/document",
  Token = "/token",
  ChangePassword = "/change-password",
}

export interface Context {
  pop: () => void;
  push: (path: Paths) => void;
  clear: () => void;
  stackLength: number;
  previousTop?: Paths;
}

export const LoginDrawerStackContext = createContext<Context>({
  pop: () => {},
  push: (_: Paths) => {},
  clear: () => {},
  stackLength: 0,
  previousTop: undefined,
});

const drawers = {
  [Paths.Document]: AfinzDocumentDrawer,
  [Paths.Token]: AfinzTokenDrawer,
  [Paths.ChangePassword]: AfinzChangePasswordDrawer,
};

export function LoginDrawerStackManager(props: { children: ReactNode }) {
  const [drawersStack, setDrawersStack] = useState<Paths[]>([]);
  const previousTop =
    drawersStack.length > 1 ? drawersStack[drawersStack.length - 2] : undefined;
  const stackLength = drawersStack.length;

  const DrawerComponent = useMemo(() => {
    return drawersStack.length > 0
      ? drawers[drawersStack[drawersStack.length - 1]]
      : undefined;
  }, [drawersStack]);

  function push(path: Paths) {
    setDrawersStack([...drawersStack, path]);
  }

  function clear() {
    setDrawersStack([]);
  }

  function pop() {
    clear();
  }

  return (
    <LoginDrawerStackContext.Provider
      value={{ clear, push, pop, previousTop, stackLength }}
    >
      {props.children}

      {DrawerComponent && (
        <EndDrawer
          closeEndDrawer={pop}
          content={<DrawerComponent onClickClose={pop} />}
        />
      )}
    </LoginDrawerStackContext.Provider>
  );
}
