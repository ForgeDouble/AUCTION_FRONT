import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, ImagePlus, Save, Bell, Cake, User2 } from "lucide-react";
import { adminApi } from "../adminApi";

type Props = {
open: boolean;
onClose: () => void;

adminEmail: string;
adminNick: string;

setAdminNick: (nick: string) => void;

profileImageUrl: string | null;
setProfileImageUrl: (url: string | null) => void;

notifEnabled: boolean;
setNotifEnabled: (v: boolean) => void;

birthdayOpen: boolean;
setBirthdayOpen: (v: boolean) => void;

birthday: string | null; // 사용자가 입력한 값(예: 1998-07-14)
setBirthday: (v: string | null) => void;

refreshEvents: () => Promise<void>;
};

type BirthdayEventMemo = {
id: string;
year: number;
mm: string;
dd: string;
};

function safeParse<T>(s: string | null): T | null {
if (!s) return null;
try { return JSON.parse(s) as T; } catch { return null; }
}

function pad2(n: number) {
return String(n).padStart(2, "0");
}

function extractMonthDay(dateStr: string): { mm: string; dd: string } | null {
// date input은 보통 YYYY-MM-DD
const m = String(dateStr || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
if (!m) return null;
const mm = m[2];
const dd = m[3];
const mmN = Number(mm), ddN = Number(dd);
if (!Number.isFinite(mmN) || !Number.isFinite(ddN)) return null;
if (mmN < 1 || mmN > 12) return null;
if (ddN < 1 || ddN > 31) return null;
return { mm, dd };
}

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; labelOn?: string; labelOff?: string }> = ({
value, onChange, labelOn = "ON", labelOff = "OFF",
}) => {
return (
<button
type="button"
onClick={() => onChange(!value)}
className={
"h-9 px-3 rounded-xl border text-sm font-semibold transition flex items-center gap-2 " +
(value ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-gray-50 border-gray-200 text-gray-600")
}
>
<span
className={
"w-8 h-5 rounded-full flex items-center px-0.5 transition " +
(value ? "bg-emerald-600 justify-end" : "bg-gray-300 justify-start")
}
>
<span className="w-4 h-4 rounded-full bg-white shadow" />
</span>
<span>{value ? labelOn : labelOff}</span>
</button>
);
};

const AdminSettingsModal: React.FC<Props> = ({
open,
onClose,
adminEmail,
adminNick,
setAdminNick,
profileImageUrl,
setProfileImageUrl,
notifEnabled,
setNotifEnabled,
birthdayOpen,
setBirthdayOpen,
birthday,
setBirthday,
refreshEvents,
}) => {
const fileRef = useRef<HTMLInputElement | null>(null);

const [nickDraft, setNickDraft] = useState(adminNick);
const [busyNick, setBusyNick] = useState(false);

const [busyUpload, setBusyUpload] = useState(false);
const [busySave, setBusySave] = useState(false);

const birthdayEventKey = useMemo(() => `admin_birthday_event_${adminEmail}`, [adminEmail]);

useEffect(() => {
if (!open) return;
setNickDraft(adminNick);
}, [open, adminNick]);

useEffect(() => {
if (!open) return;

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") onClose();
};
window.addEventListener("keydown", onKeyDown);
return () => window.removeEventListener("keydown", onKeyDown);


}, [open, onClose]);

if (!open) return null;

const onPickImage = () => fileRef.current?.click();

const onUploadImage = async (f: File) => {
setBusyUpload(true);
try {
const url = await adminApi.uploadAdminProfileImage(f);
setProfileImageUrl(url);
alert("프로필 이미지가 저장되었습니다.");
} catch (e) {
console.error(e);
alert("프로필 이미지 업로드에 실패했습니다. API 경로/응답을 확인하세요.");
} finally {
setBusyUpload(false);
}
};

const onSaveNickname = async () => {
const next = String(nickDraft || "").trim();
if (!next) return alert("닉네임을 입력하세요.");
if (next.length < 2 || next.length > 20) return alert("닉네임은 2~20자로 설정하세요.");

setBusyNick(true);
try {
  await adminApi.updateMyNickname(next);
  setAdminNick(next);
  alert("닉네임이 변경되었습니다.");
} catch (e) {
  console.error(e);
  alert("닉네임 변경에 실패했습니다. 서버 응답을 확인하세요.");
} finally {
  setBusyNick(false);
}


};

const ensureBirthdayCalendar = async () => {
const now = new Date();
const year = now.getFullYear();

const openFlag = Boolean(birthdayOpen);
const b = birthday ? String(birthday).trim() : "";
const md = b ? extractMonthDay(b) : null;

const memo = safeParse<BirthdayEventMemo>(localStorage.getItem(birthdayEventKey));

// OFF인데 기존 이벤트 있으면 삭제
if (!openFlag) {
  if (memo?.id) {
    try {
      await adminApi.deleteEvent(memo.id);
    } catch (e) {
      console.error(e);
      // 삭제 실패해도 설정 저장은 진행
    }
    localStorage.removeItem(birthdayEventKey);
    await refreshEvents();
  }
  return;
}

// ON인데 생일 값이 없으면 캘린더 등록 불가
if (!md) {
  return;
}

// 같은 해/같은 날짜로 이미 등록돼 있으면 스킵
if (memo && memo.year === year && memo.mm === md.mm && memo.dd === md.dd) {
  return;
}

// 기존에 다른 값으로 등록돼 있으면 삭제 후 재등록
if (memo?.id) {
  try {
    await adminApi.deleteEvent(memo.id);
  } catch (e) {
    console.error(e);
  }
  localStorage.removeItem(birthdayEventKey);
}

const eventDate = `${year}-${md.mm}-${md.dd}`;

const created = await adminApi.addEvent({
  date: eventDate,
  time: "00:00",
  title: `${adminNick} 생일`,
  tag: "생일",
  memo: "생일 공개 설정으로 자동 등록",
} as any);

localStorage.setItem(
  birthdayEventKey,
  JSON.stringify({ id: String(created.id), year, mm: md.mm, dd: md.dd } satisfies BirthdayEventMemo)
);

await refreshEvents();


};

const onSaveAll = async () => {
setBusySave(true);
try {
// 알림 ON이면 브라우저 알림 권한 요청(원하면 유지, 싫으면 지워도 됨)
if (notifEnabled && "Notification" in window) {
try {
if (Notification.permission === "default") {
await Notification.requestPermission();
}
} catch {}
}

  await ensureBirthdayCalendar();
  alert("환경설정이 저장되었습니다.");
  onClose();
} catch (e) {
  console.error(e);
  alert("저장 중 오류가 발생했습니다.");
} finally {
  setBusySave(false);
}


};

return (
<div className="fixed inset-0 z-[9999]">
<div className="absolute inset-0 bg-black/30" onClick={onClose} />

  <div className="absolute inset-0 flex items-center justify-center p-4">
    <div className="w-full max-w-[720px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <User2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-gray-900">환경설정</div>
            <div className="text-[11px] text-gray-500">{adminEmail}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
          title="닫기"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* 프로필 */}
        <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
          <div className="text-sm font-bold text-gray-900">프로필</div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <User2 className="w-7 h-7 text-gray-400" />
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onPickImage}
                  disabled={busyUpload}
                  className={
                    "h-9 px-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold flex items-center gap-2 " +
                    (busyUpload ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
                  }
                >
                  <ImagePlus className={"w-4 h-4 " + (busyUpload ? "animate-pulse" : "")} />
                  {busyUpload ? "업로드중" : "이미지 업로드"}
                </button>

                {profileImageUrl && (
                  <button
                    type="button"
                    onClick={() => setProfileImageUrl(null)}
                    className="h-9 px-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold hover:bg-gray-50"
                  >
                    이미지 제거
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUploadImage(f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <div className="text-[11px] text-gray-500">닉네임 변경</div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={nickDraft}
                  onChange={(e) => setNickDraft(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-violet-400"
                  placeholder="새 닉네임"
                />
                <button
                  type="button"
                  onClick={() => void onSaveNickname()}
                  disabled={busyNick}
                  className={
                    "h-10 px-4 rounded-xl bg-violet-600 text-white text-sm font-semibold flex items-center gap-2 " +
                    (busyNick ? "opacity-60 cursor-not-allowed" : "hover:bg-violet-700")
                  }
                >
                  <Save className={"w-4 h-4 " + (busyNick ? "animate-pulse" : "")} />
                  저장
                </button>
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                닉네임 변경 후, 토큰에 닉네임 클레임을 넣는 구조면 서버에서 새 토큰을 내려주는 방식이 가장 깔끔합니다.
              </div>
            </div>
          </div>
        </div>

        {/* 생일 공개 + 캘린더 */}
        <div className="p-4 rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Cake className="w-4 h-4" />
                생일 공개 및 캘린더 등록
              </div>
              <div className="text-[11px] text-gray-500">
                공개 ON이면 운영 캘린더에 현재 연도 기준으로 자동 등록됩니다.
              </div>
            </div>

            <Toggle value={birthdayOpen} onChange={setBirthdayOpen} labelOn="공개" labelOff="비공개" />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="text-[11px] text-gray-500">생일</div>
              <input
                type="date"
                value={birthday ?? ""}
                onChange={(e) => setBirthday(e.target.value ? String(e.target.value) : null)}
                className="mt-2 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-violet-400 bg-white"
              />
              <div className="mt-2 text-[11px] text-gray-500">
                입력값이 1999-01-01이어도 캘린더 등록은 2026-01-01처럼 “현재 연도”로 생성됩니다.
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="text-[11px] text-gray-500">등록 규칙</div>
              <div className="mt-2 text-sm text-gray-800 leading-relaxed">
                - 공개 ON + 생일 입력: 캘린더에 자동 등록<br />
                - 공개 OFF: 기존 등록된 생일 이벤트 자동 해제<br />
                - 날짜 변경: 기존 이벤트 삭제 후 재등록
              </div>
            </div>
          </div>
        </div>

        {/* 알림 */}
        <div className="p-4 rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                알림 설정
              </div>
              <div className="text-[11px] text-gray-500">운영 화면에서 알림 배너/브라우저 알림 등에 활용 가능</div>
            </div>

            <Toggle value={notifEnabled} onChange={setNotifEnabled} labelOn="ON" labelOff="OFF" />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold"
        >
          닫기
        </button>
        <button
          type="button"
          onClick={() => void onSaveAll()}
          disabled={busySave}
          className={
            "h-10 px-4 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-sm font-semibold flex items-center gap-2 " +
            (busySave ? "opacity-60 cursor-not-allowed" : "")
          }
        >
          <Save className={"w-4 h-4 " + (busySave ? "animate-pulse" : "")} />
          {busySave ? "저장중" : "저장"}
        </button>
      </div>
    </div>
  </div>
</div>


);
};

export default AdminSettingsModal;