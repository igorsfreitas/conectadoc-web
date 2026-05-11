import {
  AfinzButton,
  AfinzCalendarClockIcon,
  AfinzExportIcon,
  AfinzKeyboardArrowDownIcon,
  AfinzPeopleOutlineIcon,
  AfinzRangeDatePicker,
} from "@afinz/design-system";

import { InvestmentStatementCard } from "../../components/investiment_statement_card";
import styles from "./style.module.scss";
import EmptyState from "../../components/empty_state";
import { useInvestmentStatementViewModel } from "./use-investment-statement.view-model";

export function InvestimentsStatement() {
  const {
    triggerRef,
    formatDate,
    handleCloseCalendar,
    handleGetInvestiments,
    handleRangeChange,
    investimentStatement,
    loading,
    showList,
    toggleCalendar,
    dateRange,
    isCalendarOpen,
    profile,
    handleDownloadPdf,
    isDownloadingPdf,
  } = useInvestmentStatementViewModel();

  const hasProducts =
    investimentStatement &&
    investimentStatement.products &&
    investimentStatement.products.length > 0;
  const isEmpty = showList && !hasProducts;

  return (
    <div className={styles.content}>
      <header className={styles.contentTitle}>
        <div className={styles.contentText}>
          <h6>Extrato de Movimentação</h6>
        </div>
        <div className={styles.iconsMenuTop}>
          <div className={styles.slot}>
            <AfinzButton
              type="text"
              leadingIcon={<AfinzExportIcon />}
              disabled={!investimentStatement}
              onClick={() => handleDownloadPdf()}
              isLoading={isDownloadingPdf}
            >
              Exportar PDF
            </AfinzButton>
          </div>
        </div>
      </header>
      <main className={styles.body}>
        <div className={styles.box}>
          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.title}>
                <AfinzPeopleOutlineIcon />
                <div className={styles.texts}>
                  <span className="subtitle-secondary">Cliente</span>
                  <span className="subtitle-secondary">{profile?.name}</span>
                </div>
              </div>

              <span className="subtitle-secondary">
                Emissão:{" "}
                {new Date().toLocaleDateString("pt-BR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>

              <div className={styles.dateRangeTriggerWrapper} ref={triggerRef}>
                <AfinzButton
                  type="text"
                  leadingIcon={<AfinzCalendarClockIcon />}
                  trailingIcon={<AfinzKeyboardArrowDownIcon />}
                  size="medium"
                  onClick={toggleCalendar}
                >
                  <>
                    Periodo {formatDate(dateRange.startDate)} -{" "}
                    {formatDate(dateRange.endDate)}
                  </>
                </AfinzButton>

                <AfinzRangeDatePicker
                  isOpen={isCalendarOpen}
                  onClose={handleCloseCalendar}
                  onRangeChange={handleRangeChange}
                  initialStartDate={dateRange.startDate}
                  initialEndDate={dateRange.endDate}
                  position={{
                    left: "-12rem",
                  }}
                />
              </div>

              <AfinzButton
                type="primary"
                size="medium"
                onClick={handleGetInvestiments}
                isLoading={loading}
              >
                Consultar
              </AfinzButton>
            </div>
          </div>
        </div>
      </main>
      {showList &&
        hasProducts &&
        investimentStatement.products.map((value) => (
          <InvestmentStatementCard key={value.indexer} product={value} />
        ))}

      {showList && isEmpty && (
        <EmptyState
          title="Nenhuma movimentação encontrada"
          description="Não foram encontradas movimentações para o período selecionado. Tente consultar novamente em outro período ou verifique se há movimentações."
          primaryAction={{
            label: "Consultar novamente",
            onClick: handleGetInvestiments,
            isLoading: loading,
          }}
        />
      )}
    </div>
  );
}
