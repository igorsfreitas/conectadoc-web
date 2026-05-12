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
};
