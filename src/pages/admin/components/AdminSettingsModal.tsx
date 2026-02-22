// src/pages/admin/components/AdminSettingsModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, ImagePlus, Save, Bell, Cake, User2, Trash2, Camera, Settings } from "lucide-react";
import { adminApi } from "../adminApi";
import { useModal } from "@/contexts/ModalContext";

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

  refreshEvents: () => Promise<void>;
};
type BirthdayEventMemo = {
  id: string;
  year: number;
  mm: string;
  dd: string;
  nick?: string;
};

function jsonSafeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function extractMonthDayFlexible(
  birthdayStr: string
): { mm: string; dd: string; yyyy?: string } | null {
  const s = String(birthdayStr || "").trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (!m) m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})(?:\s.*)?$/);
  if (!m) m = s.match(/^(\d{4})\/(\d{2})\/(\d{2})(?:\s.*)?$/);

  if (!m) {
    const m2 =
      s.match(/^(\d{2})-(\d{2})$/) ||
      s.match(/^(\d{2})\.(\d{2})$/) ||
      s.match(/^(\d{2})\/(\d{2})$/);
    if (m2) {
      const mm = m2[1];
      const dd = m2[2];
      const mmN = Number(mm);
      const ddN = Number(dd);
      if (mmN < 1 || mmN > 12) return null;
      if (ddN < 1 || ddN > 31) return null;
      return { mm, dd };
    }
  }

  if (!m) return null;

  const yyyy = m[1];
  const mm = m[2];
  const dd = m[3];

  const mmN = Number(mm);
  const ddN = Number(dd);
  if (!Number.isFinite(mmN) || !Number.isFinite(ddN)) return null;
  if (mmN < 1 || mmN > 12) return null;
  if (ddN < 1 || ddN > 31) return null;

  return { yyyy, mm, dd };
}
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

function computeNextBirthdayDate(
  now: Date,
  mm: string,
  dd: string
): { year: number; mm: string; dd: string } {
  const mmN = Number(mm);
  const ddN = Number(dd);

  const thisYear = now.getFullYear();
  const candidateThisYear = new Date(thisYear, mmN - 1, ddN, 0, 0, 0, 0);
  let targetYear = candidateThisYear <= now ? thisYear + 1 : thisYear;

  if (mm === "02" && dd === "29" && !isLeapYear(targetYear)) {
    return { year: targetYear, mm: "02", dd: "28" };
  }

  return { year: targetYear, mm, dd };
}

function formatBirthdayDisplay(birthdayStr: string | null): string {
  if (!birthdayStr) return "생일 정보 없음";
  const md = extractMonthDayFlexible(birthdayStr);
  if (!md) return birthdayStr;
  return `${md.yyyy}-${md.mm}-${md.dd}`;
}

// 알림 방지 기능 적용
function notifSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

async function ensureNotifPermission(): Promise<"granted" | "denied" | "default"> {
  if (!notifSupported()) return "denied";
  try {
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return Notification.permission ?? "default";
  }
}

