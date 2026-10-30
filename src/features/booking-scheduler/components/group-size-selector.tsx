"use client";

import React from "react";
import { Users } from "lucide-react";

interface GroupSizeSelectorProps {
  groupSize: number;
  onSelectGroupSize: (size: number) => void;
  durationMinutes: number;
  bufferMinutes: number;
}

export function GroupSizeSelector({
  groupSize,
  onSelectGroupSize,
  durationMinutes,
  bufferMinutes
}: GroupSizeSelectorProps) {
  const options = [1, 2, 3, 4];

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-900">
            Number of Patients
          </span>
          <p className="text-[11px] text-slate-500">
            {groupSize === 1
              ? `Standard 1-person consultation (${durationMinutes} mins${bufferMinutes > 0 ? ` + ${bufferMinutes}m buffer` : ""})`
              : `Group booking for ${groupSize} people (requires ${groupSize} consecutive free slots, ${durationMinutes} mins each)`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        {options.map((num) => {
          const isSelected = groupSize === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onSelectGroupSize(num)}
              aria-label={`Book for ${num} ${num === 1 ? "person" : "people"}`}
              className={`flex h-8 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                isSelected
                  ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-600 ring-offset-1"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}
