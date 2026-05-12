import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DependencyInjectionManager } from "./infra/contexts/inject";
import { Router } from "./infra/router";
import { Log, Vortex } from "./infra/logger/log_wrapper.ts";
import { ErrorBoundary } from "./infra/components/ErrorBoundary.tsx";

Log.init(new Vortex());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DependencyInjectionManager>
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
    </DependencyInjectionManager>
  </StrictMode>,
);
