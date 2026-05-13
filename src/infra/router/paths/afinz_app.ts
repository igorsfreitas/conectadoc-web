export interface AppRoute {
  name?: string;
  asRoute?: string;
  path?: string;
  [key: string]: AppRoute | string | undefined;
}

export const afinzAppPaths = {
  login: {
    name: "Login",
    path: "/login",
    asRoute: "/login",
  },
  assuntos: {
    name: "Assuntos",
    path: "/assuntos",
    asRoute: "/assuntos",
  },
  hierarquia: {
    name: "Hierarquia de Arquivologia",
    path: "/hierarquia",
    asRoute: "/hierarquia",
  },
  tipoEntidadeExterna: {
    name: "Tipo de Entidade Externa",
    path: "/tipo-entidade-externa",
    asRoute: "/tipo-entidade-externa",
  },
  entidadeExterna: {
    name: "Entidades Externas",
    path: "/entidade-externa",
    asRoute: "/entidade-externa",
  },
  unidadeAdministrativa: {
    name: "Unidades Administrativas",
    path: "/unidade-administrativa",
    asRoute: "/unidade-administrativa",
  },
  tipoDocumento: {
    name: "Tipos de Documento",
    path: "/tipo-documento",
    asRoute: "/tipo-documento",
  },
  casoUso: {
    name: "Casos de Uso",
    path: "/caso-uso",
    asRoute: "/caso-uso",
  },
  perfis: {
    name: "Perfis",
    path: "/perfis",
    asRoute: "/perfis",
  },
  usuarios: {
    name: "Usuários",
    path: "/usuarios",
    asRoute: "/usuarios",
  },
};
