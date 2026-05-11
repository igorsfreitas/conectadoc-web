import { Toast } from "@afinz/design-system";
import { AfinzApiError } from "@afinz/rest-client";
import { useContext, useRef, useState } from "react";
import { ProfileContext } from "../../../../infra/contexts/profile";
import { ToastContext } from "../../../../infra/contexts/toast_context";
import { useInject } from "../../../../infra/hooks/inject";
import { FinancialInvestmentsService } from "../../../../infra/services/statement_investment/statement_investiment.service";
import { StatementApplicationsResponse } from "../../models/statement_applications_api.model";
import { AfinzFileUtils } from "../../../../infra/utils/afinz_file_utils";

export function useInvestmentStatementViewModel() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(new Date().setDate(new Date().getDate() - 1)),
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [showList, setShowList] = useState(false);
  const [investimentStatement, setInvestimentStatement] =
    useState<StatementApplicationsResponse>();

  const { profile } = useContext(ProfileContext);

  const [loading, setLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const toastContext = useContext(ToastContext);

  const triggerRef = useRef<HTMLDivElement>(null);

  function toggleCalendar() {
    setIsCalendarOpen(!isCalendarOpen);
  }

  function handleCloseCalendar() {
    setIsCalendarOpen(false);
  }

  function handleRangeChange(startDate: Date, endDate: Date) {
    setDateRange({ startDate, endDate });
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString("pt-BR");
  }

  const statementInvestment = useInject(
    "FinancialInvestmentsService",
  ) as FinancialInvestmentsService;

  async function handleGetInvestiments() {
    setLoading(true);

    const response = await statementInvestment.statementApplications({
      name: "Tarciane",
      dateIn: dateRange.startDate.toISOString().split("T")[0],
      dateOut: dateRange.endDate.toISOString().split("T")[0],
    });

    if (response instanceof AfinzApiError) {
      toastContext?.addToast((currentIndex) => (
        <Toast
          key={currentIndex}
          type="error"
          text="Erro ao buscar extrato de transação"
          onClose={() => toastContext?.removeToast(currentIndex)}
        />
      ));
      setLoading(false);
      return;
    }

    setInvestimentStatement(response);
    setShowList(true);

    setLoading(false);
  }

  async function handleDownloadPdf() {
    setIsDownloadingPdf(true);
    const response = await statementInvestment.downloadStatementPDF({
      dateIn: dateRange.startDate.toISOString().split("T")[0],
      dateOut: dateRange.endDate.toISOString().split("T")[0],
    });

    if (response instanceof AfinzApiError) {
      toastContext?.addToast((currentIndex) => (
        <Toast
          key={currentIndex}
          type="error"
          text="Erro ao gerar PDF de extrato."
          onClose={() => toastContext?.removeToast(currentIndex)}
        />
      ));
      setIsDownloadingPdf(false);
      return;
    }

    AfinzFileUtils.downloadPDF(response, `Extrato de investimentos`);

    setIsDownloadingPdf(false);
  }

  return {
    triggerRef,
    handleGetInvestiments,
    formatDate,
    handleRangeChange,
    handleCloseCalendar,
    toggleCalendar,
    showList,
    investimentStatement,
    loading,
    dateRange,
    isCalendarOpen,
    profile,
    handleDownloadPdf,
    isDownloadingPdf,
  };
}
