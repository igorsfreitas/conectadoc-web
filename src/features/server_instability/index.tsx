import { useNavigate } from "react-router-dom";
import { afinzAppPaths } from "../../infra/router/paths/afinz_app";

interface Props {
  retry?: () => unknown;
}

export function ServerInstabilityPage({ retry }: Props) {
  const navigate = useNavigate();

  function handleRetry() {
    if (retry) {
      retry();
    } else {
      navigate(afinzAppPaths.assuntos.asRoute);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
      <h2>Serviço indisponível</h2>
      <p>Não foi possível completar a operação. Tente novamente.</p>
      <button onClick={handleRetry}>Tentar novamente</button>
    </div>
  );
}
