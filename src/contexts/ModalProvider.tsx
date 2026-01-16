import { useState, type ReactNode } from "react";

import LoginModal from "@/components/LoginModal";
import ErrorModal from "@/components/ErrorModal";
import LoadingModal from "@/components/LoadingModal";
import { ModalContext } from "./ModalContext";

interface ModalProviderProps {
  children: ReactNode;
}

export default function ModalProvider({ children }: ModalProviderProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  const showLogin = () => setShowLoginModal(true);

  const showError = (message = "서버 오류가 발생했습니다.") => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const showLoading = (message = "처리 중입니다...") => {
    setLoadingMessage(message);
    setShowLoadingModal(true);
  };

  const hideLoading = () => setShowLoadingModal(false);

  return (
    <ModalContext.Provider
      value={{ showLogin, showError, showLoading, hideLoading }}
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
      {showLoadingModal && <LoadingModal message={loadingMessage} />}
    </ModalContext.Provider>
  );
}
