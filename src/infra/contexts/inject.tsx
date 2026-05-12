import { HttpClient } from "@afinz/rest-client";
import { createContext, ReactElement } from "react";
import { AuthService } from "../services/auth/auth.service";
import { PinErrorInterceptors } from "../services/http-client/interceptors/errors";
import { LogInterceptor } from "../services/http-client/interceptors/log";
import { ProfileService } from "../services/profile/profile.service";
import { AssuntosService } from "../services/assuntos/assuntos.service";
import { HierarquiaService } from "../services/hierarquia/hierarquia.service";
import { TipoEntidadeExternaService } from "../services/tipo-entidade-externa/tipo-entidade-externa.service";

export interface Dependences {
  AuthService: AuthService;
  ProfileService: ProfileService;
  AssuntosService: AssuntosService;
  HierarquiaService: HierarquiaService;
  TipoEntidadeExternaService: TipoEntidadeExternaService;
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
  );

  const dependenciesToInject: Dependences = {
    AuthService: new AuthService(httpClient),
    ProfileService: new ProfileService(httpClient),
    AssuntosService: new AssuntosService(httpClient),
    HierarquiaService: new HierarquiaService(httpClient),
    TipoEntidadeExternaService: new TipoEntidadeExternaService(httpClient),
  };

  return (
    <DependencyInjectionContext.Provider value={dependenciesToInject}>
      {children}
    </DependencyInjectionContext.Provider>
  );
}
