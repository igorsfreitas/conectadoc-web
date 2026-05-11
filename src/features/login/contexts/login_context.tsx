import { AfinzInfoIcon, Toast } from "@afinz/design-system";
import { AfinzApiError } from "@afinz/rest-client";
import { AfinzTextUtil } from "@afinz/utils";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { afinzStorageKeys } from "../../../infra/afinz_storage/afinz_storage_keys";
import { ToastContext } from "../../../infra/contexts/toast_context";
import { useAfinzNavigate } from "../../../infra/hooks/afinz_navigator";
import { useInject } from "../../../infra/hooks/inject";
import { afinzAppPaths } from "../../../infra/router/paths/afinz_app";
import { AuthService } from "../../../infra/services/auth/auth.service";

export enum LoginFlow {
  resetPassword = "reset-password",
  firstAccess = "first-access",
  emptyState = "empty-state",
}

interface LoginContextData {
  showFirstViewModal: boolean;
  handleCloseFirstViewModal: () => void;

  actionDocumentNumber: string;
  setActionDocumentNumber: (value: string) => void;

  documentNumber: string;
  setDocumentNumber: React.Dispatch<React.SetStateAction<string>>;

  formattedDocumentNumber: string;

  flow: LoginFlow;
  setFlow: (flow: LoginFlow) => void;

  isError: boolean;
  isLoading: boolean;

  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;

  challengeId: string;
  ttlSeconds: number;
  receiverOtpMail: string;

  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;

  errorCode: string | null;
  setErrorCode: React.Dispatch<React.SetStateAction<string | null>>;

  handleConfirm: (cb: VoidFunction) => Promise<void>;
  handleFirstAccess: (cb: VoidFunction) => Promise<void>;
  handleResetPassword: (cb: VoidFunction) => Promise<void>;
  handleChangePassword: (password: string) => Promise<boolean>;
  handleLogin: VoidFunction;

  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;

  clickFirstAccess: (openDrawer: VoidFunction) => void;
}

const LoginContext = createContext<LoginContextData>({} as LoginContextData);

interface LoginManagerProps {
  children: ReactNode;
}

