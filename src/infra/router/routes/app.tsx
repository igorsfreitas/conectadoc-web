import { Route, Routes } from "react-router-dom";
import { InvestimentsArea } from "../../../features/investments_area";
import { InvestimentsPosition } from "../../../features/investments_area/pages/investment_position";
import { InvestimentsStatement } from "../../../features/investments_area/pages/investment_statement";
import { ServerInstabilityPage } from "../../../features/server_instability";
import { AppLayout } from "../../template/app/index";
import { afinzAppPaths } from "../paths/afinz_app";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="*" element={<ServerInstabilityPage />} />
        <Route index element={<InvestimentsArea />} />
        <Route
          path={afinzAppPaths.investiment.investimentPosition.path}
          element={<InvestimentsPosition />}
        />
        <Route
          path={afinzAppPaths.investiment.investimentsStatement.path}
          element={<InvestimentsStatement />}
        />
      </Route>
    </Routes>
  );
}
