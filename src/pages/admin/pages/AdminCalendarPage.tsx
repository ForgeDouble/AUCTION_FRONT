//  src/pages/admin/pages/AdminCalendarPage.tsx
import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, XCircle } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { SectionTitle } from "../components/AdminUi";
import type { CalendarEventRow } from "../adminTypes";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function yyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const AdminCalendarPage: React.FC = () => {
  const { events, addEvent, query } = useAdminStore();
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [open, setOpen] = useState<boolean>(false);
  const [draft, setDraft] = useState<{ date: string; time: string; title: string; tag: CalendarEventRow["tag"] }>({
    date: yyyyMmDd(new Date()),
    time: "10:00",
    title: "",
    tag: "기타",
  });

  const calStart = useMemo(() => startOfMonth(anchor), [anchor]);
  const calEnd = useMemo(() => endOfMonth(anchor), [anchor]);

  const monthLabel = useMemo(() => {
    const y = calStart.getFullYear();
    const m = calStart.getMonth() + 1;
    return `${y}년 ${m}월`;
  }, [calStart]);

  const calendarDays = useMemo(() => {
    const firstDow = calStart.getDay();
    const totalDays = calEnd.getDate();
    const cells: Array<{ date: string | null; inMonth: boolean }> = [];

    for (let i = 0; i < firstDow; i += 1) cells.push({ date: null, inMonth: false });

    for (let day = 1; day <= totalDays; day += 1) {
      const d = new Date(calStart.getFullYear(), calStart.getMonth(), day);
      cells.push({ date: yyyyMmDd(d), inMonth: true });
    }

    while (cells.length < 42) cells.push({ date: null, inMonth: false });
    return cells;
  }, [calStart, calEnd]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventRow[]>();
    for (const e of events) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    for (const [k, v] of map.entries()) {
      v.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
      map.set(k, v);
    }
    return map;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => e.title.toLowerCase().includes(q));
  }, [events, query]);

  const save = (): void => {
    if (!draft.title.trim()) return;
    addEvent({
      date: draft.date,
      time: draft.time.trim() ? draft.time : undefined,
      title: draft.title.trim(),
      tag: draft.tag || "기타",
    });
    setDraft({ date: draft.date, time: "10:00", title: "", tag: "기타" });
    setOpen(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <SectionTitle
        title="운영 캘린더"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-sm font-semibold text-gray-900 w-[120px] text-center">{monthLabel}</div>

            <button
              onClick={() => setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setOpen(true)}
              className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              일정 추가
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-7 gap-2 text-[11px] text-gray-500 mb-2">
        <div className="text-center">일</div>
        <div className="text-center">월</div>
        <div className="text-center">화</div>
        <div className="text-center">수</div>
        <div className="text-center">목</div>
        <div className="text-center">금</div>
        <div className="text-center">토</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((c, idx) => {
          const dayEvents = c.date ? eventsByDate.get(c.date) || [] : [];
          const isToday = c.date === yyyyMmDd(new Date());
          return (
            <div
              key={idx}
              className={
                "min-h-[90px] rounded-xl border p-2 " +
                (c.inMonth ? "bg-white border-gray-100" : "bg-gray-50 border-gray-100") +
                (isToday ? " ring-2 ring-violet-200" : "")
              }
            >
              <div className="flex items-center justify-between">
                <div className={"text-xs font-semibold " + (c.inMonth ? "text-gray-900" : "text-gray-400")}>
                  {c.date ? Number(c.date.slice(-2)) : ""}
                </div>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((e) => (
                  <div key={e.id} className="text-[11px] text-gray-700 truncate">
                    {e.time ? `${e.time} ` : ""}{e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && <div className="text-[10px] text-gray-400">+{dayEvents.length - 2} more</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="text-xs font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span>다가오는 일정(검색 반영)</span>
          </div>
          <div className="mt-2 space-y-2">
            {filteredEvents
              .slice()
              .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")))
              .slice(0, 8)
              .map((e) => (
                <div key={e.id} className="p-2 rounded-xl bg-white border border-gray-100">
                  <div className="text-sm font-semibold text-gray-900 truncate">{e.title}</div>
                  <div className="text-[11px] text-gray-500">
                    {e.date} {e.time || ""} · {e.tag || "기타"}
                  </div>
                </div>
              ))}
            {filteredEvents.length === 0 && <div className="text-sm text-gray-500 py-4">일정이 없습니다.</div>}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="text-xs font-semibold text-gray-900">운영 캘린더에 보통 넣는 것(추천)</div>
          <ul className="mt-2 text-[12px] text-gray-700 space-y-1 list-disc pl-5">
            <li>정산 배치/점검 시간</li>
            <li>DB/Redis/MQ 유지보수</li>
            <li>CS 피크 예상일(프로모션)</li>
            <li>약관/정책 변경 예정</li>
          </ul>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] bg-white rounded-2xl border border-gray-100 shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900">일정 추가</div>
              <button onClick={() => setOpen(false)} className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-gray-500 mb-1">날짜</div>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1">시간</div>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <div className="text-[11px] text-gray-500 mb-1">제목</div>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="예) 운영: 신고 처리 회의"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <div className="text-[11px] text-gray-500 mb-1">태그</div>
                <select
                  value={draft.tag}
                  onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="운영">운영</option>
                  <option value="장애">장애</option>
                  <option value="정산">정산</option>
                  <option value="점검">점검</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm">
                취소
              </button>
              <button onClick={save} className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarPage;
