import React, { useMemo, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { SectionTitle } from "../components/AdminUi";

function formatKST(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

const AdminNoticesPage: React.FC = () => {
  const { notices, query, markNoticeAck, addNotice } = useAdminStore();

  const titleRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notices;
    return notices.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
  }, [notices, query]);

  const submit = (): void => {
    const t = titleRef.current?.value || "";
    const b = bodyRef.current?.value || "";
    if (!t.trim() || !b.trim()) return;
    addNotice(t, b);
    if (titleRef.current) titleRef.current.value = "";
    if (bodyRef.current) bodyRef.current.value = "";
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle title="인수인계 / 공지" right={<span className="text-[11px] text-gray-500">검색 반영됨</span>} />

        <div className="space-y-2">
          {filtered
            .slice()
            .sort((a, b) => {
              if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{n.title}</div>
                    <div className="text-[11px] text-gray-500">by {n.author} · {formatKST(n.createdAt)}</div>
                  </div>
                  {!n.acknowledged ? (
                    <button
                      onClick={() => markNoticeAck(n.id)}
                      className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm"
                    >
                      확인
                    </button>
                  ) : (
                    <span className="text-[11px] text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      확인됨
                    </span>
                  )}
                </div>

                <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">{n.body}</div>
              </div>
            ))}

          {filtered.length === 0 && <div className="py-10 text-center text-gray-500">공지 검색 결과가 없습니다.</div>}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle title="공지 작성(관리자 인수인계)" />

        <div className="space-y-2">
          <div>
            <div className="text-[11px] text-gray-500 mb-1">제목</div>
            <input
              ref={titleRef}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              placeholder="예) 장애 대응 가이드 / 신고 처리 기준"
            />
          </div>

          <div>
            <div className="text-[11px] text-gray-500 mb-1">내용</div>
            <textarea
              ref={bodyRef}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[160px]"
              placeholder="인수인계 포인트, 체크리스트, 링크 등을 적어두세요."
            />
          </div>

          <button onClick={submit} className="w-full px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm">
            등록
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNoticesPage;
