import { FormEvent, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AfinzApiError } from "@afinz/rest-client";
import { useInject } from "../../infra/hooks/inject";
import { afinzAppPaths } from "../../infra/router/paths/afinz_app";

export function Login() {
  const authService = useInject("AuthService");
  const navigate = useNavigate();

  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", width: 320 }}>
        <h2>ConectaDoc</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
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
      </form>
    </div>
  );
}