export function LoginManager({ children }: LoginManagerProps) {
  const [showFirstViewModal, setShowFirstViewModal] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const [actionDocumentNumber, _setActionDocumentNumber] = useState("");
  const [receiverOtpMail, setReceiverOtpMail] = useState("");
  const [password, setPassword] = useState("");
  const [flow, setFlow] = useState<LoginFlow>(LoginFlow.emptyState);

  const [errorCode, setErrorCode] = useState<string | null>(null);

  const [challengeId, setChallengeId] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState(0);
  const [code, setCode] = useState("");

  const [resetToken, setResetToken] = useState("");

  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [visible, setVisible] = useState(false);

  const navigate = useAfinzNavigate();

  const authService = useInject("AuthService") as AuthService;

  const toastManager = useContext(ToastContext);

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits.length <= 11
      ? AfinzTextUtil.toCpfFormat(digits)
      : AfinzTextUtil.toCnpjFormat(digits);
  };

  const setActionDocumentNumber = (value: string) => {
    const formatted = formatDocument(value);
    _setActionDocumentNumber(formatted);
  };

  const formattedDocumentNumber = formatDocument(documentNumber);

  useEffect(() => {
    checkFirstViewIbStorage();
  }, []);

  const checkFirstViewIbStorage = () => {
    const isFirstTime: boolean = JSON.parse(
      localStorage.getItem(afinzStorageKeys.pinFirstAccess) ?? "true",
    );

    if (isFirstTime) {
      setShowFirstViewModal(true);
    }
  };

  const handleCloseFirstViewModal = () => {
    localStorage.setItem(afinzStorageKeys.pinFirstAccess, "false");
    setShowFirstViewModal(false);
  };

  const handleFirstAccess = async (callback: () => void) => {
    setIsLoading(true);
    setIsError(false);

    const document = actionDocumentNumber.replace(/[^0-9]/g, "");

    try {
      const challenge = await authService.firstAccess({
        document,
      });

      if (challenge instanceof AfinzApiError) {
        throw challenge;
      }

      setChallengeId(challenge.challenge_id);
      setTtlSeconds(challenge.ttl_seconds);
      setReceiverOtpMail(challenge.destination);

      callback();
    } catch (error) {
      setIsError(true);

      if (error instanceof AfinzApiError) {
        let message: string;
        switch (error.content.responseData.messages) {
          case "User already exists for the given partner and product.":
            message = "Usuário já realizou o primeiro acesso.";
            break;
          case "No user found in central registry.":
            message = "Usuário não possui cadastro.";
            break;
          default:
            message = "Ocorreu um erro ao enviar o código.";
            break;
        }

        toastManager?.addToast((currentIndex) => (
          <Toast
            key={currentIndex}
            type="error"
            text={message}
            icon={<AfinzInfoIcon />}
            onClose={() => toastManager?.removeToast(currentIndex)}
          />
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (callback: () => void) => {
    setIsLoading(true);
    setIsError(false);

    const document = actionDocumentNumber.replace(/[^0-9]/g, "");

    try {
      const challenge = await authService.sendOtp({
        document,
      });

      if (challenge instanceof AfinzApiError) {
        throw challenge;
      }

      setChallengeId(challenge.challenge_id);
      setTtlSeconds(challenge.ttl_seconds);
      setReceiverOtpMail(challenge.destination);

      callback();
    } catch (error) {
      setIsError(true);
      if (error instanceof AfinzApiError) {
        let message: string;
        switch (error.content.responseData.messages) {
          case "Invalid partner or caller configuration":
            message = "Usuário ainda não fez o primeiro acesso.";
            break;
          default:
            message = "Ocorreu um erro ao enviar o código.";
            break;
        }

        toastManager?.addToast((currentIndex) => (
          <Toast
            key={currentIndex}
            type="error"
            text={message}
            icon={<AfinzInfoIcon />}
            onClose={() => toastManager?.removeToast(currentIndex)}
          />
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (callback: () => void) => {
    setIsLoading(true);
    setIsError(false);

    try {
      const accessToken = await authService.verifyOtp({
        challenge_id: challengeId,
        code,
      });

      if (accessToken instanceof AfinzApiError) {
        toastManager?.addToast((currentIndex) => (
          <Toast
            key={currentIndex}
            type="error"
            text={
              accessToken.status == 404
                ? "Código invalido"
                : accessToken.message
            }
            icon={<AfinzInfoIcon />}
            onClose={() => toastManager?.removeToast(currentIndex)}
          />
        ));
        throw accessToken;
      }

      setResetToken(accessToken.reset_token);

      callback();
    } catch {
      setErrorCode(code);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (password: string) => {
    setIsLoading(true);
    setIsError(false);

    try {
      const resetPassword = await authService.resetPassword({
        new_password: password,
        reset_token: resetToken,
      });

      if (resetPassword instanceof AfinzApiError) {
        throw Error("Código inválido. Por favor, tente novamente.");
      }

      return true;
    } catch (error) {
      setIsError(true);
      console.log(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setIsError(false);

    const document = documentNumber.replace(/[^0-9]/g, "");

    try {
      const login = await authService.login({
        login: document,
        password: password,
      });

      if (login instanceof AfinzApiError) {
        const message: string | null =
          login.status == 401 ? "Documento ou senha incorretos" : login.message;
        if (login.status !== 500) {
          toastManager?.addToast((currentIndex) => (
            <Toast
              key={currentIndex}
              type="error"
              text={message ?? login.message}
              onClose={() => toastManager?.removeToast(currentIndex)}
            />
          ));
          return;
        }
        toastManager?.addToast((currentIndex) => (
          <Toast
            key={currentIndex}
            type="error"
            text="Erro interno no servidor"
            onClose={() => toastManager?.removeToast(currentIndex)}
          />
        ));
        return;
      }

      localStorage.setItem(afinzStorageKeys.token, login.access_token);
      localStorage.setItem(afinzStorageKeys.refreshToken, login.refresh_token);
      localStorage.setItem(afinzStorageKeys.authenticatedCpf, document);

      navigate(afinzAppPaths.investiment.asRoute);
    } catch (error) {
      setIsError(true);
      console.log(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clickFirstAccess = (openDrawer: VoidFunction) => {
    handleCloseFirstViewModal();
    openDrawer();
  };

  const contextValue: LoginContextData = {
    showFirstViewModal,
    handleCloseFirstViewModal,
    documentNumber,
    formattedDocumentNumber,
    setDocumentNumber,
    actionDocumentNumber,
    setActionDocumentNumber,
    flow,
    setFlow,
    isError,
    isLoading,
    password,
    setPassword,
    handleConfirm,
    challengeId,
    code,
    setCode,
    ttlSeconds,
    handleFirstAccess,
    handleResetPassword,
    errorCode,
    setErrorCode,
    handleChangePassword,
    receiverOtpMail,
    handleLogin,
    visible,
    setVisible,
    clickFirstAccess,
  };

  return (
    <LoginContext.Provider value={contextValue}>
      {children}
    </LoginContext.Provider>
  );
}

export function useLoginContext() {
  const context = useContext(LoginContext);
  if (!context) {
    throw new Error("useLoginContext must be used within LoginManager");
  }
  return context;
}
