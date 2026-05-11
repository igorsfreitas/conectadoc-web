import { useEffect, useRef } from "react";
import { useOnMount } from "./on_mount";

export function useWatch<T = unknown>(
  callback: (prevValues: T[]) => void,
  watch: T[],
) {
  const { isMounted } = useOnMount(() => {});
  const oldValues = useRef(watch);

  useEffect(() => {
    if (
      isMounted &&
      oldValues &&
      JSON.stringify(watch) !== JSON.stringify(oldValues.current)
    ) {
      callback(oldValues.current);
      oldValues.current = watch;
    }
  }, [isMounted, ...watch]);
}
