import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Home,
  CheckSquare,
  Users,
  Trophy,
  Heart,
  Award,
  UserCog,
  LogOut,
  CheckSquareIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

const NavItem = ({ href, icon, children, active }: NavItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover:translate-y-[-2px]",
          active
            ? "bg-[#1DB954] bg-opacity-20 text-[#1DB954]"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
        )}
      >
        <span className="mr-3 text-lg">{icon}</span>
        {children}
      </a>
    </Link>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="hidden md:flex md:flex-col md:w-64 bg-zinc-900 border-r border-zinc-800 p-5">
      <div className="flex items-center mb-8">
        <CheckSquareIcon className="text-[#1DB954] text-2xl mr-2" />
        <h1 className="text-xl font-bold text-white">TaskForge</h1>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center mb-4 px-3 py-2 bg-zinc-800 rounded-md">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatar_url || ''} alt={user.username} />
            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user.username}</p>
            <p className="text-xs text-zinc-400">Level {user.level}</p>
          </div>
        </div>
      </div>
      
      <nav className="space-y-1.5">
        <NavItem href="/" icon={<Home />} active={location === "/"}>
          Dashboard
        </NavItem>
        <NavItem
          href="/tasks"
          icon={<CheckSquare />}
          active={location === "/tasks"}
        >
          My Tasks
        </NavItem>
        <NavItem
          href="/group-tasks"
          icon={<Users />}
          active={location === "/group-tasks"}
        >
          Group Tasks
        </NavItem>
        <NavItem
          href="/leaderboard"
          icon={<Trophy />}
          active={location === "/leaderboard"}
        >
          Leaderboard
        </NavItem>
        <NavItem
          href="/friends"
          icon={<Heart />}
          active={location === "/friends"}
        >
          Friends
        </NavItem>
        <NavItem
          href="/rewards"
          icon={<Award />}
          active={location === "/rewards"}
        >
          Rewards
        </NavItem>
        <NavItem
          href="/profile"
          icon={<UserCog />}
          active={location === "/profile"}
        >
          Profile
        </NavItem>
      </nav>

      <div className="mt-auto">
        <Button
          variant="secondary"
          className="w-full flex items-center justify-center"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
