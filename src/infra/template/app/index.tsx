import {
  AfinzBreadcrumb,
  AfinzExitToAppIcon,
  AfinzLogo,
} from "@afinz/design-system";
import styles from "./style.module.scss";

import { useContext, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { afinzStorageKeys } from "../../afinz_storage/afinz_storage_keys";
import { ProfileContext } from "../../contexts/profile";
import { useAfinzNavigate } from "../../hooks/afinz_navigator";
import { afinzAppPaths } from "../../router/paths/afinz_app";

export function AppLayout() {
  const navigate = useAfinzNavigate();
  const location = useLocation();

  const { loadProfile, profile } = useContext(ProfileContext);

  const logout = () => {
    localStorage.removeItem(afinzStorageKeys.authenticatedCpf);
    localStorage.removeItem(afinzStorageKeys.token);
    localStorage.removeItem(afinzStorageKeys.refreshToken);
    navigate(afinzAppPaths.investiment.auth.asRoute);
  };

  useEffect(() => {
    if (!profile) {
      loadProfile();
    }
  }, []);

  return (
    <div className={styles.layout}>
      <main className={styles.appLayout}>
        <header>
          <div className={styles.logoCenter}>
            <AfinzLogo />
            <hr></hr>
            <h5>Portal do Investidor</h5>
          </div>
          <div className={styles.exit} onClick={logout}>
            <AfinzExitToAppIcon />
          </div>
        </header>
        <div className={styles.innerContent}>
          <div
            className={`${styles.breadcrumb} ${location.pathname == "/investimentos" ? "hidden" : ""}`}
          >
            <AfinzBreadcrumb
              afinzAppPaths={afinzAppPaths}
              navigator={navigate}
              pathname={location.pathname}
            />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
