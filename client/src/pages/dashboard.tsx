import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Flame, Star, CheckCheck, Trophy, Plus, 
  CheckSquare, UserCheck, Award, RefreshCw 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import StatCard from "@/components/stat-card";
import TaskCard from "@/components/task-card";
import AchievementBadge from "@/components/achievement-badge";
import FriendActivity from "@/components/friend-activity";
import AddTaskDialog from "@/components/add-task-dialog";
import { Task } from "@shared/schema";
import { getRankOrdinal } from "@/lib/utils";

export default function Dashboard({ user }: { user: any }) {
  const { toast } = useToast();
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);
  
  // Fetch user tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks/user'],
  });
  
  // Fetch user achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: [`/api/users/${user.id}/achievements`],
  });
  
  // Fetch friends activities
  const { data: friendsActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities/friends'],
  });
  
  // Fetch leaderboard to get rank
  const { data: leaderboard } = useQuery({
    queryKey: ['/api/leaderboard'],
  });
  
  // Calculate user stats
  const userRank = leaderboard?.findIndex((u: any) => u.id === user.id) + 1;
  const todaysTasks = tasks?.filter((task: Task) => {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  }) || [];
  
  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setAddTaskOpen(true);
  };
  
  return (
    <div className="p-4 md:p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user.username}!
        </h1>
        <p className="text-zinc-400 text-sm md:text-base">
          You have completed{" "}
          <span className="text-[#1DB954] font-medium">
            {user.tasks_completed}
          </span>{" "}
          tasks
        </p>
      </div>
      
      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Current Streak" 
          value={`${user.streak} days`}
          icon={<Flame className="h-4 w-4" />}
          iconColor="text-yellow-400"
        />
        <StatCard 
          label="XP Points" 
          value={user.xp}
          icon={<Star className="h-4 w-4" />}
          iconColor="text-purple-400"
        />
        <StatCard 
          label="Completed" 
          value={user.tasks_completed}
          icon={<CheckCheck className="h-4 w-4" />}
          iconColor="text-[#1DB954]"
        />
        <StatCard 
          label="Rank" 
          value={userRank ? getRankOrdinal(userRank) : "--"}
          icon={<Trophy className="h-4 w-4" />}
          iconColor="text-yellow-400"
        />
      </div>
      
      {/* Today's Tasks */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Today's Tasks</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#1DB954] hover:text-[#1DB954]/90"
            onClick={() => {
              setEditTask(undefined);
              setAddTaskOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add New
          </Button>
        </div>
        
        {tasksLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full bg-zinc-800" />
            ))}
          </div>
        ) : todaysTasks.length > 0 ? (
          <div className="space-y-3">
            {todaysTasks.map((task: Task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={handleEditTask}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-zinc-800 p-4 text-center">
            <p className="text-zinc-400">No tasks scheduled for today.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setEditTask(undefined);
                setAddTaskOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Task
            </Button>
          </Card>
        )}
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Achievements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Achievements</h2>
            <Button 
              variant="link" 
              className="text-[#1DB954] p-0 h-auto"
              onClick={() => window.location.href = "/rewards"}
            >
              View All
            </Button>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            {achievementsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Skeleton className="w-14 h-14 rounded-full bg-zinc-700" />
                    <Skeleton className="w-16 h-4 mt-2 bg-zinc-700" />
                  </div>
                ))}
              </div>
            ) : achievements?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {achievements.slice(0, 4).map((item: any) => (
                  <AchievementBadge
                    key={item.achievement.id}
                    name={item.achievement.name}
                    iconUrl={item.achievement.badge_url}
                    color={
                      item.achievement.name.includes("Week") ? "bg-purple-500" :
                      item.achievement.name.includes("Bird") ? "bg-yellow-500" :
                      item.achievement.name.includes("Team") ? "bg-pink-500" :
                      "bg-[#1DB954]"
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Award className="h-12 w-12 mx-auto text-zinc-600 mb-2" />
                <p className="text-zinc-400">Complete tasks to earn achievements!</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Friends Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Friends Activity</h2>
            <Button 
              variant="link" 
              className="text-[#1DB954] p-0 h-auto"
              onClick={() => window.location.href = "/friends"}
            >
              Find Friends
            </Button>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            {activitiesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded-full bg-zinc-700 mr-3" />
                    <div className="flex-1">
                      <Skeleton className="w-24 h-4 bg-zinc-700 mb-2" />
                      <Skeleton className="w-48 h-3 bg-zinc-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : friendsActivities?.length > 0 ? (
              <div className="space-y-4">
                {friendsActivities.slice(0, 3).map((activity: any) => {
                  let activityText = "did something";
                  
                  if (activity.activity_type === 'task_completed') {
                    activityText = `Completed "${activity.activity_data.task_title}" (+${activity.activity_data.xp_earned} XP)`;
                  } else if (activity.activity_type === 'achievement_earned') {
                    activityText = `Earned "${activity.activity_data.achievement_name}" badge`;
                  } else if (activity.activity_type === 'level_up') {
                    activityText = `Reached level ${activity.activity_data.new_level}`;
                  }
                  
                  return (
                    <FriendActivity 
                      key={activity.id}
                      avatar={activity.user.avatar_url || ""}
                      name={activity.user.username}
                      activity={activityText}
                      timestamp={activity.created_at}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <UserCheck className="h-12 w-12 mx-auto text-zinc-600 mb-2" />
                <p className="text-zinc-400">Add friends to see their activity!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Other Tasks */}
      {tasks?.length > todaysTasks.length && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Upcoming Tasks</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = "/tasks"}
              className="text-zinc-400 hover:text-white"
            >
              <RefreshCw className="mr-1 h-4 w-4" /> View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {tasks
              .filter((task: Task) => !todaysTasks.includes(task))
              .slice(0, 3)
              .map((task: Task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                />
              ))}
          </div>
        </div>
      )}
      
      {/* Task Dialog */}
      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        editTask={editTask}
      />
    </div>
  );
}
