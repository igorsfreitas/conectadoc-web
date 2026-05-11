export interface AfinzRoute {
  name?: string;
  asRoute?: string;
  path?: string;
  [key: string]: AfinzRoute | string | undefined;
}

export const afinzAppPaths = {
  investiment: {
    name: "Área Investimentos",
    asRoute: "/investimentos",
    auth: {
      name: "Login",
      path: "/login",
      asRoute: "/login",
    },
    investimentPosition: {
      name: "Posição das Aplicações",
      path: "/posicao-aplicacoes",
      asRoute: "/investimentos/posicao-aplicacoes",
    },
    investimentsStatement: {
      name: "Extrato",
      path: "/extrato",
      asRoute: "/investimentos/extrato",
    },
  },
};
