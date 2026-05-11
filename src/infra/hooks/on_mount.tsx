import { useEffect, useState } from "react";

export const useOnMount = (callback?: () => void) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (callback) callback();
  }, [isMounted]);

  return { isMounted };
};
