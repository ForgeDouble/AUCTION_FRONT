import React from "react";
import { Image } from "lucide-react";

type Props = {
  className?: string;
  label?: string; // 필요하면 "No Image" 대신 다른 문구도 가능
};

export default function PlaceHolder({ className = "", label = "No Image" }: Props) {
  return (
    <div
      className={
        "w-full h-full bg-white ring-1 ring-black/10 " +
        "flex items-center justify-center " +
        className
      }
    >
      <div className="flex flex-col items-center gap-2">

        <div className="w-10 h-10 rounded-xl bg-black/5 ring-1 ring-black/10 flex items-center justify-center">
          <Image className="w-5 h-5 text-black/45" />
        </div>

        <div className="text-[11px] font-semibold text-black/45 tracking-wide">
          {label}
        </div>
      </div>
    </div>
  );
}