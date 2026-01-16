import { createContext, useContext } from "react";

interface ModalContextType {
  showLogin: () => void;
  showError: (message?: string) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(
  undefined
);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};
