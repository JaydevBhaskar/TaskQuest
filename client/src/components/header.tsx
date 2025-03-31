import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";

export default function Header() {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });
  
  const [notifications, setNotifications] = useState(3);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  if (!user) return null;
  
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 py-3 px-4 flex items-center justify-between">
      {/* Mobile Logo */}
      <div className="md:hidden flex items-center">
        <CheckSquare className="text-[#1DB954] h-5 w-5 mr-2" />
        <h1 className="text-lg font-bold">TaskForge</h1>
      </div>
      
      {/* Search */}
      <div className={`${showMobileSearch ? 'flex w-full' : 'hidden'} md:flex relative md:w-1/3`}>
        <Input
          type="text"
          placeholder="Search tasks, friends, or rewards..."
          className="w-full bg-zinc-800 text-sm border border-zinc-700 rounded-full px-4 py-2 focus:outline-none focus:border-[#1DB954]"
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white hover:bg-transparent"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-[#1DB954] text-xs text-white rounded-full">
              {notifications}
            </span>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-zinc-400 hover:text-white"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
        >
          <Search className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-zinc-400 hover:text-white"
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar');
            if (sidebar) sidebar.classList.toggle('hidden');
          }}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
