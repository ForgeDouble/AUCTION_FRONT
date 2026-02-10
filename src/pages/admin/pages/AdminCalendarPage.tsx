import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, XCircle, Trash2, Save } from "lucide-react";
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
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function tagStyle(tag?: CalendarEventRow["tag"]) {
  const t = tag ?? "기타";
  switch (t) {
    case "운영":
      return {
        pill: "bg-blue-50 text-blue-700 border-blue-200",
        bar: "bg-blue-500",
      };
    case "장애":
      return {
        pill: "bg-red-50 text-red-700 border-red-200",
        bar: "bg-red-500",
      };
    case "정산":
      return {
        pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bar: "bg-emerald-500",
      };
    case "점검":
      return {
        pill: "bg-amber-50 text-amber-800 border-amber-200",
        bar: "bg-amber-500",
      };
    default:
      return {
        pill: "bg-gray-50 text-gray-700 border-gray-200",
        bar: "bg-gray-500",
      };
  }
}

const AdminCalendarPage: React.FC = () => {
const {events, addEvent, updateEvent, deleteEvent, moveEventDate, query, } = useAdminStore();

const [anchor, setAnchor] = useState<Date>(() => new Date());
const [open, setOpen] = useState<boolean>(false);

const [selectedId, setSelectedId] = useState<string | null>(null);

const [moreDate, setMoreDate] = useState<string | null>(null);

const selected = useMemo(() => {
  if (!selectedId) return null;
  return events.find((e) => e.id === selectedId) ?? null;
}, [events, selectedId]);

const [draft, setDraft] = useState<{ date: string; time: string; title: string; tag: CalendarEventRow["tag"]; memo: string }>({
  date: yyyyMmDd(new Date()),
  time: "10:00",
  title: "",
  tag: "기타",
  memo: "",
});

const [edit, setEdit] = useState<{ title: string; time: string; tag: CalendarEventRow["tag"]; memo: string }>({
  title: "",
  time: "",
  tag: "기타",
  memo: "",
});

useEffect(() => {
  if (!selected) return;
  setEdit({
    title: selected.title ?? "",
    time: selected.time ?? "",
    tag: selected.tag ?? "기타",
    memo: (selected.memo ?? "") as string,
  });
}, [selectedId]);

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

const moreEvents = useMemo(() => {
  if (!moreDate) return [];
  return eventsByDate.get(moreDate) || [];
}, [moreDate, eventsByDate]);

const filteredEvents = useMemo(() => {
  const q = query.trim().toLowerCase();
  if (!q) return events;
  return events.filter((e) => (e.title || "").toLowerCase().includes(q));
}, [events, query]);

const todayStr = useMemo(() => yyyyMmDd(new Date()), []);
const end2wStr = useMemo(() => yyyyMmDd(addDays(new Date(), 14)), []);

const upcomingEvents = useMemo(() => {
  return filteredEvents
  .filter((e) => e.date >= todayStr && e.date <= end2wStr)
  .slice()
  .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
}, [filteredEvents, todayStr, end2wStr]);

const saveNew = (): void => {
  if (!draft.title.trim()) return;

  addEvent({
    date: draft.date,
    time: draft.time.trim() ? draft.time : undefined,
    title: draft.title.trim(),
    tag: draft.tag || "기타",
    memo: draft.memo?.trim() ? draft.memo.trim() : null,
  });

  setDraft({ date: draft.date, time: "10:00", title: "", tag: "기타", memo: "" });
  setOpen(false);

};

const onDragStartEvent = (ev: React.DragEvent, eventId: string) => {
  ev.dataTransfer.setData("text/plain", eventId);
  ev.dataTransfer.effectAllowed = "move";
};

const onDropDayCell = async (ev: React.DragEvent, date: string | null) => {
  ev.preventDefault();
  if (!date) return;

  const eventId = ev.dataTransfer.getData("text/plain");
  if (!eventId) return;

  try {
    await moveEventDate(eventId, date);
  } catch (e) {
    console.error(e);
    alert("날짜 변경에 실패했습니다.");
  }
};

const onClickDayCell = (date: string | null) => {
  if (!date) return;
  setDraft((d) => ({ ...d, date }));
  setOpen(true);
};

const onSaveEdit = async () => {
  if (!selected) return;
  if (!edit.title.trim()) return;

  try {
    await updateEvent(selected.id, {
      date: selected.date,
      time: edit.time.trim() ? edit.time : undefined,
      title: edit.title.trim(),
      tag: edit.tag || "기타",
      memo: edit.memo?.trim() ? edit.memo.trim() : null,
    });
    alert("수정 완료");
  } catch (e) {
    console.error(e);
    alert("수정에 실패했습니다.");
  }
};

const onDelete = async () => {
  if (!selected) return;
  const ok = window.confirm("정말 삭제할까요?");
  if (!ok) return;

  try {
    await deleteEvent(selected.id);
    setSelectedId(null);
  } catch (e) {
    console.error(e);
    alert("삭제에 실패했습니다.");
  }
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
          className="px-3 py-2 rounded-xl bg-[rgb(118_90_255)] hover:bg-[rgb(104_79_224)] text-white text-sm flex items-center gap-2"
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
          onClick={() => onClickDayCell(c.date)}
          onDragOver={(ev) => ev.preventDefault()}
          onDrop={(ev) => onDropDayCell(ev, c.date)}
          className={
            "min-h-[92px] rounded-xl border p-2 cursor-pointer " +
            (c.inMonth ? "bg-white border-gray-100 hover:bg-gray-50" : "bg-gray-50 border-gray-100") +
            (isToday ? " ring-2 ring-[rgb(118_90_255)]/25" : "")
          }
          title={c.date ? "클릭: 일정 추가 / 드래그 드롭: 날짜 변경" : ""}
        >
          <div className="flex items-center justify-between">
            <div className={"text-xs font-semibold " + (c.inMonth ? "text-gray-900" : "text-gray-400")}>
              {c.date ? Number(c.date.slice(-2)) : ""}
            </div>

            {dayEvents.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(118_90_255)]/10 border border-[rgb(118_90_255)]/20 text-[rgb(118_90_255)]">
                {dayEvents.length}
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1">
            {dayEvents.slice(0, 2).map((e) => {
              const ts = tagStyle(e.tag);
              return (
                <div
                  key={e.id}
                  draggable
                  onDragStart={(ev) => onDragStartEvent(ev, e.id)}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedId(e.id);
                  }}
                  className={
                    "relative text-[11px] pl-3 pr-2 py-1.5 rounded-lg border bg-white hover:bg-gray-50 truncate " +
                    (selectedId === e.id ? "border-[rgb(118_90_255)]/45" : "border-gray-100")
                  }
                  title="클릭: 상세/메모 / 드래그: 날짜 변경"
                >
                  {/* 왼쪽 북마크 바 */}
                  <span className={"absolute left-1 top-1 bottom-1 w-1 rounded-full " + ts.bar} />

                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* 태그 칩 */}
                    <span className={"shrink-0 px-1.5 py-0.5 rounded-md border text-[10px] " + ts.pill}>
                      {e.tag || "기타"}
                    </span>

                    <span className="text-gray-900 font-semibold shrink-0">
                      {e.time ? `${e.time}` : ""}
                    </span>

                    <span className="text-gray-700 truncate">{e.title}</span>
                  </div>
                </div>
              );
            })}

            {dayEvents.length > 2 && (
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  setMoreDate(c.date);
                }}
                className="text-[10px] text-gray-500 hover:text-gray-700 underline underline-offset-2"
                title="해당 날짜 일정 전체 보기"
              >
                +{dayEvents.length - 2} 더보기
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>

  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="text-xs font-semibold text-gray-900 flex items-center gap-2">
        <CalendarDays className="w-4 h-4" />
        <span>예정 일정</span>
      </div>

      <div className="mt-2 space-y-2">
        {upcomingEvents.slice(0, 12).map((e) => {
          const ts = tagStyle(e.tag);
          return (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              className={
                "w-full text-left p-2 rounded-xl bg-white border hover:bg-gray-50 " +
                (selectedId === e.id ? "border-[rgb(118_90_255)]/45" : "border-gray-100")
              }
            >
              <div className="flex items-start gap-2">
                {/* 왼쪽 컬러 바 */}
                <div className={"mt-1 w-1.5 h-10 rounded-full " + ts.bar} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={"px-2 py-0.5 rounded-md border text-[10px] " + ts.pill}>
                      {e.tag || "기타"}
                    </span>
                    <div className="text-sm font-semibold text-gray-900 truncate">{e.title}</div>
                  </div>

                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {e.date} {e.time || ""}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {upcomingEvents.length === 0 && <div className="text-sm text-gray-500 py-4">2주 이내 일정이 없습니다.</div>}
      </div>
    </div>

    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="text-xs font-semibold text-gray-900">일정 상세 / 메모</div>
      <div className="mt-2 text-[11px] text-gray-500">
        캘린더에서 일정 클릭 → 이곳에서 메모/내용 수정 가능. 날짜 변경은 드래그로만 가능합니다.
      </div>

      {!selected && (
        <div className="mt-4 text-sm text-gray-500 py-8 text-center border border-dashed border-gray-200 rounded-xl bg-white">
          일정을 선택하세요
        </div>
      )}

      {selected && (
        <div className="mt-3 p-3 rounded-xl bg-white border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              {(() => {
                const ts = tagStyle(selected.tag);
                return (
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className={"px-2 py-0.5 rounded-md border text-[10px] " + ts.pill}>
                      {selected.tag || "기타"}
                    </span>
                    <span>
                      {selected.date} {selected.time || ""}
                    </span>
                  </div>
                );
              })()}
            </div>

            <button
              onClick={() => setSelectedId(null)}
              className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
              title="닫기"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">날짜(드래그로 변경)</div>
              <input
                value={selected.date}
                readOnly
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50"
              />
            </div>

            <div>
              <div className="text-[11px] text-gray-500 mb-1">시간</div>
              <input
                type="time"
                value={edit.time}
                onChange={(e) => setEdit((d) => ({ ...d, time: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <div className="text-[11px] text-gray-500 mb-1">제목</div>
              <input
                value={edit.title}
                onChange={(e) => setEdit((d) => ({ ...d, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <div className="text-[11px] text-gray-500 mb-1">태그</div>
              <select
                value={edit.tag}
                onChange={(e) => setEdit((d) => ({ ...d, tag: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
              >
                <option value="운영">운영</option>
                <option value="장애">장애</option>
                <option value="정산">정산</option>
                <option value="점검">점검</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="text-[11px] text-gray-500 mb-1">메모/내용</div>
              <textarea
                value={edit.memo}
                onChange={(e) => setEdit((d) => ({ ...d, memo: e.target.value }))}
                placeholder="예) 작업 범위, 체크리스트, 담당자, 링크 등"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[110px] resize-none"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={onDelete}
              className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
            <button
              onClick={onSaveEdit}
              className="px-3 py-2 rounded-xl bg-[rgb(118_90_255)] hover:bg-[rgb(104_79_224)] text-white text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              저장
            </button>
          </div>
        </div>
      )}
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

          <div className="md:col-span-2">
            <div className="text-[11px] text-gray-500 mb-1">메모/내용</div>
            <textarea
              value={draft.memo}
              onChange={(e) => setDraft((d) => ({ ...d, memo: e.target.value }))}
              placeholder="예) 점검 범위, 담당자, 링크, 체크리스트"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm">
            취소
          </button>
          <button onClick={saveNew} className="px-3 py-2 rounded-xl bg-[rgb(118_90_255)] hover:bg-[rgb(104_79_224)] text-white text-sm">
            저장
          </button>
        </div>
      </div>
    </div>
  )}

  {moreDate && (
  <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
    <div className="w-full max-w-[560px] bg-white rounded-2xl border border-gray-100 shadow-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900">해당 날짜 일정</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{moreDate}</div>
        </div>

        <button
          onClick={() => setMoreDate(null)}
          className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
          title="닫기"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {moreEvents.map((e) => {
          const ts = tagStyle(e.tag);
          return (
            <button
              key={e.id}
              onClick={() => {
                setSelectedId(e.id);
                setMoreDate(null);
              }}
              className={
                "w-full text-left p-2 rounded-xl bg-white border hover:bg-gray-50 " +
                (selectedId === e.id ? "border-[rgb(118_90_255)]/45" : "border-gray-100")
              }
              title="클릭: 상세/메모 보기"
            >
              <div className="flex items-start gap-2">
                <div className={"mt-1 w-1.5 h-10 rounded-full " + ts.bar} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={"shrink-0 px-2 py-0.5 rounded-md border text-[10px] " + ts.pill}>
                      {e.tag || "기타"}
                    </span>

                    {e.time ? (
                      <span className="shrink-0 text-[11px] font-semibold text-gray-900">{e.time}</span>
                    ) : null}

                    <span className="text-sm font-semibold text-gray-900 truncate">{e.title}</span>
                  </div>

                  {e.memo ? (
                    <div className="mt-1 text-[11px] text-gray-500 line-clamp-2">{e.memo}</div>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}

        {moreEvents.length === 0 && (
          <div className="text-sm text-gray-500 py-6 text-center">해당 날짜 일정이 없습니다.</div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">

      </div>
    </div>
  </div>
)}
</div>


);
};

export default AdminCalendarPage;