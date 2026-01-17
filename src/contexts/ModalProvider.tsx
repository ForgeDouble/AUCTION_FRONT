import { useState, type ReactNode } from "react";

import LoginModal from "@/components/LoginModal";
import ErrorModal from "@/components/ErrorModal";
import LoadingModal from "@/components/LoadingModal";
import { ModalContext } from "./ModalContext";
import WarningModal from "@/components/WarningModal";

interface ModalProviderProps {
  children: ReactNode;
}

export default function ModalProvider({ children }: ModalProviderProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  const showLogin = () => setShowLoginModal(true);

  const showError = (message = "서버 오류가 발생했습니다.") => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const showWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarningModal(true);
  };

  const showLoading = (message = "로딩 중입니다...") => {
    setLoadingMessage(message);
    setShowLoadingModal(true);
  };

  const hideLoading = () => setShowLoadingModal(false);

  return (
    <ModalContext.Provider
      value={{ showLogin, showError, showWarning, showLoading, hideLoading }}
    >
      {children}

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
      {showErrorModal && (
        <ErrorModal
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      )}
      {showWarningModal && (
        <WarningModal
          message={warningMessage}
          onClose={() => setShowWarningModal(false)}
        />
      )}
      {showLoadingModal && <LoadingModal message={loadingMessage} />}
    </ModalContext.Provider>
  );
}
