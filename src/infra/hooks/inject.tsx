import { useContext } from "react";
import { Dependences, DependencyInjectionContext } from "../contexts/inject";

export function useInject<K extends keyof Dependences>(identifier: K): Dependences[K] {
  return useContext(DependencyInjectionContext)![identifier];
}
