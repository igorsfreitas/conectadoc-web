import {
  AfinzBarCharUpIcon,
  AfinzFileCopyIcon,
  AfinzKeyboardArrowRightIcon,
  AfinzListCell,
  AfinzReceiptLongIcon,
} from "@afinz/design-system";
import { afinzAppPaths } from "../../infra/router/paths/afinz_app";
import { InvestimentsCard } from "./components/investment_card";
import { InvestimentsHeader } from "./components/investment_header";
import { InvestimentsDialogs } from "./dialogs";
import styles from "./style.module.scss";
import { useInvestimentsViewModel } from "./use_investiments.view-model";

export function InvestimentsArea() {
  const {
    showSendModal,
    setShowSendModal,
    showInfoModal,
    setShowInfoModal,
    year,
    setYear,
    loading,
    handleDownloadIncome,
    navigate,
  } = useInvestimentsViewModel();

  return (
    <div className={styles.investmentsArea}>
      <InvestimentsHeader onHelpClick={() => setShowInfoModal(true)} />

      <main>
        <InvestimentsCard title="Investimentos">
          <AfinzListCell
            icon={<AfinzBarCharUpIcon />}
            onClick={() =>
              navigate(afinzAppPaths.investiment.investimentPosition.asRoute)
            }
            title={
              <p className={`${styles.titleLT} small`}>
                Posição das Aplicações
              </p>
            }
            trailing={<AfinzKeyboardArrowRightIcon />}
          />
          <AfinzListCell
            icon={<AfinzReceiptLongIcon />}
            title={<p className={`${styles.titleLT} small`}>Extrato</p>}
            onClick={() =>
              navigate(afinzAppPaths.investiment.investimentsStatement.asRoute)
            }
            trailing={<AfinzKeyboardArrowRightIcon />}
          />
        </InvestimentsCard>

        <InvestimentsCard title="Informe de Rendimentos">
          <AfinzListCell
            icon={<AfinzFileCopyIcon />}
            onClick={() => setShowSendModal(true)}
            title={<p className={`${styles.titleLT} small`}>Emissão</p>}
            trailing={<AfinzKeyboardArrowRightIcon />}
          />
        </InvestimentsCard>
      </main>

      <InvestimentsDialogs
        showSendModal={showSendModal}
        setShowSendModal={setShowSendModal}
        showInfoModal={showInfoModal}
        setShowInfoModal={setShowInfoModal}
        year={year}
        setYear={setYear}
        loading={loading}
        handleDownloadIncome={handleDownloadIncome}
      />
    </div>
  );
}
