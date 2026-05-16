import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AfinzApiError } from "@afinz/rest-client";
import { useInject } from "../../infra/hooks/inject";
import { afinzAppPaths } from "../../infra/router/paths/afinz_app";

/**
 * Mensagens amigáveis para os códigos de erro retornados pelo callback gov.br
 * (`reply.redirect('/login?error=...')`). Lista alinhada com `govbr.controller.ts`.
 */
const GOVBR_ERROR_MESSAGES: Record<string, string> = {
  usuario_nao_cadastrado:
    "Seu CPF não está cadastrado neste órgão. Solicite acesso ao administrador.",
  govbr_session_expired:
    "Sessão de login expirou. Tente novamente.",
  govbr_state_mismatch:
    "Falha de segurança no retorno do gov.br. Tente novamente.",
  govbr_no_cpf: "O gov.br não retornou seu CPF. Verifique seu cadastro.",
  govbr_init_failed: "Não foi possível iniciar o login gov.br.",
  govbr_callback_failed: "Falha ao processar retorno do gov.br.",
  tenant_indefinido:
    "Tenant não identificado. Acesse pelo subdomínio do seu órgão.",
};

function resolveTenantForDirectNav(): string {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length >= 3) return parts[0].toLowerCase();
  const envTenant = (import.meta as { env?: Record<string, string> }).env?.[
    "VITE_APP_TENANT"
  ];
  return (envTenant ?? "amtt").trim();
}

export function Login() {
  const authService = useInject("AuthService");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lê ?error=... vindo do callback gov.br
  useEffect(() => {
    const errCode = searchParams.get("error");
    if (errCode) {
      setError(GOVBR_ERROR_MESSAGES[errCode] ?? `Erro: ${errCode}`);
      // Limpa query string sem recarregar
      const next = new URLSearchParams(searchParams);
      next.delete("error");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authService.login({ cpf, senha });
      if (result instanceof AfinzApiError) {
        setError(result.message);
      } else {
        navigate(afinzAppPaths.assuntos.asRoute, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGovbrLogin() {
    // Navegação direta — não passa pelo axios. Em prod o tenant vem do
    // subdomínio; em dev local mandamos via query string.
    const tenant = resolveTenantForDirectNav();
    const redirect = encodeURIComponent(afinzAppPaths.assuntos.asRoute ?? "/");
    const url = `/v1/auth/govbr/login?redirect=${redirect}&tenant=${tenant}`;
    window.location.assign(url);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: 360,
        }}
      >
        <h2>ConectaDoc</h2>
        {error && (
          <p style={{ color: "red", margin: 0, fontSize: 14 }}>{error}</p>
        )}
        <label>
          CPF
          <input
            type="text"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            required
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#888",
            fontSize: 12,
            margin: "4px 0",
          }}
        >
          <span style={{ flex: 1, height: 1, background: "#ddd" }} />
          ou
          <span style={{ flex: 1, height: 1, background: "#ddd" }} />
        </div>

        <button
          type="button"
          onClick={handleGovbrLogin}
          disabled={loading}
          style={{
            background: "#1351b4",
            color: "white",
            border: "none",
            padding: "10px 12px",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          Entrar com{" "}
          <span style={{ background: "white", color: "#1351b4", padding: "2px 6px", borderRadius: 3, fontSize: 12 }}>
            gov.br
          </span>
        </button>
      </form>
    </div>
  );
}
