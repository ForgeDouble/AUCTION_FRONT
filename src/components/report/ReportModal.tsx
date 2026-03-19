// src/components/report/ReportModal.tsx
import React, { useMemo, useState, useEffect } from "react";
import { X, Siren } from "lucide-react";
import {
  createProductReport,
  createUserReport,
  type ReportCategory,
} from "@/pages/report/reportApi";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { handleApiError } from "@/errors/HandleApiError";

type Mode = "USER" | "PRODUCT";

const CATEGORIES: Array<{ key: ReportCategory; label: string; desc: string }> = [
  { key: "SPAM", label: "스팸", desc: "도배/반복/무의미한 내용" },
  { key: "AD", label: "광고", desc: "홍보/외부 링크/상업성" },
  { key: "ABUSE", label: "욕설/비방", desc: "모욕/괴롭힘/인신공격" },
  { key: "HATE", label: "혐오", desc: "차별/혐오 표현" },
  { key: "SCAM", label: "사기", desc: "허위/사기 의심" },
  { key: "OTHER", label: "기타", desc: "기타 사유" },
];

export type ReportModalProps = {
  open: boolean;
  onClose: () => void;

  mode: Mode;

  // USER 신고 시
  targetUserId?: number;
  targetUserName?: string | null;

  // PRODUCT 신고 시
  productId?: number;
  productName?: string | null;

  onSubmitted?: () => void;
};

const overlayCls =
  "fixed inset-0 z-[40] bg-black/60 flex items-center justify-center p-4";
const panelCls =
  "w-full max-w-[520px] rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden";

const btnBase =
  "h-10 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2";
const inputBase =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200";

function isDuplicateReportMsg(msg?: string) {
  const m = String(msg ?? "").trim();
  return /중복|이미\s*신고|already/i.test(m);
}

export default function ReportModal(props: ReportModalProps) {
  const {
    open,
    onClose,
    mode,
    targetUserId,
    targetUserName,
    productId,
    productName,
    onSubmitted,
  } = props;

  // const showCategory = mode === "USER";
  const showCategory = true;
  const title = useMemo(() => {
    return mode === "USER" ? "유저 신고하기" : "상품 신고하기";
  }, [mode]);

  const subjectLine = useMemo(() => {
    if (mode === "USER") {
      const nm = (targetUserName ?? "").trim();
      return nm ? `${nm} (#${targetUserId})` : `유저 #${targetUserId ?? "-"}`;
    }
    const pn = (productName ?? "").trim();
    return pn
      ? `${pn} (productId ${productId})`
      : `productId ${productId ?? "-"}`;
  }, [mode, targetUserId, targetUserName, productId, productName]);

  const [category, setCategory] = useState<ReportCategory>("OTHER");
  const [content, setContent] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { showLogin, showWarning, showError } = useModal();

  const closeThen = (fn: () => void) => {
    onClose();
    setTimeout(fn, 0);
  };

  const canSubmit =
    mode === "USER"
      ? typeof targetUserId === "number" && targetUserId > 0
      : typeof productId === "number" && productId > 0;

  useEffect(() => {
    if (!open) return;
    setContent("");
    setCategory("OTHER");
  }, [open, mode]);

  if (!open) return null;

  const applyReportUiError = (e: unknown) => {
    const r = handleApiError(e);

    if (r.type === "AUTH") {
      closeThen(() => showLogin("confirm"));
      return;
    }

    if (r.type === "REDIRECT") {
      onClose();
      navigate(r.to);
      return;
    }

    if (r.type === "WARNING" || r.type === "DIALOG" || r.type === "MODAL") {
      if (isDuplicateReportMsg(r.message)) {
        closeThen(() => showError(r.message));
        return;
      }
      closeThen(() => showWarning(r.message));
      return;
    }

    if (r.type === "IGNORE") {
      onClose();
      return;
    }

    closeThen(() => showError(r.message ?? "서버 오류가 발생했습니다."));
  };

  const submit = async () => {
    if (!canSubmit) {
      closeThen(() => showWarning("신고 대상 정보가 없습니다."));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "USER") {
        await createUserReport({
          targetId: targetUserId as number,
          category,
          content: content.trim() ? content.trim() : null,
          targetType: "USER",
        });
      } else {
        await createProductReport({
          productId: productId as number,
          category,
          content: content.trim() ? content.trim() : null,
        });
      }

      onSubmitted?.();
      closeThen(() => showWarning("신고가 접수되었습니다."));
    } catch (e) {
      console.error(e);
      applyReportUiError(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={overlayCls} onMouseDown={onClose}>
      <div className={panelCls} onMouseDown={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <Siren className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-[15px] font-extrabold text-gray-900">
                {title}
              </div>
              <div className="text-[11px] text-gray-500">{subjectLine}</div>
            </div>
          </div>

          <button
            className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
            onClick={onClose}
            aria-label="close"
            disabled={submitting}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {showCategory ? (
            <div>
              <div className="text-[12px] font-semibold text-gray-800 mb-1">
                신고 카테고리
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className={inputBase}
                disabled={submitting}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label} ({c.key})
                  </option>
                ))}
              </select>
              <div className="mt-1 text-[11px] text-gray-500">
                {CATEGORIES.find((x) => x.key === category)?.desc ?? ""}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 leading-relaxed">
              상품 신고는 현재 서버 정책상 카테고리가 OTHER로 저장됩니다.
              (원하면 ProductReportCreateDto에 category를 추가해서 확장 가능)
            </div>
          )}

          <div>
            <div className="text-[12px] font-semibold text-gray-800 mb-1">
              상세 내용(선택)
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={inputBase + " min-h-[120px] resize-none"}
              placeholder="구체적인 사유를 작성해주세요 (최대 500자 권장)"
              disabled={submitting}
            />
          </div>

          <div className="text-[11px] text-gray-500 leading-relaxed">
            안내: 동일 대상에 대해서는 중복 신고가 제한됩니다. (대상당 1회)
          </div>
        </div>


        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            className={
              btnBase +
              " border border-gray-200 hover:bg-gray-50 text-gray-700"
            }
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>
          <button
            className={
              btnBase +
              " bg-red-600 hover:bg-red-700 text-white " +
              (!canSubmit || submitting ? "opacity-60 cursor-not-allowed" : "")
            }
            onClick={submit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "접수 중..." : "신고 접수"}
          </button>
        </div>
      </div>
    </div>
  );
}