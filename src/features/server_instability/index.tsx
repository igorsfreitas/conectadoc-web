import { AfinzServerInstabilityPage } from "@afinz/design-system";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAfinzNavigate } from "../../infra/hooks/afinz_navigator";
import { afinzAppPaths } from "../../infra/router/paths/afinz_app";

interface Props {
  retry?: () => unknown;
}

export function ServerInstabilityPage(props: Props) {
  const navigate = useAfinzNavigate();
  const [searchParams] = useSearchParams();
  const [nextRoute, setNextRoute] = useState<string | null>(null);

  async function tryLoadProfileAgain() {
    navigate(nextRoute ?? afinzAppPaths.investiment.asRoute);
  }

  useEffect(() => {
    setNextRoute(searchParams.get("next"));
  }, []);

  return (
    <div className="page-content">
      <AfinzServerInstabilityPage
        retry={props.retry ? props.retry : tryLoadProfileAgain}
      />
    </div>
  );
}
