import { BadgeCheck } from "lucide-react";

interface AchievementBadgeProps {
  name: string;
  iconUrl?: string;
  color?: string;
  earned?: boolean;
}

export default function AchievementBadge({
  name,
  iconUrl,
  color = "bg-purple-500",
  earned = true,
}: AchievementBadgeProps) {
  return (
    <div className="badge flex flex-col items-center transition-all duration-300 hover:scale-105">
      <div 
        className={`w-14 h-14 rounded-full ${color} bg-opacity-20 flex items-center justify-center mb-2 ${!earned && 'grayscale opacity-50'}`}
      >
        {iconUrl ? (
          <img 
            src={iconUrl}
            alt={name} 
            className="w-10 h-10"
          />
        ) : (
          <BadgeCheck className="w-7 h-7 text-white" />
        )}
      </div>
      <span className="text-xs text-center text-white">
        {name}
      </span>
    </div>
  );
}
