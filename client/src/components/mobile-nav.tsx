import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, CheckSquare, Trophy, User } from "lucide-react";

const NavItem = ({ 
  href, 
  icon, 
  label, 
  active 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
}) => {
  return (
    <Link href={href}>
      <a className="nav-item flex flex-col items-center px-3 py-1 transition-all duration-200 hover:translate-y-[-2px]">
        <span className={cn("text-xl", active ? "text-[#1DB954]" : "text-zinc-400")}>{icon}</span>
        <span className={cn("text-xs mt-1", active ? "text-[#1DB954]" : "text-zinc-400")}>{label}</span>
      </a>
    </Link>
  );
};

export default function MobileNav() {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-2 z-50">
      <div className="flex justify-between">
        <NavItem
          href="/"
          icon={<Home />}
          label="Home"
          active={location === "/"}
        />
        <NavItem
          href="/tasks"
          icon={<CheckSquare />}
          label="Tasks"
          active={location === "/tasks" || location === "/group-tasks"}
        />
        <NavItem
          href="/leaderboard"
          icon={<Trophy />}
          label="Leaderboard"
          active={location === "/leaderboard"}
        />
        <NavItem
          href="/profile"
          icon={<User />}
          label="Profile"
          active={location === "/profile"}
        />
      </div>
    </div>
  );
}
