import { HttpClient } from "@afinz/rest-client";
import { createContext, ReactElement } from "react";
import { AuthService } from "../services/auth/auth.service";
import { PinErrorInterceptors } from "../services/http-client/interceptors/errors";
import { LogInterceptor } from "../services/http-client/interceptors/log";
import { ProfileService } from "../services/profile/profile.service";
import { OpenSearchService } from "../services/open-search/open-search.service";
import { FinancialInvestmentsService } from "../services/statement_investment/statement_investiment.service";

export interface Dependences {
  FinancialInvestmentsService: FinancialInvestmentsService;
  AuthService: AuthService;
  ProfileService: ProfileService;
  OpenSearchService: OpenSearchService;
}

export const DependencyInjectionContext = createContext<Dependences | null>(
  null,
);

interface Props {
  children: ReactElement;
}

export function DependencyInjectionManager({ children }: Props) {
  const logInterceptor = new LogInterceptor();
  const httpClient = new HttpClient(
    false,
    logInterceptor,
    undefined,
    undefined,
    new PinErrorInterceptors(),
    import.meta.env.VITE_APP_BASE_URL,
  );

  const openSearchService = new OpenSearchService(httpClient);
  logInterceptor.setOpenSearchService(openSearchService);

  const dependenciesToInject = {
    FinancialInvestmentsService: new FinancialInvestmentsService(httpClient),
    AuthService: new AuthService(httpClient),
    ProfileService: new ProfileService(httpClient),
    OpenSearchService: openSearchService,
  };

  return (
    <DependencyInjectionContext.Provider value={dependenciesToInject}>
      {children}
    </DependencyInjectionContext.Provider>
  );
}
