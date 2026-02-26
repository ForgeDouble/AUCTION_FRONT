// 공용으로 하나 만들어두면(프로필/리뷰어/댓글 등) 다 재사용 가능
// src/components/common/Avatar.tsx (원하는 위치에 생성)

import React, { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;      // 컨테이너 크기/라운드/테두리 등을 여기서 지정
  iconClassName?: string;  // 아이콘 크기 조절
};

export default function Avatar({
  src,
  alt = "avatar",
  className = "",
  iconClassName = "w-10 h-10",
}: Props) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    // src가 바뀌면 깨짐 상태 초기화
    setBroken(false);
  }, [src]);

  const showImg = Boolean(src) && !broken;

  if (showImg) {
    return (
      <div className={className}>
        <img
          src={src as string}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  // Kakao 느낌: 사람 아이콘 + 부드러운 보라 배경
  return (
    <div
      className={
        "grid place-items-center " +
        "bg-[radial-gradient(120px_circle_at_30%_20%,rgba(118,90,255,0.18),transparent_55%)," +
        "radial-gradient(140px_circle_at_70%_80%,rgba(118,90,255,0.12),transparent_60%)," +
        "linear-gradient(to_bottom,rgba(248,248,255,1),rgba(245,246,255,1))] " +
        className
      }
      aria-label={alt}
    >
      <div className="grid place-items-center rounded-full bg-white/70 ring-1 ring-[rgba(118,90,255,0.18)] shadow-sm">
        <UserIcon className={iconClassName + " text-[rgba(118,90,255,0.60)]"} />
      </div>
    </div>
  );
}