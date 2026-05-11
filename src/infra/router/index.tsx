import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "../../features/login";
import { ServerInstabilityPage } from "../../features/server_instability";
import { ProfileManager } from "../contexts/profile";
import { afinzAppPaths } from "./paths/afinz_app";
import { AppRoutes } from "./routes/app";
export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ServerInstabilityPage />} />
        <Route
          path="/"
          element={
            <Navigate to={afinzAppPaths.investiment.auth.path} replace />
          }
        />
        <Route
          path={`${afinzAppPaths.investiment.asRoute}/*`}
          element={
            <ProfileManager>
              <AppRoutes />
            </ProfileManager>
          }
        />
        <Route path={afinzAppPaths.investiment.auth.path} element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
