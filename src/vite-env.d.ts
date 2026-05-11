/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BASE_URL: string;
  readonly VITE_APP_OPEN_SEARCH_URL: string;
}

declare const APP_VERSION: string;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
