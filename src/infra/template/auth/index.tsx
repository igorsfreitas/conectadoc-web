import style from "./style.module.scss";
import { Outlet } from "react-router-dom";

export function AuthTemplate() {
  return (
    <div className={`page ${style.authLayout}`}>
      <main className={style.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
