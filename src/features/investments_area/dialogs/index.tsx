import { AfinzModal } from "@afinz/design-system";
import { HelpContent } from "./help_content";
import { SendIncomeDialog } from "./send_income";

type InvestimentsDialogsProps = {
  showSendModal: boolean;
  setShowSendModal: (state: boolean) => void;
  showInfoModal: boolean;
  setShowInfoModal: (state: boolean) => void;
  year: string;
  setYear: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  handleDownloadIncome: () => void;
};

export function InvestimentsDialogs({
  showSendModal,
  setShowSendModal,
  showInfoModal,
  setShowInfoModal,
  year,
  setYear,
  loading,
  handleDownloadIncome,
}: InvestimentsDialogsProps) {
  return (
    <>
      {showSendModal && (
        <div style={{ position: "absolute" }}>
          <SendIncomeDialog
            onClickClose={() => setShowSendModal(false)}
            onClickDownload={handleDownloadIncome}
            year={year}
            setYear={setYear}
            loading={loading}
          />
        </div>
      )}

      {showInfoModal && (
        <div style={{ position: "absolute" }}>
          <AfinzModal closeCallback={() => setShowInfoModal(false)}>
            <HelpContent onClickClose={() => setShowInfoModal(false)} />
          </AfinzModal>
        </div>
      )}
    </>
  );
}
