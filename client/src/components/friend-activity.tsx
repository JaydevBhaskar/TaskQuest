import { formatTimeAgo } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface FriendActivityProps {
  avatar: string;
  name: string;
  activity: string;
  timestamp: string | Date;
}

export default function FriendActivity({ avatar, name, activity, timestamp }: FriendActivityProps) {
  return (
    <div className="flex items-center">
      <Avatar className="w-10 h-10 mr-3">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white">{name}</p>
          <span className="text-xs text-zinc-400">{formatTimeAgo(timestamp)}</span>
        </div>
        <p className="text-xs text-zinc-400">{activity}</p>
      </div>
    </div>
  );
}
