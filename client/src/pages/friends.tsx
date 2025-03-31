import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck, UserX, Search, Users, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import FriendActivity from "@/components/friend-activity";

export default function Friends() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  
  // Fetch friends, friend requests, and activities
  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ['/api/friends'],
  });
  
  const { data: friendRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/friends/requests'],
  });
  
  const { data: friendActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities/friends'],
  });
  
  // Search for users by username
  const { data: searchResults, isLoading: searchLoading, refetch: searchUsers } = useQuery({
    queryKey: ['/api/leaderboard'],
    select: (data) => data.filter((user: any) => 
      user.username.toLowerCase().includes(searchUsername.toLowerCase())
    ),
    enabled: false,
  });
  
  // Filter friends based on search query
  const filteredFriends = friends?.filter((friend: any) =>
    friend.friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest('POST', `/api/friends/requests/${requestId}/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      toast({
        title: "Friend request accepted",
        description: "You are now friends with this user!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest('POST', `/api/friends/requests/${requestId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      toast({
        title: "Friend request rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject friend request. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiRequest('POST', '/api/friends/request', { friend_id: friendId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully!",
      });
      setSearchUsername("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      searchUsers();
    }
  };
  
  // Check if user is already a friend or has pending request
  const isFriend = (userId: number) => {
    if (!friends) return false;
    return friends.some((friend: any) => 
      friend.friend.id === userId
    );
  };
  
  const hasPendingRequest = (userId: number) => {
    if (!friendRequests) return false;
    return friendRequests.some((request: any) => 
      request.user_id === userId
    );
  };
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <UserCheck className="mr-3 h-8 w-8 text-[#1DB954]" />
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-800 border-zinc-700 pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        </div>
      </div>
      
      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Requests
            {friendRequests?.length > 0 && (
              <Badge className="ml-2 bg-[#1DB954] text-white">{friendRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="find">Find Friends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="space-y-4">
          {friendsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 bg-zinc-800" />
              ))}
            </div>
          ) : filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFriends.map((friendship: any) => {
                const friend = friendship.friend;
                return (
                  <Card key={friend.id} className="bg-zinc-800 p-4 flex items-center hover:bg-zinc-700/50 transition-colors">
                    <Avatar className="h-14 w-14 mr-4">
                      <AvatarImage src={friend.avatar_url || ''} alt={friend.username} />
                      <AvatarFallback>{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{friend.username}</h3>
                      <div className="flex items-center text-xs text-zinc-400">
                        <span className="mr-3">Level {friend.level}</span>
                        <span className="mr-3">{friend.xp} XP</span>
                        <span>{friend.tasks_completed} Tasks</span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs bg-zinc-700 text-zinc-300 border-none">
                          {friend.streak} day streak
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-zinc-800 p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No friends yet</h3>
              <p className="text-zinc-400 mb-4">
                {searchQuery 
                  ? "No friends match your search criteria."
                  : "Connect with other users to add them as friends!"}
              </p>
              <Button onClick={() => document.querySelector('[data-value="find"]')?.click()}>
                <UserPlus className="mr-2 h-4 w-4" /> Find Friends
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          {requestsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 bg-zinc-800" />
              ))}
            </div>
          ) : friendRequests?.length > 0 ? (
            <div className="space-y-4">
              {friendRequests.map((request: any) => (
                <Card key={request.id} className="bg-zinc-800 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={request.requester.avatar_url || ''} alt={request.requester.username} />
                    <AvatarFallback>{request.requester.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{request.requester.username}</h3>
                    <p className="text-xs text-zinc-400">Level {request.requester.level} • {request.requester.xp} XP</p>
                    <p className="text-sm text-zinc-300 mt-1">Wants to be your friend</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="default" 
                      className="flex-1 sm:flex-initial bg-[#1DB954] hover:bg-[#1DB954]/90"
                      onClick={() => acceptRequestMutation.mutate(request.id)}
                      disabled={acceptRequestMutation.isPending}
                    >
                      <UserCheck className="mr-2 h-4 w-4" /> Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-initial"
                      onClick={() => rejectRequestMutation.mutate(request.id)}
                      disabled={rejectRequestMutation.isPending}
                    >
                      <UserX className="mr-2 h-4 w-4" /> Decline
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-zinc-800 p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No friend requests</h3>
              <p className="text-zinc-400">
                You don't have any pending friend requests right now.
              </p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          {activitiesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-zinc-800 p-4">
                  <div className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded-full bg-zinc-700 mr-3" />
                    <div className="flex-1">
                      <Skeleton className="w-24 h-4 bg-zinc-700 mb-2" />
                      <Skeleton className="w-48 h-3 bg-zinc-700" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : friendActivities?.length > 0 ? (
            <div className="space-y-4">
              {friendActivities.map((activity: any) => {
                let activityText = "did something";
                
                if (activity.activity_type === 'task_completed') {
                  activityText = `Completed "${activity.activity_data.task_title}" (+${activity.activity_data.xp_earned} XP)`;
                } else if (activity.activity_type === 'achievement_earned') {
                  activityText = `Earned "${activity.activity_data.achievement_name}" badge`;
                } else if (activity.activity_type === 'level_up') {
                  activityText = `Reached level ${activity.activity_data.new_level}`;
                }
                
                return (
                  <Card key={activity.id} className="bg-zinc-800 p-4 hover:bg-zinc-700/50 transition-colors">
                    <FriendActivity 
                      avatar={activity.user.avatar_url || ""}
                      name={activity.user.username}
                      activity={activityText}
                      timestamp={activity.created_at}
                    />
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-zinc-800 p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No activity yet</h3>
              <p className="text-zinc-400">
                Add friends to see their activities here!
              </p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="find" className="space-y-4">
          <Card className="bg-zinc-800 p-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search by username..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="flex-1 bg-zinc-700 border-zinc-600"
              />
              <Button 
                type="submit" 
                className="bg-[#1DB954] hover:bg-[#1DB954]/90"
                disabled={searchLoading || !searchUsername.trim()}
              >
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </form>
          </Card>
          
          {searchLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 bg-zinc-800" />
              ))}
            </div>
          ) : searchResults?.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((user: any) => {
                const isAlreadyFriend = isFriend(user.id);
                const hasSentRequest = hasPendingRequest(user.id);
                
                return (
                  <Card key={user.id} className="bg-zinc-800 p-4 flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{user.username}</h3>
                      <p className="text-xs text-zinc-400">Level {user.level} • {user.xp} XP</p>
                    </div>
                    <Button
                      variant={isAlreadyFriend || hasSentRequest ? "secondary" : "default"}
                      className={isAlreadyFriend || hasSentRequest ? "" : "bg-[#1DB954] hover:bg-[#1DB954]/90"}
                      disabled={isAlreadyFriend || hasSentRequest || sendRequestMutation.isPending}
                      onClick={() => sendRequestMutation.mutate(user.id)}
                    >
                      {isAlreadyFriend ? (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" /> Friends
                        </>
                      ) : hasSentRequest ? (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" /> Request Sent
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" /> Add Friend
                        </>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : searchUsername && !searchLoading ? (
            <Card className="bg-zinc-800 p-8 text-center">
              <UserX className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-zinc-400">
                No users match your search criteria. Try a different username.
              </p>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
