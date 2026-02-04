import { createContext, useContext } from "react";

type LoginModalMode = "navigation" | "confirm";

interface ModalContextType {
  showLogin: (mode?: LoginModalMode) => void;
  showError: (message?: string) => void;
  showWarning: (message: string) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(
  undefined,
);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};
