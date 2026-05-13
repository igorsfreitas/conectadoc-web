import { HttpRequestInterceptor, HttpRequestInterceptorConfig } from '@afinz/rest-client';

/**
 * Resolve o tenant a partir do subdomínio (produção) ou de variável de
 * ambiente (desenvolvimento local).
 *
 * Produção:  treinamento.conectadoc.com.br → "treinamento"
 * Dev local: sem subdomínio → usa VITE_APP_TENANT → fallback "prefeitura"
 */
function resolveTenant(): string {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0].toLowerCase();
  }

  if (import.meta.env.DEV) {
    const envTenant = import.meta.env.VITE_APP_TENANT as string | undefined;
    return envTenant?.trim() || 'prefeitura';
  }

  return '';
}

export class TenantInterceptor implements HttpRequestInterceptor {
  onRequest(config: HttpRequestInterceptorConfig): HttpRequestInterceptorConfig {
    const tenant = resolveTenant();
    if (tenant) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)['x-tenant'] = tenant;
    }
    return config;
  }
}

