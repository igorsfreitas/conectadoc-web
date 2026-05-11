import { AfinzModal } from "@afinz/design-system";
import { useContext } from "react";
import { FirstAccess } from "../../components/first_access";
import { useLoginContext } from "../../contexts/login_context";
import { LoginDrawerStackContext } from "../../contexts/login_drawer_stack";

export function FirstAccessModal() {
  const {
    showFirstViewModal,
    handleCloseFirstViewModal,
    clickFirstAccess,
    setFlow,
  } = useLoginContext();
  const { push } = useContext(LoginDrawerStackContext);

  if (!showFirstViewModal) {
    return null;
  }

  return (
    <div style={{ position: "absolute" }}>
      <AfinzModal closeCallback={handleCloseFirstViewModal}>
        <FirstAccess
          onClickClose={handleCloseFirstViewModal}
          onClickFirstAccess={clickFirstAccess}
          push={push}
          setFlow={setFlow}
        />
      </AfinzModal>
    </div>
  );
}
