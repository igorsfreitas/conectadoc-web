import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "../../features/login";
import { ServerInstabilityPage } from "../../features/server_instability";
import { AssuntosPage } from "../../features/assuntos/pages/assuntos_page";
import { AppLayout } from "../template/app/index";
import { afinzAppPaths } from "./paths/afinz_app";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={afinzAppPaths.assuntos.asRoute} replace />} />
        <Route path={afinzAppPaths.login.path} element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path={afinzAppPaths.assuntos.asRoute} element={<AssuntosPage />} />
        </Route>
        <Route path="*" element={<ServerInstabilityPage />} />
      </Routes>
    </BrowserRouter>
  );
}