const Toggle: React.FC<{
  value: boolean;
  onChange: (v: boolean) => void;
  labelOn?: string;
  labelOff?: string;
  disabled?: boolean;
}> = ({ value, onChange, labelOn = "ON", labelOff = "OFF", disabled }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={
        "h-9 px-3 rounded-xl border text-sm font-semibold transition flex items-center gap-2 " +
        (disabled
          ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
          : value
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-gray-50 border-gray-200 text-gray-600")
      }
    >
      <span
        className={
          "w-8 h-5 rounded-full flex items-center px-0.5 transition " +
          (disabled ? "bg-gray-300 justify-start" : value ? "bg-emerald-600 justify-end" : "bg-gray-300 justify-start")
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
  refreshEvents,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [nickDraft, setNickDraft] = useState(adminNick);
  const [busyNick, setBusyNick] = useState(false);

  const [busyUpload, setBusyUpload] = useState(false);
  const [busyDeleteImage, setBusyDeleteImage] = useState(false);
  const [busySave, setBusySave] = useState(false);

  const [myBirthday, setMyBirthday] = useState<string | null>(null);
  const [loadingMy, setLoadingMy] = useState(false);
  const { showError, showWarning } = useModal();

  // 실패(저장/이미지)만 모달
  const showFail = (msg: string) => showError(msg);
  // 성공은 굳이 모달 아니어도 되면(토스트/경고용)
  const showOk = (msg: string) => showWarning(msg);

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

  useEffect(() => {
    if (!open) return;

    setLoadingMy(true);
    adminApi
      .getMyDetail()
      .then((me: any) => {
        setMyBirthday(me?.birthday ?? null);
      })
      .catch((e: any) => {
        console.error(e);
        setMyBirthday(null);
      })
      .finally(() => setLoadingMy(false));
  }, [open]);
  const birthdayDisplay = useMemo(() => formatBirthdayDisplay(myBirthday), [myBirthday]);
  const canUseBirthday = useMemo(() => Boolean(extractMonthDayFlexible(myBirthday ?? "")), [myBirthday]);

  const birthdayEventKey = useMemo(() => `admin:birthdayEvent:${adminEmail}`, [adminEmail]);

  const ensureBirthdayCalendar = async () => {
    const now = new Date();

    const openFlag = Boolean(birthdayOpen);
    const md = extractMonthDayFlexible(myBirthday ?? "");

    const memo = jsonSafeParse<BirthdayEventMemo>(localStorage.getItem(birthdayEventKey));

    if (!openFlag) {
      if (memo?.id) {
        try {
          await adminApi.deleteEvent(memo.id);
        } catch (e) {
          console.error(e);
        }
        localStorage.removeItem(birthdayEventKey);
        try { await refreshEvents(); } catch {}
      }
      return;
    }

    if (!md) {
      if (memo?.id) {
        try { await adminApi.deleteEvent(memo.id); } catch (e) { console.error(e); }
        localStorage.removeItem(birthdayEventKey);
        try { await refreshEvents(); } catch {}
      }
      return;
    }

    const next = computeNextBirthdayDate(now, md.mm, md.dd);
    const eventDate = `${next.year}-${next.mm}-${next.dd}`;

    const title = `${adminNick} 생일`;
    const memoText = `BIRTHDAY:${adminEmail}`;

    const tagCandidates = ["ETC", "MAINTENANCE", "INCIDENT"];

    if (
      memo?.id &&
      memo.year === next.year &&
      memo.mm === next.mm &&
      memo.dd === next.dd &&
      memo.nick === adminNick
    ) {
      return;
    }

    const tryUpdate = async (id: string) => {
      let lastErr: any = null;
      for (const tag of tagCandidates) {
        try {
          await adminApi.updateEvent(id, {
            date: eventDate,
            time: "00:00",
            title,
            tag: tag as any,
            memo: memoText,
          } as any);
          return tag;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    };

    const tryCreate = async () => {
      let lastErr: any = null;
      for (const tag of tagCandidates) {
        try {
          const created = await adminApi.addEvent({
            date: eventDate,
            time: "00:00",
            title,
            tag: tag as any,
            memo: memoText,
          } as any);

          const createdId = String((created as any)?.id ?? (created as any)?.eventId ?? created);
          return { tag, id: createdId };
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    };

    if (memo?.id) {
      try {
        await tryUpdate(memo.id);

        localStorage.setItem(
          birthdayEventKey,
          JSON.stringify({ id: memo.id, year: next.year, mm: next.mm, dd: next.dd, nick: adminNick } satisfies BirthdayEventMemo)
        );

        try { await refreshEvents(); } catch {}
        return;
      } catch (e) {
        console.error(e);
        localStorage.removeItem(birthdayEventKey);
      }
    }

    const createdRes = await tryCreate();
    localStorage.setItem(
      birthdayEventKey,
      JSON.stringify({ id: createdRes.id, year: next.year, mm: next.mm, dd: next.dd, nick: adminNick } satisfies BirthdayEventMemo)
    );

    try { await refreshEvents(); } catch {}
  };

  if (!open) return null;

  const onPickImage = () => fileRef.current?.click();

  const onUploadImage = async (f: File) => {
    setBusyUpload(true);
    try {
      const url = await adminApi.uploadAdminProfileImage(f);
      setProfileImageUrl(url);

      showOk("프로필 이미지가 저장되었습니다.");
    } catch (e) {
      console.error(e);
      showFail("프로필 이미지 업로드에 실패했습니다.\n잠시 후 다시 시도해 주세요.");
    } finally {
      setBusyUpload(false);
    }
  };

  const onDeleteImage = async () => {
    if (busyDeleteImage) return;
    if (!confirm("프로필 이미지를 삭제할까요?")) return;

    setBusyDeleteImage(true);
    try {
      await adminApi.deleteMyProfileImage();
      setProfileImageUrl(null);

      showOk("프로필 이미지가 삭제되었습니다.");
    } catch (e) {
      console.error(e);
      showFail("프로필 이미지 삭제에 실패했습니다.\n잠시 후 다시 시도해 주세요.");
    } finally {
      setBusyDeleteImage(false);
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

      showOk("닉네임이 변경되었습니다.");
    } catch (e) {
      console.error(e);
      showFail("닉네임 변경에 실패했습니다.\n잠시 후 다시 시도해 주세요.");
    } finally {
      setBusyNick(false);
    }
  };

  const onSaveAll = async () => {
    setBusySave(true);
    try {
      if (notifEnabled && "Notification" in window) {
        try { 
          if (Notification.permission === "default") {
            await Notification.requestPermission();
          }
        } catch {}
      }
      await ensureBirthdayCalendar();

      showOk("환경설정이 저장되었습니다.");
      onClose();
    } catch (e) {
      console.error(e);
      showFail("환경설정 저장에 실패했습니다.\n잠시 후 다시 시도해 주세요.");
    } finally {
      setBusySave(false);
    }
  };

  const onToggleNotif = async (next: boolean) => {
    // OFF -> ON 켤 때만 권한 체크/요청
    if (next) {
      if (!notifSupported()) {
        alert("이 브라우저/환경에서는 알림 기능을 지원하지 않습니다.");
        return;
      }

      if (Notification.permission === "denied") {
        alert("브라우저 알림 권한이 차단되어 있어요. 브라우저 설정에서 알림을 허용한 뒤 다시 켜주세요.");
        return;
      }

      if (Notification.permission === "default") {
        const perm = await ensureNotifPermission();
        if (perm !== "granted") {
          alert("알림 권한이 허용되지 않아 알림을 켤 수 없습니다.");
          return;
        }
      }
    }
    setNotifEnabled(next);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[760px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[rgb(118,90,255)] flex items-center justify-center">
                 <Settings className="w-5 h-5 text-white" />
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

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
              {/* 좌측: 프로필 이미지 */}
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                <div className="text-sm font-bold text-gray-900">프로필 이미지</div>

                <div className="mt-3 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onPickImage}
                    disabled={busyUpload}
                    className={
                      "relative w-24 h-24 rounded-2xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center " +
                      (busyUpload ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
                    }
                    title="클릭해서 이미지 업로드/변경"
                  >
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                      <User2 className="w-9 h-9 text-gray-400" />
                    )}

                    <span className="absolute bottom-2 right-2 w-8 h-8 rounded-xl bg-transparent backdrop-blur border border-white/60 flex items-center justify-center shadow">
                      <Camera className="w-4 h-4 text-[rgb(118,90,255)]" />
                    </span>
                  </button>

                  {/* <div className="min-w-0">
                    {/* <div className="text-sm font-semibold text-gray-900 truncate">{adminNick}</div> */}
                  {/* </div>  */}
                  
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                    이미지 클릭 또는 아래 버튼으로 업로드/변경할 수 있어요.
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onPickImage}
                    disabled={busyUpload}
                    className={
                      "h-10 px-2.5 rounded-xl bg-white border border-gray-200 text-[13px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap break-keep " +
                      (busyUpload ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
                    }
                  >
                    <ImagePlus className={"w-4 h-4 " + (busyUpload ? "animate-pulse" : "")} />
                    {busyUpload ? "업로드중" : profileImageUrl ? "이미지 변경" : "이미지 업로드"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void onDeleteImage()}
                    disabled={!profileImageUrl || busyDeleteImage}
                    className={
                      "h-10 px-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold flex items-center justify-center gap-2 " +
                      (!profileImageUrl || busyDeleteImage ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
                    }
                  >
                    <Trash2 className={"w-4 h-4 " + (busyDeleteImage ? "animate-pulse" : "")} />
                    {busyDeleteImage ? "삭제중" : "삭제"}
                  </button>
                </div>

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

              {/* 우측: 닉네임 + 생일 공개 + 알림 */}
              <div className="space-y-4">
                {/* 닉네임 */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <div className="text-sm font-bold text-gray-900">닉네임</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={nickDraft}
                      onChange={(e) => setNickDraft(e.target.value)}
                      className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[rgb(118,90,255)] focus:ring-2 focus:ring-[rgba(118,90,255,0.20)]"
                      placeholder="새 닉네임"
                    />
                    <button
                      type="button"
                      onClick={() => void onSaveNickname()}
                      disabled={busyNick}
                      className={
                        "h-10 px-4 min-w-[84px] rounded-xl bg-[rgb(118,90,255)] text-white text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap break-keep " +
                        (busyNick ? "opacity-60 cursor-not-allowed" : "hover:brightness-95")
                      }
                    >
                      <Save className={"w-4 h-4 " + (busyNick ? "animate-pulse" : "")} />
                      저장
                    </button>
                  </div>

                  {/* <div className="mt-2 text-[11px] text-gray-500">
                    닉네임은 즉시 저장됩니다. (토글 설정은 하단 저장 버튼에서 반영)
                  </div> */}
                </div>

                {/* 생일 공개 */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Cake className="w-4 h-4" />
                        생일 공개
                      </div>
                      <div className="text-[11px] text-gray-500">프로필에서 생일 정보 공개 여부만 설정합니다.</div>
                    </div>

                    <Toggle
                      value={birthdayOpen}
                      onChange={(v) => {
                        if (v && !canUseBirthday) {
                          alert("생일 정보가 없어서 공개 설정을 할 수 없습니다.");
                          return;
                        }
                        setBirthdayOpen(v);
                      }}
                      labelOn="공개"
                      labelOff="비공개"
                      disabled={loadingMy}
                    />
                  </div>

                  <div className="mt-3 p-3 rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="text-[11px] text-gray-500">생일</div>
                    <div className="mt-2 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm flex items-center bg-white">
                      {loadingMy ? "불러오는 중..." : birthdayDisplay}
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
                      <div className="text-[11px] text-gray-500">운영 화면에서 알림 배너/브라우저 알림 등에 활용</div>
                    </div>

                    <Toggle
                      value={notifEnabled}
                      onChange={(v) => { void onToggleNotif(v); }}
                      labelOn="ON"
                      labelOff="OFF"
                      disabled={!notifSupported()}
                    />
                  </div>
                </div>
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
                "h-10 px-4 rounded-xl bg-[rgb(118,90,255)] text-white hover:brightness-95 text-sm font-semibold flex items-center gap-2 " +
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
