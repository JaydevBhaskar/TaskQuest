import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { 
  User, Settings, Edit, Star, CheckCheck, Trophy, 
  BarChart3, Calendar, Award, ImageIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import AchievementBadge from "@/components/achievement-badge";
import { getRankOrdinal } from "@/lib/utils";

const profileFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  avatar_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
  });
  
  // Fetch user's earned achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/achievements`],
    enabled: !!user,
  });
  
  // Fetch leaderboard to get rank
  const { data: leaderboard } = useQuery({
    queryKey: ['/api/leaderboard'],
  });
  
  const userRank = leaderboard?.findIndex((u: any) => u.id === user?.id) + 1;
  
  // Calculate progress to next level
  const nextLevelXp = user ? (user.level * 100) : 100;
  const currentLevelXp = nextLevelXp - 100;
  const progressToNextLevel = user ? Math.min(100, ((user.xp - currentLevelXp) / 100) * 100) : 0;
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      avatar_url: user?.avatar_url || "",
    },
    values: {
      username: user?.username || "",
      email: user?.email || "",
      avatar_url: user?.avatar_url || "",
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const res = await apiRequest('PATCH', `/api/users/${user.id}`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully!",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const stats = [
    { label: "XP Points", value: user?.xp || 0, icon: <Star className="h-4 w-4" />, color: "text-purple-400" },
    { label: "Tasks Completed", value: user?.tasks_completed || 0, icon: <CheckCheck className="h-4 w-4" />, color: "text-[#1DB954]" },
    { label: "Current Rank", value: userRank ? getRankOrdinal(userRank) : "--", icon: <Trophy className="h-4 w-4" />, color: "text-yellow-400" },
    { label: "Current Streak", value: `${user?.streak || 0} days`, icon: <Calendar className="h-4 w-4" />, color: "text-blue-400" },
  ];
  
  if (userLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center mb-4">
          <Skeleton className="h-8 w-8 rounded-full bg-zinc-800 mr-3" />
          <Skeleton className="h-8 w-40 bg-zinc-800" />
        </div>
        
        <Skeleton className="h-64 w-full bg-zinc-800" />
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center mb-4">
        <User className="mr-3 h-8 w-8 text-[#1DB954]" />
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>
      
      <Card className="bg-zinc-800 overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-[#1DB954]/20 to-[#1DB954]/5">
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-white bg-black/20 hover:bg-black/40"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Settings className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end -mt-16 mb-6 gap-4">
            <Avatar className="h-24 w-24 border-4 border-zinc-800">
              <AvatarImage src={user.avatar_url || ''} alt={user.username} />
              <AvatarFallback className="text-2xl">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              {!isEditing ? (
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                  <p className="text-zinc-400">{user.email}</p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your username" 
                                className="bg-zinc-700 border-zinc-600" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your email" 
                                className="bg-zinc-700 border-zinc-600" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="avatar_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/avatar.jpg" 
                              className="bg-zinc-700 border-zinc-600" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-[#1DB954] hover:bg-[#1DB954]/90"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-center text-lg font-bold text-white">
                <Star className="h-5 w-5 text-[#1DB954] mr-1" />
                Level {user.level}
              </div>
              <div className="text-sm text-zinc-400">
                {nextLevelXp - user.xp} XP to Level {user.level + 1}
              </div>
              <div className="w-full mt-2 max-w-xs">
                <Progress value={progressToNextLevel} className="h-2" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-zinc-700/50 rounded-lg p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400">{stat.label}</span>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
                <div className="text-xl md:text-2xl font-bold text-white">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements" className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Award className="mr-2 h-5 w-5 text-[#1DB954]" /> Your Achievements
          </h2>
          
          {achievementsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 bg-zinc-800" />
              ))}
            </div>
          ) : achievements?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {achievements.map((item: any) => {
                const colorMap: Record<string, string> = {
                  "Weekly Warrior": "bg-purple-500",
                  "Early Bird": "bg-yellow-500",
                  "Team Player": "bg-pink-500",
                  "Perfect Week": "bg-[#1DB954]",
                };
                
                return (
                  <Card key={item.achievement.id} className="bg-zinc-800 p-4 text-center">
                    <AchievementBadge
                      name={item.achievement.name}
                      iconUrl={item.achievement.badge_url}
                      color={colorMap[item.achievement.name] || "bg-blue-500"}
                    />
                    <p className="text-xs text-zinc-400 mt-2">
                      Earned on {new Date(item.achieved_at).toLocaleDateString()}
                    </p>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-zinc-800 p-8 text-center">
              <Award className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No achievements yet</h3>
              <p className="text-zinc-400">
                Complete tasks and challenges to earn achievements!
              </p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-[#1DB954]" /> Your Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-zinc-800 p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <CheckCheck className="mr-2 h-5 w-5 text-[#1DB954]" /> Task Completion
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">Daily Average</span>
                    <span className="text-sm font-medium">
                      {user.tasks_completed > 0 
                        ? (user.tasks_completed / Math.max(1, Math.ceil((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1) 
                        : '0'} tasks
                    </span>
                  </div>
                  <Progress value={Math.min(100, user.tasks_completed * 10)} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">Completion Rate</span>
                    <span className="text-sm font-medium">
                      {user.tasks_completed > 0 ? '85%' : '0%'}
                    </span>
                  </div>
                  <Progress value={user.tasks_completed > 0 ? 85 : 0} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">Streak Consistency</span>
                    <span className="text-sm font-medium">
                      {user.streak > 0 ? `${user.streak} days` : 'No active streak'}
                    </span>
                  </div>
                  <Progress value={Math.min(100, user.streak * 10)} className="h-2" />
                </div>
              </div>
            </Card>
            
            <Card className="bg-zinc-800 p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Star className="mr-2 h-5 w-5 text-[#1DB954]" /> XP Breakdown
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">From Tasks</span>
                    <span className="text-sm font-medium">
                      {Math.floor(user.xp * 0.75)} XP
                    </span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">From Achievements</span>
                    <span className="text-sm font-medium">
                      {Math.floor(user.xp * 0.2)} XP
                    </span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">From Streaks</span>
                    <span className="text-sm font-medium">
                      {Math.floor(user.xp * 0.05)} XP
                    </span>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
              </div>
            </Card>
            
            <Card className="bg-zinc-800 p-4 md:col-span-2">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <ImageIcon className="mr-2 h-5 w-5 text-[#1DB954]" /> Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Member Since</p>
                  <p className="font-medium">
                    {new Date(user.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Account Status</p>
                  <p className="font-medium flex items-center">
                    <span className="h-2 w-2 rounded-full bg-[#1DB954] mr-2"></span>
                    Active
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Achievements Earned</p>
                  <p className="font-medium">{achievements?.length || 0} badges</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Total XP Earned</p>
                  <p className="font-medium">{user.xp} points</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
