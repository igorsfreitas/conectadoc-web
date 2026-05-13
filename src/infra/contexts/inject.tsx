import { HttpClient } from "@afinz/rest-client";
import { createContext, ReactElement } from "react";
import { AuthService } from "../services/auth/auth.service";
import { PinErrorInterceptors } from "../services/http-client/interceptors/errors";
import { LogInterceptor } from "../services/http-client/interceptors/log";
import { TenantInterceptor } from "../services/http-client/interceptors/tenant";
import { ProfileService } from "../services/profile/profile.service";
import { AssuntosService } from "../services/assuntos/assuntos.service";
import { HierarquiaService } from "../services/hierarquia/hierarquia.service";
import { TipoEntidadeExternaService } from "../services/tipo-entidade-externa/tipo-entidade-externa.service";
import { EntidadeExternaService } from "../services/entidade-externa/entidade-externa.service";
import { UnidadeAdministrativaService } from "../services/unidade-administrativa/unidade-administrativa.service";
import { TipoDocumentoService } from "../services/tipo-documento/tipo-documento.service";
import { CasoUsoService } from "../services/caso-uso/caso-uso.service";
import { PerfisService } from "../services/perfis/perfis.service";
import { UsuariosService } from "../services/usuarios/usuarios.service";

export interface Dependences {
  AuthService: AuthService;
  ProfileService: ProfileService;
  AssuntosService: AssuntosService;
  HierarquiaService: HierarquiaService;
  TipoEntidadeExternaService: TipoEntidadeExternaService;
  EntidadeExternaService: EntidadeExternaService;
  UnidadeAdministrativaService: UnidadeAdministrativaService;
  TipoDocumentoService: TipoDocumentoService;
  CasoUsoService: CasoUsoService;
  PerfisService: PerfisService;
  UsuariosService: UsuariosService;
}

export const DependencyInjectionContext = createContext<Dependences | null>(null);

interface Props {
  children: ReactElement;
}

export function DependencyInjectionManager({ children }: Props) {
  const httpClient = new HttpClient(
    false,
    new LogInterceptor(),
    undefined,
    undefined,
    new PinErrorInterceptors(),
    import.meta.env.VITE_APP_BASE_URL,
    [new TenantInterceptor()],
  );

  const dependenciesToInject: Dependences = {
    AuthService: new AuthService(httpClient),
    ProfileService: new ProfileService(httpClient),
    AssuntosService: new AssuntosService(httpClient),
    HierarquiaService: new HierarquiaService(httpClient),
    TipoEntidadeExternaService: new TipoEntidadeExternaService(httpClient),
    EntidadeExternaService: new EntidadeExternaService(httpClient),
    UnidadeAdministrativaService: new UnidadeAdministrativaService(httpClient),
    TipoDocumentoService: new TipoDocumentoService(httpClient),
    CasoUsoService: new CasoUsoService(httpClient),
    PerfisService: new PerfisService(httpClient),
    UsuariosService: new UsuariosService(httpClient),
  };

  return (
    <DependencyInjectionContext.Provider value={dependenciesToInject}>
      {children}
    </DependencyInjectionContext.Provider>
  );
}
