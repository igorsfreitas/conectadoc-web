import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "../../features/login";
import { ServerInstabilityPage } from "../../features/server_instability";
import { AssuntosPage } from "../../features/assuntos/pages/assuntos_page";
import { HierarquiaPage } from "../../features/hierarquia/pages/hierarquia_page";
import { TipoEntidadeExternaPage } from "../../features/tipo-entidade-externa/pages/tipo_entidade_externa_page";
import { EntidadeExternaPage } from "../../features/entidade-externa/pages/entidade_externa_page";
import { UnidadeAdministrativaPage } from "../../features/unidade-administrativa/pages/unidade_administrativa_page";
import { TipoDocumentoListPage } from "../../features/tipo-documento/pages/TipoDocumentoListPage";
import { TipoDocumentoFormPage } from "../../features/tipo-documento/pages/TipoDocumentoFormPage";
import { CasoUsoPage } from "../../features/caso-uso/pages/caso_uso_page";
import { PerfisPage } from "../../features/perfis/pages/perfis_page";
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
          <Route path={afinzAppPaths.hierarquia.asRoute} element={<HierarquiaPage />} />
          <Route path={afinzAppPaths.tipoEntidadeExterna.asRoute} element={<TipoEntidadeExternaPage />} />
          <Route path={afinzAppPaths.entidadeExterna.asRoute} element={<EntidadeExternaPage />} />
          <Route path={afinzAppPaths.unidadeAdministrativa.asRoute} element={<UnidadeAdministrativaPage />} />
          <Route path={afinzAppPaths.tipoDocumento.asRoute} element={<TipoDocumentoListPage />} />
          <Route path={`${afinzAppPaths.tipoDocumento.asRoute}/novo`} element={<TipoDocumentoFormPage />} />
          <Route path={`${afinzAppPaths.tipoDocumento.asRoute}/:codigo`} element={<TipoDocumentoFormPage />} />
          <Route path={afinzAppPaths.casoUso.asRoute} element={<CasoUsoPage />} />
          <Route path={afinzAppPaths.perfis.asRoute} element={<PerfisPage />} />
        </Route>
        <Route path="*" element={<ServerInstabilityPage />} />
      </Routes>
    </BrowserRouter>
  );
}
