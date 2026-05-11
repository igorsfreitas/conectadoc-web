import { useContext, useState } from "react";
import { afinzStorageKeys } from "../../infra/afinz_storage/afinz_storage_keys";
import { ToastContext } from "../../infra/contexts/toast_context";

import { AfinzFileCopyIcon, Toast } from "@afinz/design-system";
import { AfinzApiError } from "@afinz/rest-client";
import { useAfinzNavigate } from "../../infra/hooks/afinz_navigator";
import { useInject } from "../../infra/hooks/inject";
import { FinancialInvestmentsService } from "../../infra/services/statement_investment/statement_investiment.service";
import { AfinzFileUtils } from "../../infra/utils/afinz_file_utils";

export function useInvestimentsViewModel() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [year, setYear] = useState((new Date().getFullYear() - 1).toString());
  const [loading, setLoading] = useState(false);

  const navigate = useAfinzNavigate();

  const toastContext = useContext(ToastContext);

  const statementInvestment = useInject(
    "FinancialInvestmentsService",
  ) as FinancialInvestmentsService;

  async function handleDownloadIncome() {
    setLoading(true);

    const reportFinancialIncomeCPF = localStorage.getItem(
      afinzStorageKeys.authenticatedCpf,
    );

    if (!reportFinancialIncomeCPF) {
      toastContext?.addToast((currentIndex) => (
        <Toast
          key={currentIndex}
          type="error"
          text="É necessário informar o CPF para baixar o informe de rendimentos!"
          icon={<AfinzFileCopyIcon />}
          onClose={() => toastContext?.removeToast(currentIndex)}
        />
      ));
      setShowSendModal(false);
      setLoading(false);
      return;
    }

    const response = await statementInvestment.reportFinancialIncomePDF({
      year,
    });

    if (response instanceof AfinzApiError) {
      toastContext?.addToast((currentIndex) => (
        <Toast
          key={currentIndex}
          type="error"
          text="Erro ao baixar o informe de rendimentos!"
          icon={<AfinzFileCopyIcon />}
          onClose={() => toastContext?.removeToast(currentIndex)}
        />
      ));
      setShowSendModal(false);
      setLoading(false);
      return;
    }

    toastContext?.addToast((currentIndex) => (
      <Toast
        key={currentIndex}
        type="success"
        text="Informe de rendimentos baixado com sucesso!"
        icon={<AfinzFileCopyIcon />}
        onClose={() => toastContext?.removeToast(currentIndex)}
      />
    ));
    AfinzFileUtils.downloadPDF(response, `afinz_investments_income`);
    setShowSendModal(false);
    setLoading(false);
  }

  return {
    showSendModal,
    setShowSendModal,
    showInfoModal,
    setShowInfoModal,
    year,
    setYear,
    loading,
    handleDownloadIncome,
    navigate,
  };
}
