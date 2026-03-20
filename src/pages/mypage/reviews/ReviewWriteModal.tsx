// pages/mypage/reviews/ReviewWriteModal.tsx
import { useEffect, useMemo, useState } from "react";
import { X, Star, UploadCloud, Trash2, Tag, RotateCcw } from "lucide-react";
import { createReview, fetchCanWriteReview } from "./reviewApi";
import { REVIEW_TAG_LABEL, type PendingReviewRowDto, type ReviewTag } from "./reviewTypes";
import { useNavigate } from "react-router-dom";
import { handleApiError } from "@/errors/HandleApiError";

const TAGS: ReviewTag[] = [
    "SAME_AS_DESCRIPTION",
    "KIND_AND_CONSIDERATE",
    "RESPONDS_WELL",
    "DETAILED_INFO",
    "FAST_AFTER_WIN",
];

// function ratingOptions() {
//     const arr: number[] = [];
//     for (let i = 0; i <= 10; i++) arr.push(i / 2);
//     return arr;
// }
function StarRating(props: {
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
}) {
    const { value, onChange, disabled } = props;
    return (
        <div className={"flex items-center gap-1 " + (disabled ? "opacity-60" : "")}>
        {[1, 2, 3, 4, 5].map((i) => {
            const full = value >= i;
            const half = !full && value >= i - 0.5;
            const width = full ? "100%" : half ? "50%" : "0%";

            return (
                <div key={i} className="relative w-8 h-8">
                    {/* outline */}
                    <Star className="absolute inset-0 w-8 h-8 text-gray-300" />

                    {/* filled (clipped) */}
                    <div className="absolute inset-0 overflow-hidden" style={{ width }}>
                    <Star className="w-8 h-8 text-[rgb(118,90,255)]" fill="currentColor" />
                    </div>

                    {!disabled && (
                    <>
                        <button
                            type="button"
                            aria-label={`${i - 0.5}점`}
                            onClick={() => onChange(i - 0.5)}
                            className="absolute inset-y-0 left-0 w-1/2 rounded-l-md focus:outline-none"
                        />
                        <button
                            type="button"
                            aria-label={`${i}점`}
                            onClick={() => onChange(i)}
                            className="absolute inset-y-0 right-0 w-1/2 rounded-r-md focus:outline-none"
                        />
                    </>
                    )}
                </div>
                );
            })}
            {/* <button
                type="button"
                onClick={() => onChange(0)}
                disabled={disabled}
                className="ml-2 text-xs font-bold text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
            >
                초기화
            </button> */}
        </div>

    );
}

