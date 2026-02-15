import { ChevronRight } from "lucide-react";
import type { MenuItemProps } from "../MyProfileDto";

const MenuItem = ({
  onClick,
  icon: Icon,
  label,
  colorClass = "bg-purple-50 text-[#765AFF]",
}: MenuItemProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors text-sm text-gray-600 group"
  >
    <span className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors group-hover:bg-[#765AFF] group-hover:text-white ${colorClass}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-medium">{label}</span>
    </span>
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#765AFF]" />
  </button>
);

export default MenuItem;
