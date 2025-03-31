import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle, Lock, Gift, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AchievementBadge from "@/components/achievement-badge";

export default function Rewards() {
  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });
  
  // Fetch all available achievements
  const { data: allAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements'],
  });
  
  // Fetch user's earned achievements
  const { data: userAchievements, isLoading: userAchievementsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/achievements`],
    enabled: !!user,
  });
  
  // Calculate progress to next level
  const nextLevelXp = user ? (user.level * 100) : 100;
  const currentLevelXp = nextLevelXp - 100;
  const progressToNextLevel = user ? Math.min(100, ((user.xp - currentLevelXp) / 100) * 100) : 0;
  
  // Find earned achievement IDs
  const earnedAchievementIds = userAchievements?.map((ua: any) => ua.achievement.id) || [];
  
  const isAchievementEarned = (achievementId: number) => {
    return earnedAchievementIds.includes(achievementId);
  };
  
  // List of perks that unlock at different levels
  const perks = [
    { level: 1, name: "Task Creation", description: "Create and manage tasks", unlocked: true },
    { level: 2, name: "Custom Avatar", description: "Upload your own profile picture", unlocked: user?.level >= 2 },
    { level: 5, name: "Group Tasks", description: "Create tasks with your friends", unlocked: user?.level >= 5 },
    { level: 10, name: "Task Templates", description: "Save and reuse task templates", unlocked: user?.level >= 10 },
    { level: 15, name: "Dark Theme", description: "Unlock dark theme variations", unlocked: user?.level >= 15 },
    { level: 20, name: "Custom Badges", description: "Create your own achievement badges", unlocked: user?.level >= 20 },
    { level: 25, name: "Priority Tasks", description: "Highlight important tasks", unlocked: user?.level >= 25 },
    { level: 30, name: "Advanced Analytics", description: "Detailed productivity insights", unlocked: user?.level >= 30 },
  ];
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center mb-6">
        <Award className="mr-3 h-8 w-8 text-[#1DB954]" />
        <h1 className="text-2xl font-bold">Rewards & Achievements</h1>
      </div>
      
      {user && (
        <Card className="bg-zinc-800 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1DB954]/20 flex items-center justify-center">
              <Star className="h-8 w-8 text-[#1DB954]" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                <div>
                  <h2 className="text-xl font-bold">Level {user.level}</h2>
                  <p className="text-sm text-zinc-400">
                    {user.xp} XP • {nextLevelXp - user.xp} XP to Level {user.level + 1}
                  </p>
                </div>
                <Badge className="bg-[#1DB954] text-white self-start">
                  {userAchievements?.length || 0} Achievements Unlocked
                </Badge>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </div>
        </Card>
      )}
      
      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="perks">Perks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements" className="space-y-6">
          {achievementsLoading || userAchievementsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="bg-zinc-800 p-4 flex flex-col items-center">
                  <Skeleton className="w-14 h-14 rounded-full bg-zinc-700 mb-2" />
                  <Skeleton className="w-24 h-4 bg-zinc-700 mb-2" />
                  <Skeleton className="w-32 h-3 bg-zinc-700" />
                </Card>
              ))}
            </div>
          ) : allAchievements?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allAchievements.map((achievement: any) => {
                const earned = isAchievementEarned(achievement.id);
                const colorMap: Record<string, string> = {
                  "Weekly Warrior": "bg-purple-500",
                  "Early Bird": "bg-yellow-500",
                  "Team Player": "bg-pink-500",
                  "Perfect Week": "bg-[#1DB954]",
                };
                
                return (
                  <Card 
                    key={achievement.id} 
                    className={`bg-zinc-800 p-4 flex flex-col items-center ${earned ? 'border-[#1DB954]/30' : 'border-zinc-700'}`}
                  >
                    <AchievementBadge
                      name={achievement.name}
                      iconUrl={achievement.badge_url}
                      color={colorMap[achievement.name] || "bg-blue-500"}
                      earned={earned}
                    />
                    <div className="mt-2 text-center">
                      <h3 className="font-medium text-white">{achievement.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1">{achievement.description}</p>
                      <Badge 
                        variant="outline" 
                        className="mt-2 text-xs border-none bg-zinc-700 text-zinc-300"
                      >
                        +{achievement.xp_reward} XP
                      </Badge>
                    </div>
                    {earned && (
                      <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-[#1DB954]" />
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-zinc-800 p-8 text-center">
              <Award className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No achievements found</h3>
              <p className="text-zinc-400">
                Complete tasks and challenges to earn achievements!
              </p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="perks" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {perks.map((perk, index) => (
              <Card 
                key={index}
                className={`bg-zinc-800 p-4 ${perk.unlocked ? 'border-[#1DB954]/30' : 'border-zinc-700 opacity-75'}`}
              >
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    perk.unlocked ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-zinc-700 text-zinc-500'
                  }`}>
                    {perk.unlocked ? <Gift className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className={`font-medium ${perk.unlocked ? 'text-white' : 'text-zinc-400'}`}>
                        {perk.name}
                      </h3>
                      {perk.unlocked && (
                        <CheckCircle className="ml-2 h-4 w-4 text-[#1DB954]" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{perk.description}</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 text-xs ${perk.unlocked 
                        ? 'bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/20' 
                        : 'bg-zinc-700 text-zinc-400 border-none'
                      }`}
                    >
                      {perk.unlocked ? 'Unlocked' : `Unlocks at Level ${perk.level}`}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <Card className="bg-zinc-800 p-4 border-dashed border-zinc-700">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                <Gift className="h-6 w-6 text-zinc-400" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-medium text-white">More perks coming soon!</h3>
                <p className="text-sm text-zinc-400">
                  Keep leveling up to unlock more exciting features and capabilities.
                </p>
              </div>
              <Button variant="outline" className="whitespace-nowrap">
                Suggest a Perk
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
