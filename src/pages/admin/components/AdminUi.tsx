// src/pages/admin/components/AdminUi.tsx
import React from "react";

export const SectionTitle: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {right ? <div>{right}</div> : null}
    </div>
  );
};

export const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  hint?: string;
}> = ({ title, value, icon: Icon, hint }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">{title}</div>
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
      </div>
      <div className="mt-2 text-xl font-bold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-gray-500">{hint}</div>}
    </div>
  );
};
