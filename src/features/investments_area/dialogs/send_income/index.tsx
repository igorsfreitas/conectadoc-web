import {
  AfinzButton,
  AfinzCalendarClockIcon,
  AfinzClose,
  AfinzModal,
  AfinzSelectWithInput,
} from "@afinz/design-system";
import { Dispatch, SetStateAction } from "react";
import styles from "./style.module.scss";

export function SendIncomeDialog({
  onClickDownload,
  onClickClose,
  year,
  setYear,
  loading,
}: {
  onClickClose: VoidFunction;
  onClickDownload: VoidFunction;
  year: string;
  setYear: Dispatch<SetStateAction<string>>;
  loading: boolean;
}) {
  const options = [
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    "2025",
    "2026",
  ];

  function renderOptions() {
    return (
      <>
        {options.map((_year) => {
          return (
            <li
              key={_year}
              className={styles.option}
              onClick={() => setYear(_year)}
            >
              {_year}
            </li>
          );
        })}
      </>
    );
  }

  return (
    <AfinzModal closeCallback={onClickClose}>
      <div className={styles.sendIncome}>
        <div className={styles.content}>
          <div className={styles.titleBar}>
            <div className={styles.headerText}>
              <h6>Relatório de informe de rendimentos</h6>

              <AfinzButton type="text" onClick={onClickClose}>
                <AfinzClose className={styles.closeIcon} />
              </AfinzButton>
            </div>
          </div>
          <div className={styles.body}>
            <div className={styles.info}>
              <AfinzCalendarClockIcon />
              <div className={styles.infoText}>
                <p className="subtitle-primary">Escolha o ano</p>
                <span className="subtitle-secondary">
                  O ano será usado de referência para o relatório de informe de
                  rendimentos.
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                gap: "3rem",
              }}
            >
              <AfinzSelectWithInput
                value={year}
                label="Ano"
                onChangeSearchedText={() => {}}
              >
                <div className={styles.options}>
                  <ul>{renderOptions()}</ul>
                </div>
              </AfinzSelectWithInput>

              <AfinzButton
                type="primary"
                size="big"
                onClick={onClickDownload}
                isLoading={loading}
              >
                Gerar informe
              </AfinzButton>
            </div>
          </div>
        </div>
      </div>
    </AfinzModal>
  );
}
