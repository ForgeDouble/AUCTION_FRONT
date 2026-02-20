// hooks/applyUiError.ts
import type { ErrorState } from "@/errors/ErrorDto";
import { handleApiError } from "@/errors/HandleApiError";

type LoginMode = "navigation" | "confirm";

type ApplyUiErrorDeps = {
  showLogin: (mode?: LoginMode) => void;
  showWarning: (message: string) => void;
  showError: (message?: string) => void;
  logout?: () => void;
  hideLoading?: () => void;
  setErrorState?: (s: ErrorState | null) => void;
  navigate?: (to: string) => void;
};
const INTERNAL_MSG = "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.";

export function applyUiError(error: unknown, deps: ApplyUiErrorDeps) {
  const result = handleApiError(error);

  deps.hideLoading?.();

  switch (result.type) {
    case "AUTH":
      deps.showLogin("confirm");
      deps.logout?.();
      return;

    case "WARNING":
      deps.showWarning(result.message);
      return;

    case "DIALOG":
    case "MODAL":
    case "TOAST":
      deps.showWarning(result.message);
      return;

    case "ERROR":
      deps.showError(result.message ?? INTERNAL_MSG);
      return;

    case "REDIRECT": {
      if (deps.setErrorState) {
        deps.setErrorState({
          show: true,
          type: result.to === "/404" ? "404" : "500",
          title: result.to === "/404" ? "페이지를 찾을 수 없습니다" : "오류가 발생했습니다",
          message:
            result.to === "/404"
              ? "요청하신 페이지가 존재하지 않거나 삭제되었습니다."
              : "잠시 후 다시 시도해주세요.",
        });
        return;
      }
      deps.navigate?.(result.to);
      return;
    }

    case "IGNORE":
      return;

    case "FIELD_ERROR":
      return result;

    default:
      deps.showError(INTERNAL_MSG);
      return;
  }
}