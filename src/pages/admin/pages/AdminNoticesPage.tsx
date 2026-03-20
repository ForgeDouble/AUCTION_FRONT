// src/pages/admin/pages/AdminNoticesPage.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Pencil, Trash2, Pin, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { SectionTitle } from "../components/AdminUi";
import type { NoticeCategory, NoticeRow } from "../adminTypes";
import { ImportanceBlocks } from "../components/ImportanceBlocks";
import { applyUiError } from "@/hooks/applyUiError";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

function formatKST(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function categoryLabel(c: NoticeCategory): string {
  const map: Record<NoticeCategory, string> = {
    HANDOVER: "인수인계",
    SYSTEM: "시스템/운영",
    POLICY: "정책/규정",
    ETC: "기타",
  };
  return map[c];
}

const AdminNoticesPage: React.FC = () => {
  const nav = useNavigate();
  const { showError, showLogin, showWarning } = useModal();
  const { logout } = useAuth();
  const { noticesLoadErr } = useAdminStore();
  const shownErrRef = useRef<string | null>(null);

  const uiDeps = useMemo(() => {
    const fallback = "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    return {
      showLogin: (mode?: "navigation" | "confirm") => showLogin(mode ?? "confirm"),
      showWarning: (msg: string) => showError(msg),
      showError: (msg?: string) => showError(msg ?? fallback),
      logout: () => logout(),
      navigate: (to: string) => nav(to),
    };
  }, [showError, showLogin, logout, nav]);

  useEffect(() => {
    if (!noticesLoadErr) return;
    if (shownErrRef.current === noticesLoadErr) return;

    shownErrRef.current = noticesLoadErr;
    showError(noticesLoadErr);
  }, [noticesLoadErr, showError]);

  const {notices, addNotice, updateNotice, deleteNotice, noticePage, noticeTotalPages, noticeTotalElements, goNoticePage, } = useAdminStore();

  const [createForm, setCreateForm] = useState({
    category: "HANDOVER" as NoticeCategory,
    title: "",
    content: "",
    pinned: false,
    importance: 50,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<null | {
    category: NoticeCategory;
    title: string;
    content: string;
    pinned: boolean;
    importance: number;
  }>(null);

  // const filtered = useMemo(() => {
  //   const q = query.trim().toLowerCase();
  //   const base = q
  //     ? notices.filter((n) => {
  //         const t = n.title.toLowerCase();
  //         const c = n.content.toLowerCase();
  //         const a = (n.authorNickname || "").toLowerCase();
  //         return t.includes(q) || c.includes(q) || a.includes(q);
  //       })
  //     : notices;

  //   return base.slice().sort((a, b) => {
  //     if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  //     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  //   });
  // }, [notices, query]);
  const pageButtons = useMemo(() => {
    const total = Math.max(1, noticeTotalPages);
    const cur = Math.max(0, Math.min(noticePage, total - 1));
    const start = Math.max(0, cur - 2);
    const end = Math.min(total - 1, cur + 2);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [noticePage, noticeTotalPages]);
  const Pager = (
    <div className="mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3">
      <div className="text-[11px] text-gray-600">
        총 {noticeTotalElements.toLocaleString()}건 · {noticePage + 1}/{Math.max(1, noticeTotalPages)}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onGoPage(noticePage - 1)}
          disabled={noticePage <= 0}
          className={
            "px-2 py-1 rounded-lg border text-sm flex items-center gap-1 " +
            (noticePage <= 0
              ? "border-gray-200 text-gray-300 bg-white cursor-not-allowed"
              : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50")
          }
          title="이전"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {pageButtons.map((p) => (
            <button
              key={p}
              onClick={() => onGoPage(p)}
              className={
                "min-w-[32px] px-2 py-1 rounded-lg border text-[12px] " +
                (p === noticePage
                  ? "border-[rgb(118_90_255)] bg-[rgb(118_90_255)] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")
              }
            >
              {p + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => onGoPage(noticePage + 1)}
          disabled={noticePage + 1 >= Math.max(1, noticeTotalPages)}
          className={
            "px-2 py-1 rounded-lg border text-sm flex items-center gap-1 " +
            (noticePage + 1 >= Math.max(1, noticeTotalPages)
              ? "border-gray-200 text-gray-300 bg-white cursor-not-allowed"
              : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50")
          }
          title="다음"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const startEdit = (n: NoticeRow) => {
    setEditingId(n.id);
    setEditForm({
      category: n.category,
      title: n.title,
      content: n.content,
      pinned: n.pinned,
      importance: n.importance,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const submitCreate = async () => {
    
    if (!createForm.title.trim()) {
      showWarning("제목은 필수입니다.");
      return;
    }
    if (!createForm.content.trim()) {
      showWarning("내용은 필수입니다.");
      return;
    }
    if (createForm.importance < 0 || createForm.importance > 100) {
      showWarning("중요도는 0~100 범위여야 합니다.");
      return;
    }

    try {
      await addNotice({
        category: createForm.category,
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        pinned: createForm.pinned,
        importance: createForm.importance,
      });

      setCreateForm({
        category: "HANDOVER",
        title: "",
        content: "",
        pinned: false,
        importance: 50,
      });
    } catch (e) {
      applyUiError(e, uiDeps);
    }
  };

  const submitEdit = async () => {
    if (editingId === null || !editForm) return;

    if (!editForm.title.trim()) {
      showWarning("제목은 필수입니다.");
      return;
    }
    if (!editForm.content.trim()) {
      showWarning("내용은 필수입니다.");
      return;
    }
    if (editForm.importance < 0 || editForm.importance > 100) {
      showWarning("중요도는 0~100 범위여야 합니다.");
      return;
    }

    try {
      await updateNotice(editingId, {
        category: editForm.category,
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        pinned: editForm.pinned,
        importance: editForm.importance,
      });
      cancelEdit();
    } catch (e) {
      applyUiError(e, uiDeps);
    }
  };

  // const onDelete = async (id: number) => {
  //   const ok = window.confirm("정말 삭제할까요?");
  //   if (!ok) return;

  //   try {
  //     await deleteNotice(id);
  //   } catch (e) {
  //     applyUiError(e, uiDeps);
  //   }
  // };

  const onGoPage = async (p: number) => {
    try {
      await goNoticePage(p);
    } catch (e) {
      applyUiError(e, uiDeps);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle title="인수인계 / 공지" />
        <br></br>
        {noticeTotalPages > 1 ? Pager : null}
        {editingId !== null && editForm && (
          <div className="mb-4 p-3 rounded-xl bg-[rgb(118_90_255)]/10 border border-[rgb(118_90_255)]/20">
            <div className="text-sm font-semibold text-[rgb(65_50_140)]">공지 수정</div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[11px] text-gray-600 mb-1">카테고리</div>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((p) => (p ? { ...p, category: e.target.value as NoticeCategory } : p))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="HANDOVER">인수인계</option>
                    <option value="SYSTEM">시스템/운영</option>
                    <option value="POLICY">정책/규정</option>
                    <option value="ETC">기타</option>
                  </select>
                </div>

                <div>
                  <div className="text-[11px] text-gray-600 mb-1">중요도(0~100)</div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.importance}
                    onChange={(e) => setEditForm((p) => (p ? { ...p, importance: Number(e.target.value) } : p))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.pinned}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, pinned: e.target.checked } : p))}
                />
                상단 고정
              </label>

              <div>
                <div className="text-[11px] text-gray-600 mb-1">제목</div>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, title: e.target.value } : p))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <div className="text-[11px] text-gray-600 mb-1">내용</div>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, content: e.target.value } : p))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[160px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={submitEdit} className="px-3 py-2 rounded-xl bg-[rgb(118_90_255)] hover:bg-[rgb(104_79_224)] text-white text-sm">
                  저장
                </button>
                <button onClick={cancelEdit} className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm">
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {notices.map((n) => (
            <div key={n.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                      {categoryLabel((n.category ?? "ETC") as NoticeCategory)}
                    </span>

                    {n.pinned ? (
                      <span className="text-[11px] px-2 py-1 rounded-full bg-[rgb(118_90_255)] text-white inline-flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        고정
                      </span>
                    ) : null}

                    <span className="text-[11px] px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-800 inline-flex items-center gap-2"> 
                      <ImportanceBlocks value={n.importance} /> </span>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-gray-900 break-words">{n.title}</div>

                  <div className="mt-1 text-[11px] text-gray-500">
                    by {n.authorNickname?.trim() ? n.authorNickname : (n.authorEmail?.trim() ? n.authorEmail : "알 수 없음")} · {formatKST(n.createdAt)}
                    {n.updatedAt && n.updatedAt !== n.createdAt ? <span> · 수정 {formatKST(n.updatedAt)}</span> : null}
                  </div>

                  
                  {/* <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {n.content?.trim() ? n.content : "(내용 없음)"}
                  </div> */}
                </div>

                <div className="shrink-0 inline-flex items-center gap-2">
                  <button
                    onClick={() => startEdit(n)}
                    className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => {
                      const ok = window.confirm("정말 삭제할까요?");
                      if (!ok) return;
                      deleteNotice(n.id);
                    }}
                    className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">{n.content}</div>
            </div>
          ))}

          {notices.length === 0 && <div className="py-10 text-center text-gray-500">공지 검색 결과가 없습니다.</div>}
           {/* {noticeTotalPages > 1 ? Pager : null} */}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle title="공지 작성" />
        <br></br>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-gray-500 mb-s1">카테고리</div>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value as NoticeCategory }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
              >
                <option value="HANDOVER">인수인계</option>
                <option value="SYSTEM">시스템/운영</option>
                <option value="POLICY">정책/규정</option>
                <option value="ETC">기타</option>
              </select>
            </div>

            <div>
              <div className="text-[11px] text-gray-500 mb-1">중요도(0~100)</div>
              <input
                type="number"
                min={0}
                max={100}
                value={createForm.importance}
                onChange={(e) => setCreateForm((p) => ({ ...p, importance: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={createForm.pinned}
              onChange={(e) => setCreateForm((p) => ({ ...p, pinned: e.target.checked }))}
            />
            상단 고정
          </label>

          <div>
            <div className="text-[11px] text-gray-500 mb-1">제목</div>
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          <div>
            <div className="text-[11px] text-gray-500 mb-1">내용</div>
            <textarea
              value={createForm.content}
              onChange={(e) => setCreateForm((p) => ({ ...p, content: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[180px]"
            />
          </div>

          <button onClick={submitCreate} className="w-full px-3 py-2 rounded-xl bg-[rgb(118_90_255)] hover:bg-[rgb(104_79_224)] text-white text-sm">
            등록
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNoticesPage;
