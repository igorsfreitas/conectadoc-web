import { FormEvent, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AfinzApiError } from "@afinz/rest-client";
import { useInject } from "../../infra/hooks/inject";
import { ProfileContext } from "../../infra/contexts/profile";
import { afinzAppPaths } from "../../infra/router/paths/afinz_app";

const GOVBR_ERROR_MESSAGES: Record<string, string> = {
  usuario_nao_cadastrado: "Seu CPF não está cadastrado. Solicite acesso ao administrador.",
  govbr_session_expired: "Sessão de login expirou. Tente novamente.",
  govbr_state_mismatch: "Falha de segurança no retorno do gov.br. Tente novamente.",
  govbr_no_cpf: "O gov.br não retornou seu CPF. Verifique seu cadastro.",
  govbr_init_failed: "Não foi possível iniciar o login gov.br.",
  govbr_callback_failed: "Falha ao processar retorno do gov.br.",
};

export function Login() {
  const authService = useInject("AuthService");
  const profileService = useInject("ProfileService");
  const { setProfile } = useContext(ProfileContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errCode = searchParams.get("error");
    if (errCode) {
      setError(GOVBR_ERROR_MESSAGES[errCode] ?? `Erro: ${errCode}`);
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
        setError(result.message ?? "CPF ou senha inválidos.");
        return;
      }
      // Hydrate profile context so ProtectedRoutes renders immediately
      const profileRes = await profileService.getProfile();
      if (!(profileRes instanceof Error)) setProfile(profileRes as typeof profileRes);
      navigate(afinzAppPaths.assuntos.asRoute, { replace: true });
    } finally {
      setLoading(false);
    }
  }

  function handleGovbrLogin() {
    const redirect = encodeURIComponent(afinzAppPaths.assuntos.asRoute ?? "/");
    window.location.assign(`/v1/auth/govbr/login?redirect=${redirect}`);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left panel */}
      <div style={{
        flex: "0 0 420px", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "48px 56px",
        background: "var(--surface, #fff)",
        borderRight: "1px solid var(--border, #e5e7eb)",
      }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--brand-600, #2563eb)", letterSpacing: "-0.5px", marginBottom: 6 }}>
            CONECTA<span style={{ color: "var(--text, #111)" }}>DOC</span>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--text-3, #6b7280)", margin: 0 }}>
            Sistema de gestão documental
          </p>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text, #111)", margin: "0 0 24px" }}>
          Entrar
        </h2>

        {error && (
          <div style={{
            marginBottom: 16, padding: "10px 14px", borderRadius: 8,
            background: "#fef2f2", color: "#dc2626", fontSize: 13,
            border: "1px solid #fecaca",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="field-label">CPF</label>
            <input
              className="input"
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="00000000000"
              required
              autoComplete="username"
              style={{ fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.05em" }}
            />
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label className="field-label">Senha</label>
            <input
              className="input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 4, height: 40, fontSize: 14, fontWeight: 600 }}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-3, #9ca3af)", fontSize: 12, margin: "20px 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--border, #e5e7eb)" }} />
          ou
          <span style={{ flex: 1, height: 1, background: "var(--border, #e5e7eb)" }} />
        </div>

        <button
          type="button"
          onClick={handleGovbrLogin}
          disabled={loading}
          style={{
            background: "#1351b4", color: "white", border: "none",
            padding: "10px 16px", borderRadius: 8, fontWeight: 600,
            cursor: "pointer", fontSize: 13.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: loading ? 0.6 : 1,
          }}
        >
          Entrar com{" "}
          <span style={{ background: "white", color: "#1351b4", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
            gov.br
          </span>
        </button>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, background: "linear-gradient(135deg, var(--brand-600, #2563eb) 0%, oklch(0.40 0.14 250) 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 48, color: "white",
      }}>
        <div style={{ maxWidth: 340, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-1px", marginBottom: 16 }}>
            CONECTA<span style={{ opacity: 0.7 }}>DOC</span>
          </div>
          <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6, margin: "0 0 40px" }}>
            Plataforma de gestão e protocolo de documentos para órgãos públicos.
          </p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
            {[["2.4M+", "Documentos"], ["180+", "Órgãos"], ["99.9%", "Uptime"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
