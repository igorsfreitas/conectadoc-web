import { useContext, useRef, useState } from "react";
import { useDrawerContext } from "../../../../infra/contexts/drawer_context";

import { ToastContext } from "../../../../infra/contexts/toast_context";

import { useInject } from "../../../../infra/hooks/inject";

import { FinancialInvestmentsService } from "../../../../infra/services/statement_investment/statement_investiment.service";

import { Toast } from "@afinz/design-system";
import { AfinzApiError } from "@afinz/rest-client";
import { AfinzNumberUtil, AfinzTextUtil } from "@afinz/utils";
import { ProfileContext } from "../../../../infra/contexts/profile";
import { AfinzPositionDetailsDrawer } from "../../drawers/position_details";
import { InvestmentPosition } from "../../models/investment_position.model";
import { AfinzFileUtils } from "../../../../infra/utils/afinz_file_utils";
import { formatToBrazilISO } from "../../../../infra/utils/afinz_locale_utils";

const TABLE_HEADER_ITEMS = [
  "DESCR.",
  "INDEX.",
  "% INDEX.",
  "TAXA",
  "DATA INÍCIO",
  "DATA VENCIMENTO",
  "VLR. INICIAL",
  "VLR. REND.",
  "VLR. BRUTO",
  "VLR. IOF",
  "VLR. IRF",
  "VLR. LQD",
];

export function useInvestimentsPositionViewModel() {
  const [showList, setShowList] = useState(false);
  const [positions, setPositions] = useState<InvestmentPosition[]>();
  const [loading, setLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { profile } = useContext(ProfileContext);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const toastContext = useContext(ToastContext);

  const { openEndDrawer, closeEndDrawer } = useDrawerContext();

  const statementInvestment = useInject(
    "FinancialInvestmentsService",
  ) as FinancialInvestmentsService;

  const dateButtonRef = useRef<HTMLDivElement>(null);

  async function handleGetApplicationPosition() {
    setLoading(true);

    const response = await statementInvestment.statementInvestment({
      dateIn: formatToBrazilISO(selectedDate),
      dateOut: formatToBrazilISO(selectedDate),
    });

    if (response instanceof AfinzApiError) {
      toastContext?.addToast((currentIndex) => (
        <Toast
          key={currentIndex}
          type="error"
          text="Erro ao buscar posição de aplicações: Resposta inválida"
          onClose={() => toastContext?.removeToast(currentIndex)}
        />
      ));
      setLoading(false);
      return;
    }

    setPositions(response);
    setShowList(true);
    setLoading(false);
  }

  async function handleDownloadPdf() {
    setIsDownloadingPdf(true);
    const response = await statementInvestment.downloadPositionPDF({
      dateIn: selectedDate.toISOString().split("T")[0],
      dateOut: selectedDate.toISOString().split("T")[0],
    });

    if (response instanceof AfinzApiError) {
      toastContext?.addToast((currentIndex) => (
        <Toast
          key={currentIndex}
          type="error"
          text="Erro ao gerar PDF de posições."
          onClose={() => toastContext?.removeToast(currentIndex)}
        />
      ));
      setIsDownloadingPdf(false);
      return;
    }

    AfinzFileUtils.downloadPDF(response, `Posições de investimento`);

    setIsDownloadingPdf(false);
  }

  function toggleCalendar() {
    setIsCalendarOpen(!isCalendarOpen);
  }

  function handleDateChange(date: Date) {
    setSelectedDate(date);
  }

  function handleCloseCalendar() {
    setIsCalendarOpen(false);
  }

  function handleOpenDrawer() {
    openEndDrawer(<AfinzPositionDetailsDrawer onClickClose={closeEndDrawer} />);
    setSelectedDate(new Date());
  }

  function parseTituloIndexador(sigla: string) {
    const indexadores = {
      DI: "CDI",
      PR: "IPCA",
      IP: "IPCA",
      PO: "Prefixado",
      F: "Prefixado",
      S: "Prefixado",
      SELIC: "SELIC",
    };

    const titulos = [
      "CDB",
      "RDB",
      "LFS",
      "LF",
      "LCI",
      "LCA",
      "DEB",
      "NTN",
      "LFT",
    ];

    titulos.sort((a, b) => b.length - a.length);

    for (const titulo of titulos) {
      if (sigla.startsWith(titulo)) {
        const resto = sigla.slice(titulo.length).toUpperCase();

        const indexador = Object.entries(indexadores).find(([chave]) =>
          resto.startsWith(chave),
        );

        return {
          titulo,
          indexador: indexador ? indexador[1] : "Desconhecido",
          original: sigla,
        };
      }
    }

    return {
      titulo: "Desconhecido",
      indexador: "Desconhecido",
      original: sigla,
    };
  }

  return {
    showList,
    positions,
    loading,
    handleGetApplicationPosition,
    toggleCalendar,
    handleDateChange,
    handleCloseCalendar,
    handleOpenDrawer,
    formatDate: AfinzTextUtil.formatDate,
    dateButtonRef,
    isCalendarOpen,
    TABLE_HEADER_ITEMS,
    selectedDate,
    toMoneyFormat: AfinzNumberUtil.toMoneyFormat,
    parseTituloIndexador,
    profile,
    handleDownloadPdf,
    isDownloadingPdf,
  };
}
