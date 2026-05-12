import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DialogManager } from "./infra/contexts/dialog";
import { DrawerManager } from "./infra/contexts/drawer_context";
import { EditingProvider } from "./infra/contexts/editing_context";
import { DependencyInjectionManager } from "./infra/contexts/inject";
import { Router } from "./infra/router";
import { ToastsManager } from "./infra/managers/toast_manager";
import { Log, Vortex } from "./infra/logger/log_wrapper.ts";
import { ErrorBoundary } from "./infra/components/ErrorBoundary.tsx";

Log.init(new Vortex());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastsManager>
      <DependencyInjectionManager>
        <ErrorBoundary>
          <EditingProvider>
            <DialogManager>
              <DrawerManager>
                <Router />
              </DrawerManager>
            </DialogManager>
          </EditingProvider>
        </ErrorBoundary>
      </DependencyInjectionManager>
    </ToastsManager>
  </StrictMode>,
);
