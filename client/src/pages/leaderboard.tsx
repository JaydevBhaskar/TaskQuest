import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Search, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getRankOrdinal } from "@/lib/utils";

export default function Leaderboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
  });
  
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
  });
  
  const { data: friends } = useQuery({
    queryKey: ['/api/friends'],
  });
  
  // Filter users based on search query
  const filteredUsers = leaderboard?.filter((user: any) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Check if user is already a friend
  const isFriend = (userId: number) => {
    if (!friends) return false;
    return friends.some((friend: any) => 
      (friend.user_id === currentUser.id && friend.friend_id === userId) ||
      (friend.user_id === userId && friend.friend_id === currentUser.id)
    );
  };
  
  const sendFriendRequest = async (userId: number) => {
    try {
      await apiRequest('POST', '/api/friends/request', { friend_id: userId });
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Trophy className="mr-3 h-8 w-8 text-yellow-400" />
          <h1 className="text-2xl font-bold">Leaderboard</h1>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-800 border-zinc-700 pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        </div>
      </div>
      
      <Card className="bg-zinc-800 overflow-hidden">
        <div className="p-4 bg-zinc-700 border-b border-zinc-600 flex items-center">
          <div className="w-12 text-center font-semibold text-sm text-zinc-300">#</div>
          <div className="flex-1 font-semibold text-sm text-zinc-300">User</div>
          <div className="w-20 text-center font-semibold text-sm text-zinc-300">Level</div>
          <div className="w-20 text-center font-semibold text-sm text-zinc-300">XP</div>
          <div className="w-24 text-center font-semibold text-sm text-zinc-300">Tasks</div>
          <div className="w-20 text-center font-semibold text-sm text-zinc-300">Action</div>
        </div>
        
        {isLoading ? (
          <div className="divide-y divide-zinc-700">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="p-4 flex items-center">
                <div className="w-12 text-center">
                  <Skeleton className="h-6 w-6 mx-auto bg-zinc-700" />
                </div>
                <div className="flex-1 flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full bg-zinc-700 mr-3" />
                  <Skeleton className="h-5 w-32 bg-zinc-700" />
                </div>
                <div className="w-20 text-center">
                  <Skeleton className="h-5 w-10 mx-auto bg-zinc-700" />
                </div>
                <div className="w-20 text-center">
                  <Skeleton className="h-5 w-12 mx-auto bg-zinc-700" />
                </div>
                <div className="w-24 text-center">
                  <Skeleton className="h-5 w-16 mx-auto bg-zinc-700" />
                </div>
                <div className="w-20 text-center">
                  <Skeleton className="h-8 w-8 mx-auto rounded-full bg-zinc-700" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="divide-y divide-zinc-700">
            {filteredUsers.map((user: any, index: number) => {
              const isCurrentUser = user.id === currentUser.id;
              let medalColor = "";
              
              if (index === 0) medalColor = "text-yellow-400";
              else if (index === 1) medalColor = "text-gray-300";
              else if (index === 2) medalColor = "text-amber-700";
              
              return (
                <div 
                  key={user.id} 
                  className={`p-4 flex items-center ${isCurrentUser ? 'bg-[#1DB954]/10' : ''} hover:bg-zinc-700/50 transition-colors`}
                >
                  <div className="w-12 text-center">
                    {index < 3 ? (
                      <Medal className={`h-6 w-6 mx-auto ${medalColor}`} />
                    ) : (
                      <span className="text-zinc-400 font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">
                        {user.username} {isCurrentUser && <span className="text-xs text-[#1DB954]">(You)</span>}
                      </p>
                      <p className="text-xs text-zinc-400">Streak: {user.streak} days</p>
                    </div>
                  </div>
                  <div className="w-20 text-center font-medium">
                    {user.level}
                  </div>
                  <div className="w-20 text-center font-medium">
                    {user.xp}
                  </div>
                  <div className="w-24 text-center font-medium">
                    {user.tasks_completed}
                  </div>
                  <div className="w-20 text-center">
                    {!isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                        disabled={isFriend(user.id)}
                        onClick={() => sendFriendRequest(user.id)}
                        title={isFriend(user.id) ? "Already friends" : "Add friend"}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-zinc-400">
              {searchQuery ? "No users match your search criteria." : "Leaderboard is empty."}
            </p>
          </div>
        )}
      </Card>
      
      {currentUser && (
        <Card className="bg-zinc-800 mt-6 p-4">
          <p className="text-sm text-zinc-400 mb-2">Your current ranking:</p>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-[#1DB954]/20 flex items-center justify-center mr-4">
              <Trophy className="h-6 w-6 text-[#1DB954]" />
            </div>
            <div>
              <h3 className="font-medium text-white">
                {getRankOrdinal(filteredUsers.findIndex((u: any) => u.id === currentUser.id) + 1)} Place
              </h3>
              <p className="text-xs text-zinc-400">
                Keep completing tasks to climb the leaderboard!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
