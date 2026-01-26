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

  refreshEvents: () => Promise<void>;
};

type BirthdayEventMemo = {
  id: string;
  year: number;
  mm: string;
  dd: string;
};

function jsonSafeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function extractMonthDayFlexible(birthdayStr: string): { mm: string; dd: string; yyyy?: string } | null {
  const s = String(birthdayStr || "").trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!m) m = s.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
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

function formatBirthdayDisplay(birthdayStr: string | null): string {
  if (!birthdayStr) return "생일 정보 없음";
  const md = extractMonthDayFlexible(birthdayStr);
  if (!md) return birthdayStr;
  return `${md.yyyy}-${md.mm}-${md.dd}`;
}

function isValidNickname(next: string): boolean {
  if (next.length < 2 || next.length > 8) return false;
  return /^[A-Za-z0-9가-힣_]+$/.test(next);
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

  const birthdayEventKey = useMemo(() => `admin_birthday_event_${adminEmail}`, [adminEmail]);
  const birthdayMemoTag = useMemo(() => `BIRTHDAY:${adminEmail}`, [adminEmail]);

  const birthdayDisplay = formatBirthdayDisplay(myBirthday);
  const canUseBirthday = Boolean(extractMonthDayFlexible(myBirthday ?? ""));

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

        const url = me?.profileImageUrl ?? null;
        if (!profileImageUrl && url) setProfileImageUrl(String(url));

        const nn = me?.nickname ?? null;
        if (!adminNick && nn) setAdminNick(String(nn));
      })
      .catch((e: any) => {
        console.error(e);
        setMyBirthday(null);
      })
      .finally(() => setLoadingMy(false));

  }, [open, setProfileImageUrl, setAdminNick]);

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

  const onDeleteImage = async () => {
    setBusyDeleteImage(true);
    try {
      await adminApi.deleteMyProfileImage();
      setProfileImageUrl(null);
      alert("프로필 이미지가 삭제되었습니다.");
    } catch (e) {
      console.error(e);
      alert("프로필 이미지 삭제에 실패했습니다.");
    } finally {
      setBusyDeleteImage(false);
    }
  };

  const onSaveNickname = async () => {
    const next = String(nickDraft || "").trim();
    if (!next) return alert("닉네임을 입력하세요.");
    if (!isValidNickname(next)) return alert("닉네임은 2~8자, 영문/숫자/한글/_ 만 가능합니다.");

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
    const md = extractMonthDayFlexible(myBirthday ?? "");

    const memo = jsonSafeParse<BirthdayEventMemo>(localStorage.getItem(birthdayEventKey));

    let serverBirthdayEvents: any[] = [];
    try {
      const all = await adminApi.getEvents();
      serverBirthdayEvents = (all ?? []).filter((ev: any) => String(ev?.memo ?? "").includes(birthdayMemoTag));
    } catch (e) {
      console.error(e);
      serverBirthdayEvents = [];
    }

    const safeId = (id: any) => String(id ?? "").trim();
    if (!openFlag) {
      const ids = new Set<string>();
      if (memo?.id) ids.add(safeId(memo.id));
      for (const ev of serverBirthdayEvents) {
        const id = safeId(ev?.id);
        if (id) ids.add(id);
      }

      if (ids.size > 0) {
        await Promise.allSettled(Array.from(ids).map((id) => adminApi.deleteEvent(id)));
        localStorage.removeItem(birthdayEventKey);
        await refreshEvents();
      } else {
        localStorage.removeItem(birthdayEventKey);
      }
      return;
    }
    if (!md) return;

    const wantedDate = `${year}-${md.mm}-${md.dd}`;

    const sameDate = serverBirthdayEvents.filter((ev: any) => String(ev?.date ?? "") === wantedDate);
    const otherDates = serverBirthdayEvents.filter((ev: any) => String(ev?.date ?? "") !== wantedDate);

    if (otherDates.length > 0) {
      await Promise.allSettled(otherDates.map((ev: any) => adminApi.deleteEvent(safeId(ev?.id))));
    }

    if (sameDate.length > 1) {
      const keep = sameDate[0];
      const drop = sameDate.slice(1);
      await Promise.allSettled(drop.map((ev: any) => adminApi.deleteEvent(safeId(ev?.id))));

      const keptId = safeId(keep?.id);
      localStorage.setItem(
        birthdayEventKey,
        JSON.stringify({ id: keptId, year, mm: md.mm, dd: md.dd } satisfies BirthdayEventMemo)
      );
      await refreshEvents();
      return;
    }

    if (sameDate.length === 1) {
      const keptId = safeId(sameDate[0]?.id);
      localStorage.setItem(
        birthdayEventKey,
        JSON.stringify({ id: keptId, year, mm: md.mm, dd: md.dd } satisfies BirthdayEventMemo)
      );
      return;
    }

    if (memo?.id) {
      try {
        await adminApi.deleteEvent(safeId(memo.id));
      } catch (e) {
        console.error(e);
      }
      localStorage.removeItem(birthdayEventKey);
    }

    // 신규 생성
    const created = await adminApi.addEvent({
      date: wantedDate,
      time: "00:00",
      title: `${adminNick} 생일`,
      tag: "ETC",
      memo: birthdayMemoTag,
    } as any);

    const createdId = safeId((created as any)?.id);
    localStorage.setItem(
      birthdayEventKey,
      JSON.stringify({ id: createdId, year, mm: md.mm, dd: md.dd } satisfies BirthdayEventMemo)
    );

    await refreshEvents();
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

      if (birthdayOpen && !canUseBirthday) {
        alert("생일 정보가 없어서 캘린더 등록을 할 수 없습니다.");
        return;
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
                        onClick={() => void onDeleteImage()}
                        disabled={busyDeleteImage}
                        className={
                          "h-9 px-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold " +
                          (busyDeleteImage ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
                        }
                      >
                        {busyDeleteImage ? "삭제중" : "이미지 제거"}
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
                      placeholder="새 닉네임 (2~8자, 영문/숫자/한글/_)"
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
                    공개 ON이면 운영 캘린더에 현재 연도 기준으로 자동 등록됩니다. (memo=BIRTHDAY:이메일)
                  </div>
                </div>

                <Toggle
                  value={birthdayOpen}
                  onChange={(v) => {
                    if (v && !canUseBirthday) {
                      alert("생일 정보가 없어서 캘린더 등록을 할 수 없습니다.");
                      return;
                    }
                    setBirthdayOpen(v);
                  }}
                  labelOn="공개"
                  labelOff="비공개"
                  disabled={loadingMy}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="text-[11px] text-gray-500">생일</div>

                  <div className="mt-2 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm flex items-center bg-white">
                    {loadingMy ? "불러오는 중..." : birthdayDisplay}
                  </div>

                  <div className="mt-2 text-[11px] text-gray-500">
                    생일은 계정 정보에서 자동으로 불러옵니다. 캘린더 등록은 월/일만 사용하며, 생성 연도는 “현재 연도”로 등록됩니다.
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="text-[11px] text-gray-500">등록 규칙</div>
                  <div className="mt-2 text-sm text-gray-800 leading-relaxed">
                    - 공개 ON: 내 생일을 운영 캘린더에 자동 등록
                    <br />
                    - 공개 OFF: 기존 등록된 생일 이벤트 자동 해제
                    <br />
                    - 중복 방지: 서버 이벤트(memo=BIRTHDAY:email) 기준으로 1개만 유지
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
