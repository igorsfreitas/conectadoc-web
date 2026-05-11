import {
  AfinzButton,
  AfinzCalendarClockIcon,
  AfinzExportIcon,
  AfinzKeyboardArrowDownIcon,
  AfinzPeopleOutlineIcon,
  DatePicker,
} from "@afinz/design-system";
import styles from "./style.module.scss";
import EmptyState from "../../components/empty_state";
import { useInvestimentsPositionViewModel } from "./use_investiments_position.view-model";

export function InvestimentsPosition() {
  const {
    TABLE_HEADER_ITEMS,
    dateButtonRef,
    formatDate,
    handleCloseCalendar,
    handleDateChange,
    handleGetApplicationPosition,
    isCalendarOpen,
    loading,
    positions,
    showList,
    toggleCalendar,
    selectedDate,
    toMoneyFormat,
    profile,
    handleDownloadPdf,
    isDownloadingPdf,
  } = useInvestimentsPositionViewModel();

  const isEmpty = showList && (!positions || positions.length === 0);

  return (
    <div className={styles.content}>
      <header className={styles.contentTitle}>
        <div className={styles.contentText}>
          <h6>Posição de Investimentos</h6>
        </div>
        <div className={styles.iconsMenuTop}>
          <div className={styles.slot}>
            <AfinzButton
              type="text"
              leadingIcon={<AfinzExportIcon />}
              onClick={() => handleDownloadPdf()}
              disabled={!showList}
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

              <div className={styles.dateAndAction} ref={dateButtonRef}>
                <AfinzButton
                  type="text"
                  leadingIcon={<AfinzCalendarClockIcon />}
                  trailingIcon={<AfinzKeyboardArrowDownIcon />}
                  size="medium"
                  onClick={toggleCalendar}
                >
                  <>Posição {formatDate(selectedDate)}</>
                </AfinzButton>

                <DatePicker
                  isOpen={isCalendarOpen}
                  onClose={handleCloseCalendar}
                  onChange={handleDateChange}
                  initialDate={selectedDate}
                  disableWeekends
                  position={{ top: "calc(100% + 8px)", right: 0 }}
                />
              </div>

              <AfinzButton
                type="primary"
                size="medium"
                onClick={handleGetApplicationPosition}
                isLoading={loading}
              >
                Consultar
              </AfinzButton>
            </div>

            {showList && !isEmpty && (
              <div className={styles.tableContainer}>
                <table className={styles.investmentTable}>
                  <thead>
                    <tr>
                      {TABLE_HEADER_ITEMS.map((item, index) => (
                        <th key={index}>{item}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {positions &&
                      positions.map((position) => {
                        return (
                          <tr key={position.id} style={{ cursor: "pointer" }}>
                            <td>{position.description || position.index}</td>
                            <td>{position.index}</td>
                            <td>{position.indexPercentage.toFixed(2)}%</td>
                            <td>{position.rate.toFixed(2)}</td>
                            <td>{position.startDate}</td>
                            <td>{position.endDate}</td>
                            <td>{toMoneyFormat(position.initialValue)}</td>
                            <td>{toMoneyFormat(position.incomeValue)}</td>
                            <td>{toMoneyFormat(position.grossValue)}</td>
                            <td>{toMoneyFormat(position.iofValue)}</td>
                            <td>{toMoneyFormat(position.irfValue)}</td>
                            <td>{toMoneyFormat(position.netValue)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {isEmpty && (
              <EmptyState
                title="Nenhuma posição encontrada"
                description="Não foram encontradas posições para a data selecionada. Tente consultar novamente em outra data ou verifique se há movimentações no período."
                primaryAction={{
                  label: "Consultar novamente",
                  onClick: handleGetApplicationPosition,
                  isLoading: loading,
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