export default function ReviewWriteModal(props: {
    open: boolean;
    token: string;
    target: PendingReviewRowDto | null;
    onClose: () => void;
    onSubmitted: () => void;
}) {
    const MAX_IMAGES = 12;
    const MAX_FILE_MB = 10;
    const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
    
    const { open, token, target, onClose, onSubmitted } = props;

    const [canWrite, setCanWrite] = useState<{ ok: boolean; reason?: string }>({ ok: true });
    const [rating, setRating] = useState<number>(0.0);
    const [tags, setTags] = useState<ReviewTag[]>([]);
    const [content, setContent] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [imgHint, setImgHint] = useState<string | null>(null);

    const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

    const nav = useNavigate();

    useEffect(() => {
        return () => {
        previews.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [previews]);

    useEffect(() => {
        if (!open) return;

        setErr(null);
        setImgHint(null);
        setRating(0.0);
        setTags([]);
        setContent("");
        setFiles([]);

        if (!target?.productId) return;

        if (!token) {
            const msg = "로그인이 필요합니다.";
            setCanWrite({ ok: false, reason: msg });
            setErr(msg);
            return;
        }

        (async () => {
            try {
                const r = await fetchCanWriteReview(token, target.productId);
                setCanWrite({ ok: r.canWrite, reason: r.reason });
            } catch (e: any) {
                console.error("[ReviewWriteModal canWrite ERROR]", e);

                const r = handleApiError(e);

                if (r.type === "AUTH") {
                    setCanWrite({ ok: false, reason: r.message });
                    setErr(r.message);
                    return;
                }

                if (r.type === "REDIRECT") {
                    if (r.to === "/404") {
                        nav("/404");
                        return;
                    }
                    const msg = "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                    setCanWrite({ ok: false, reason: msg });
                    setErr(msg);
                    return;
                }

                const msg = r.type === "IGNORE" ? "요청이 취소되었습니다." : (r.message ?? "알 수 없는 오류가 발생했습니다. 관리자에게 문의해주세요.");
                setCanWrite({ ok: false, reason: msg });
                setErr(msg);
            }


        })();
    }, [open, target?.productId, token, nav]);

    if (!open || !target) return null;

    const toggleTag = (t: ReviewTag) => {
        setTags((prev) => {
            const has = prev.includes(t);
            if (has) return prev.filter((x) => x !== t);
            if (prev.length >= 5) return prev;
            return [...prev, t];
        });
    };

    const onPickFiles = (list: FileList | null) => {
        if (!list) return;

        const incoming = Array.from(list);

        const remain = Math.max(0, MAX_IMAGES - files.length);
        if (remain <= 0) {
            setImgHint(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다. (현재 ${files.length}장)`);
            return;
        }

        const next: File[] = [];
        let rejectedBig = 0;
        let rejectedType = 0;

        for (const f of incoming) {
            if (!f.type.startsWith("image/")) {
                rejectedType += 1;
                continue;
            }

            if (f.size > MAX_FILE_BYTES) {
                rejectedBig += 1;
                continue;
            }

            if (next.length >= remain) break;
            next.push(f);
        }

        // 초과 선택 안내
        if (incoming.length > remain) {
            setImgHint(`최대 ${MAX_IMAGES}장까지 첨부 가능해서 ${remain}장만 추가되었습니다.`);
        } else if (rejectedBig > 0) {
            setImgHint(`용량이 큰 이미지(${rejectedBig}개)는 제외되었습니다. (최대 ${MAX_FILE_MB}MB)`);
        } else if (rejectedType > 0) {
            setImgHint(`이미지 파일만 첨부할 수 있습니다. (${rejectedType}개 제외)`);
        } else {
            setImgHint(null);
        }

        if (next.length === 0) return;
        setFiles((prev) => [...prev, ...next]);

    };

    const removeFile = (idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
        setImgHint(null);
    };

    const submit = async () => {

        if (!token) {
            setErr("로그인이 필요합니다.");
            return;
        }
        if (!target?.productId) return;

        setErr(null);

        if (!canWrite.ok) {
            setErr(canWrite.reason ?? "작성할 수 없습니다.");
            return;
        }
        if (!tags || tags.length === 0) {
            setErr("리뷰 태그는 최소 1개 이상 선택해야 합니다.");
            return;
        }

        setSubmitting(true);
        try {
            await createReview(token, {
                productId: target.productId,
                rating,
                tags,
                content: content?.trim() ? content.trim() : null,
            }, files);

        onSubmitted();
        } catch (e: any) {
            console.error("[ReviewWriteModal submit ERROR]", e);
            const r = handleApiError(e);
            if (r.type === "IGNORE") return;

            if (r.type === "AUTH") {
                setErr(r.message);
                return;
            }
            if (r.type === "REDIRECT") {
                if (r.to === "/404") {
                    nav("/404");
                    return;
                }
                setErr("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                return;
            }
            setErr(r.message ?? "알 수 없는 오류가 발생했습니다. 관리자에게 문의해주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/35" onClick={onClose} />
        <div className="relative w-[min(720px,92vw)] max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-black/5">
        <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between">
        <div>
            <div className="text-lg font-extrabold text-gray-900">리뷰 작성</div>
                <div className="text-xs text-gray-500 mt-1">
                    <strong>{target.productName}</strong> · <strong>{target.sellerNick ?? "알 수 없음"}</strong>님 상점
                </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/5 grid place-items-center">
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>

        <div className="p-6 space-y-6">
            {/* {!canWrite.ok && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
                    작성 불가: {canWrite.reason}
                </div>
            )} */}

            {err && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
                    {err}
                </div>
            )}

            {/* 만족도 부분 */}
            <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-gray-400" /> 만족도 
                    </div> 
                    <div className="flex items-center gap-2"> 
                        <div className="text-sm font-extrabold text-gray-400">{rating.toFixed(1)}</div>

                        <button
                            type="button"
                            onClick={() => setRating(0)}
                            disabled={submitting || !canWrite.ok}
                            title="초기화"
                            aria-label="만족도 초기화"
                            className="w-8 h-8 rounded-xl hover:bg-black/5 grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="w-4 h-4 text-gray-500" />

                        </button>
                    </div>
                </div>

                <StarRating
                    value={rating}
                    onChange={setRating}
                    disabled={submitting || !canWrite.ok}
                />
            </div>

            {/* 태그 관련 */}
            <div className="rounded-2xl border border-gray-100 p-5">
                <div className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-400" />
                    태그 선택 (최소 1개)
                </div>
                <div className="flex flex-wrap gap-2">
                {TAGS.map((t) => {
                    const active = tags.includes(t);
                    return (
                    <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={
                        "px-3 py-2 rounded-xl text-xs font-bold border transition " +
                        (active
                            ? "bg-[rgba(118,90,255,0.08)] text-[rgb(118,90,255)] border-[rgba(118,90,255,0.25)]"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")
                        }
                    >
                        {REVIEW_TAG_LABEL[t]}
                    </button>
                    );
                })}
                </div>
                <div className="text-[11px] text-gray-400 mt-2">
                선택됨 {tags.length} / 5
                </div>
            </div>

            {/* 내용 */}
            <div className="rounded-2xl border border-gray-100 p-5">
                <div className="font-bold text-gray-900 mb-3">내용 (선택)</div>
                <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="거래 후기를 남겨주세요 (선택)"
                className="w-full min-h-[110px] rounded-2xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(118,90,255,0.2)]"
                />
            </div>

            {/* 임지ㅣ */}

            <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-gray-400" />
                        사진 (선택)
                    </div>

                    <label
                        className={
                            "px-3 py-2 rounded-xl text-xs font-bold " +
                            (files.length >= MAX_IMAGES || submitting || !canWrite.ok
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-black/5 hover:bg-black/10 text-gray-700 cursor-pointer")
                        }
                    >
                    추가하기
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={files.length >= MAX_IMAGES || submitting || !canWrite.ok}
                        onChange={(e) => onPickFiles(e.target.files)}
                    />
                    </label>
                </div>

                    <div className="flex items-center justify-between">
                        <div className="text-[11px] text-gray-400">
                            첨부 {files.length} / {MAX_IMAGES} · 이미지 1장당 최대 {MAX_FILE_MB}MB
                        </div>

                        {files.length >= MAX_IMAGES && (
                            <div className="text-[11px] font-semibold text-[rgb(118,90,255)]">
                                최대 첨부 수에 도달했어요
                            </div>
                        )}
                    </div>

                    {imgHint && (
                        <div className="mt-2 text-[12px] font-semibold text-[rgb(118,90,255)] bg-[rgba(118,90,255,0.08)] border border-[rgba(118,90,255,0.20)] px-3 py-2 rounded-xl">
                            {imgHint}
                        </div>
                    )}

                    <div className="mt-3">
                        {files.length === 0 ? (
                            <div className="text-sm text-gray-400">업로드할 이미지가 없습니다.</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {files.map((f, i) => (
                                    <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden">
                                        <div className="aspect-square bg-gray-100 overflow-hidden">
                                            <img src={previews[i]} alt={f.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-2 flex items-center justify-between gap-2">
                                            <div className="text-[11px] text-gray-500 truncate">{f.name}</div>
                                            <button
                                                onClick={() => removeFile(i)}
                                                className="w-8 h-8 rounded-xl hover:bg-rose-50 grid place-items-center"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4 text-rose-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            onClick={onClose}
                            className="px-5 py-3 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
                            disabled={submitting}
                        >
                        취소
                        </button>
                        <button
                            onClick={submit}
                            disabled={submitting || !canWrite.ok}
                            className="px-6 py-3 rounded-2xl bg-[rgb(118,90,255)] text-white text-sm font-extrabold hover:bg-[rgb(98,72,235)] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                        {submitting ? "등록 중..." : "리뷰 등록"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}