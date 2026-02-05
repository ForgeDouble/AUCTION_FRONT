import React, { useEffect, useMemo, useState } from "react";
import { X, Star, UploadCloud, Trash2, Tag } from "lucide-react";
import { createReview, fetchCanWriteReview } from "./reviewApi";
import { REVIEW_TAG_LABEL, type PendingReviewRowDto, type ReviewTag } from "./reviewTypes";

const TAGS: ReviewTag[] = [
    "SAME_AS_DESCRIPTION",
    "KIND_AND_CONSIDERATE",
    "RESPONDS_WELL",
    "DETAILED_INFO",
    "FAST_AFTER_WIN",
];

function ratingOptions() {
    const arr: number[] = [];
    for (let i = 0; i <= 10; i++) arr.push(i / 2);
    return arr;
}

export default function ReviewWriteModal(props: {
    open: boolean;
    token: string;
    target: PendingReviewRowDto | null;
    onClose: () => void;
    onSubmitted: () => void;
}) {
    const { open, token, target, onClose, onSubmitted } = props;

    const [canWrite, setCanWrite] = useState<{ ok: boolean; reason?: string }>({ ok: true });
    const [rating, setRating] = useState<number>(5.0);
    const [tags, setTags] = useState<ReviewTag[]>([]);
    const [content, setContent] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

    useEffect(() => {
        return () => {
        previews.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [previews]);

    useEffect(() => {
        if (!open) return;
        setErr(null);
        setRating(5.0);
        setTags([]);
        setContent("");
        setFiles([]);

        if (!target?.productId) return;

        (async () => {
        try {
            const r = await fetchCanWriteReview(token, target.productId);
            setCanWrite({ ok: r.canWrite, reason: r.reason });
        } catch (e: any) {
            const msg = String(e?.message ?? e);
            if (msg.includes("AUTH_REQUIRED")) {
            setCanWrite({ ok: false, reason: "로그인이 필요합니다." });
            return;
            }
            setCanWrite({ ok: true });
        }
        })();
    }, [open, target?.productId]);

    if (!open || !target) return null;

    const toggleTag = (t: ReviewTag) => {
        setTags((prev) => {
            const has = prev.includes(t);
            if (has) return prev.filter((x) => x !== t);
            if (prev.length >= 10) return prev;
            return [...prev, t];
        });
    };

    const onPickFiles = (list: FileList | null) => {
        if (!list) return;
        const next = [...files];
        for (const f of Array.from(list)) next.push(f);
        setFiles(next);
    };

    const removeFile = (idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    const submit = async () => {
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
            const msg = String(e?.message ?? e);
            setErr(msg.includes("AUTH_REQUIRED") ? "로그인이 필요합니다." : msg);
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
                    {target.productName} · 판매자 {target.sellerNick ?? "알 수 없음"}
                </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/5 grid place-items-center">
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>

        <div className="p-6 space-y-6">
            {!canWrite.ok && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
                    작성 불가: {canWrite.reason}
                </div>
            )}

            {err && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
                    {err}
                </div>
            )}

            {/* Rating */}
            <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-violet-600" fill="currentColor" />
                    만족도
                </div>
                <div className="text-sm font-extrabold text-violet-700">{rating.toFixed(1)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                {ratingOptions().map((v) => {
                    const active = v === rating;
                    return (
                    <button
                        key={v}
                        onClick={() => setRating(v)}
                        className={
                        "px-3 py-1.5 rounded-xl text-xs font-bold border transition " +
                        (active
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")
                        }
                    >
                        {v.toFixed(1)}
                    </button>
                    );
                })}
                </div>
                <div className="text-[11px] text-gray-400 mt-2">0.5점 단위로 선택하세요.</div>
            </div>

            {/* Tags */}
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
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")
                        }
                    >
                        {REVIEW_TAG_LABEL[t]}
                    </button>
                    );
                })}
                </div>
                <div className="text-[11px] text-gray-400 mt-2">
                선택됨 {tags.length} / 10
                </div>
            </div>

            {/* Content */}
            <div className="rounded-2xl border border-gray-100 p-5">
                <div className="font-bold text-gray-900 mb-3">내용 (선택)</div>
                <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="거래 후기를 남겨주세요 (선택)"
                className="w-full min-h-[110px] rounded-2xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
            </div>

            {/* Images */}
            <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-gray-400" />
                    사진 (선택)
                </div>
                <label className="px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-gray-700 cursor-pointer">
                    추가하기
                    <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => onPickFiles(e.target.files)}
                    />
                </label>
                </div>

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

            {/* Actions */}
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
                className="px-6 py-3 rounded-2xl bg-violet-600 text-white text-sm font-extrabold hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                {submitting ? "등록 중..." : "리뷰 등록"}
                </button>
            </div>
            </div>
        </div>
        </div>


    );
}