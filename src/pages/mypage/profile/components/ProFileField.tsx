import type { ProfileFieldProps } from "../MyProfileDto";

const ProfileField = ({
  label,
  value,
  icon: Icon,
  isEditable = false,
  onChange,
  type = "text",
  options = [],
  isEditing,
  helperText,
}: ProfileFieldProps) => {
  const readOnly = !isEditable;

  const wrapperScale = isEditing && isEditable ? "scale-[1.01]" : "";
  const viewBoxClass = readOnly
    ? "bg-gray-50 border border-gray-200 text-gray-500"
    : "bg-white border border-gray-100 text-gray-900 shadow-sm group-hover:border-[#765AFF]/30";

  return (
    <div className="group flex flex-col">
      <div className="ml-1 min-h-[34px]">
        <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </div>
        <div className="mt-1 min-h-[14px] text-[11px] text-gray-400">
          {helperText ? (
            helperText
          ) : (
            <span className="invisible">자리맞춤</span>
          )}
        </div>
      </div>

      <div className={`relative transition-all duration-300 ${wrapperScale}`}>
        {isEditing && isEditable ? (
          type === "radio" ? (
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200 h-12 items-center">
              {options.map((opt) => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name={label}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={onChange}
                    className="peer sr-only"
                  />
                  <div className="py-2 text-center text-sm font-medium text-gray-500 rounded-xl transition-all peer-checked:bg-white peer-checked:text-[#765AFF] peer-checked:shadow-sm">
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <input
              type={type}
              value={value ?? ""}
              onChange={onChange}
              className="w-full h-12 px-5 bg-gray-50 border-0 rounded-2xl text-gray-900 font-medium focus:ring-2 focus:ring-[#765AFF]/20 focus:bg-white transition-all outline-none placeholder:text-gray-300"
            />
          )
        ) : (
          <div
            className={`w-full h-12 px-5 rounded-2xl flex items-center justify-between transition-colors ${viewBoxClass}`}
          >
            <span className={readOnly ? "font-medium" : "font-medium"}>
              {type === "radio"
                ? options.find((o) => o.value === value)?.label || value
                : value || (
                    <span className="text-gray-300 font-normal">미입력</span>
                  )}
            </span>
            {!isEditing && !readOnly && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-[#765AFF] transition-colors" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileField;
