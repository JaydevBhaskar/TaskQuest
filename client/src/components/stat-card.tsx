import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconColor: string;
}

export default function StatCard({ label, value, icon, iconColor }: StatCardProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400">{label}</span>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="text-xl md:text-2xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}
