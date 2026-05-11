import { useContext } from "react";
import { Dependences, DependencyInjectionContext } from "../contexts/inject";

type InjectableKey = keyof Dependences;

export function useInject(identifier: InjectableKey) {
  return useContext(DependencyInjectionContext)![identifier];
}
