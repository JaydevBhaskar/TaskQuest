import { 
  User, InsertUser, Task, InsertTask, 
  TaskMember, InsertTaskMember, Friend, InsertFriend,
  Achievement, InsertAchievement, UserAchievement, 
  InsertUserAchievement, Activity, InsertActivity
} from "@shared/schema";
import { IStorage } from "./storage";
import { supabase } from "./supabase";

export class SupabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
    
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
      if (error && error.code !== 'PGRST116') {
      console.error("Error fetching user by username:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data as User;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .single();
    
    if (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
    
    return data as User;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const now = new Date();
    const newUser = {
      ...userData,
      level: 1,
      xp: 0,
      streak: 0,
      tasks_completed: 0,
      created_at: now
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating user:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    return data as User;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
    
    return updatedUser as User;
  }
  
  // Task operations
  async createTask(taskData: InsertTask): Promise<Task> {
    const now = new Date();
    const newTask = {
      ...taskData,
      is_completed: false,
      completion_date: null,
      progress: 0,
      created_at: now
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating task:", error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
    
    return data as Task;
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching task:", error);
      return undefined;
    }
    
    return data as Task;
  }
  
  async getUserTasks(userId: number): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_group_task', false);
    
    if (error) {
      console.error("Error fetching user tasks:", error);
      return [];
    }
    
    return data as Task[];
  }
  
  async getGroupTasks(userId: number): Promise<Task[]> {
    // Get tasks owned by user that are group tasks
    const { data: ownedTasks, error: ownedError } = await supabase
      .from('tasks')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_group_task', true);
    
    if (ownedError) {
      console.error("Error fetching owned group tasks:", ownedError);
      return [];
    }
    
    // Get tasks where user is a member
    const { data: taskMembers, error: membersError } = await supabase
      .from('task_members')
      .select('task_id')
      .eq('user_id', userId);
    
    if (membersError) {
      console.error("Error fetching task members:", membersError);
      return ownedTasks as Task[];
    }
    
    if (taskMembers.length === 0) {
      return ownedTasks as Task[];
    }
    
    const taskIds = taskMembers.map(m => m.task_id);
    
    const { data: memberTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('id', taskIds)
      .eq('is_group_task', true);
    
    if (tasksError) {
      console.error("Error fetching member tasks:", tasksError);
      return ownedTasks as Task[];
    }
    
    // Combine both lists, avoiding duplicates
    const allTasks = [...ownedTasks as Task[]];
    const ownedIds = ownedTasks.map(t => t.id);
    
    for (const task of memberTasks) {
      if (!ownedIds.includes(task.id)) {
        allTasks.push(task as Task);
      }
    }
    
    return allTasks;
  }
  
  async completeTask(id: number, userId: number): Promise<Task | undefined> {
    // First check if the task exists and user is owner or member
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (taskError || !task) {
      console.error("Error fetching task:", taskError);
      return undefined;
    }
    
    // Check if user is owner or member
    if (task.owner_id !== userId) {
      const { data: membership, error: memberError } = await supabase
        .from('task_members')
        .select('*')
        .eq('task_id', id)
        .eq('user_id', userId)
        .single();
      
      if (memberError || !membership) {
        console.error("User is not a member of this task:", memberError);
        return undefined;
      }
    }
    
    const now = new Date();
    
    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        is_completed: true,
        completion_date: now,
        progress: 100
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating task:", updateError);
      return undefined;
    }
    
    // Update user stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return updatedTask as Task;
    }
    
    // Update user XP and tasks completed
    const newXp = user.xp + task.xp_reward;
    const newTasksCompleted = user.tasks_completed + 1;
    let newLevel = user.level;
    const newStreak = user.streak + 1;
    
    // Check if level up is needed (100 XP per level)
    if (Math.floor(newXp / 100) + 1 > user.level) {
      newLevel = Math.floor(newXp / 100) + 1;
      
      // Create level up activity
      await this.createActivity({
        user_id: userId,
        activity_type: 'level_up',
        activity_data: { new_level: newLevel }
      });
    }
    
    // Update user
    await supabase
      .from('users')
      .update({
        xp: newXp,
        tasks_completed: newTasksCompleted,
        level: newLevel,
        streak: newStreak
      })
      .eq('id', userId);
    
    // Create task completion activity
    await this.createActivity({
      user_id: userId,
      activity_type: 'task_completed',
      activity_data: { 
        task_id: id,
        task_title: task.title,
        xp_earned: task.xp_reward
      }
    });
    
    // Check for streak achievements (weekly warrior at 7 days)
    if (newStreak === 7) {
      const { data: weeklyWarrior, error: achievementError } = await supabase
        .from('achievements')
        .select('*')
        .eq('name', 'Weekly Warrior')
        .single();
      
      if (!achievementError && weeklyWarrior) {
        // Add user achievement
        await this.addUserAchievement({
          user_id: userId,
          achievement_id: weeklyWarrior.id
        });
        
        // Update XP for achievement
        await supabase
          .from('users')
          .update({
            xp: newXp + weeklyWarrior.xp_reward
          })
          .eq('id', userId);
        
        // Create achievement activity
        await this.createActivity({
          user_id: userId,
          activity_type: 'achievement_earned',
          activity_data: { 
            achievement_id: weeklyWarrior.id,
            achievement_name: weeklyWarrior.name,
            xp_earned: weeklyWarrior.xp_reward
          }
        });
      }
    }
    
    return updatedTask as Task;
  }
  
  async updateTaskProgress(id: number, progress: number): Promise<Task | undefined> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        progress: Math.min(100, Math.max(0, progress))
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating task progress:", error);
      return undefined;
    }
    
    return data as Task;
  }
  
  async updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating task:", error);
      return undefined;
    }
    
    return updatedTask as Task;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting task:", error);
      return false;
    }
    
    return true;
  }
  
  // Task members
  async addTaskMember(taskMemberData: InsertTaskMember): Promise<TaskMember> {
    const now = new Date();
    const newMember = {
      ...taskMemberData,
      is_completed: false,
      created_at: now
    };
    
    const { data, error } = await supabase
      .from('task_members')
      .insert(newMember)
      .select()
      .single();
    
    if (error) {
      console.error("Error adding task member:", error);
      throw new Error(`Failed to add task member: ${error.message}`);
    }
    
    return data as TaskMember;
  }
  
  async getTaskMembers(taskId: number): Promise<TaskMember[]> {
    const { data, error } = await supabase
      .from('task_members')
      .select('*')
      .eq('task_id', taskId);
    
    if (error) {
      console.error("Error fetching task members:", error);
      return [];
    }
    
    return data as TaskMember[];
  }
  
  async completeTaskMember(taskId: number, userId: number): Promise<TaskMember | undefined> {
    // Find the task member
    const { data: member, error: memberError } = await supabase
      .from('task_members')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .single();
    
    if (memberError || !member) {
      console.error("Error finding task member:", memberError);
      return undefined;
    }
    
    // Update the member status
    const { data: updatedMember, error: updateError } = await supabase
      .from('task_members')
      .update({ is_completed: true })
      .eq('id', member.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating task member:", updateError);
      return undefined;
    }
    
    // Check if all members have completed
    const { data: allMembers, error: allMembersError } = await supabase
      .from('task_members')
      .select('*')
      .eq('task_id', taskId);
    
    if (allMembersError) {
      console.error("Error fetching all task members:", allMembersError);
      return updatedMember as TaskMember;
    }
    
    const allCompleted = allMembers.every(m => m.is_completed);
    
    if (allCompleted) {
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (taskError || !task) {
        console.error("Error fetching task:", taskError);
        return updatedMember as TaskMember;
      }
      
      const now = new Date();
      
      // Update the task
      await supabase
        .from('tasks')
        .update({
          is_completed: true,
          completion_date: now,
          progress: 100
        })
        .eq('id', taskId);
      
      // Update owner stats
      const { data: owner, error: ownerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', task.owner_id)
        .single();
      
      if (!ownerError && owner) {
        await supabase
          .from('users')
          .update({
            tasks_completed: owner.tasks_completed + 1,
            xp: owner.xp + task.xp_reward
          })
          .eq('id', task.owner_id);
      }
    }
    
    return updatedMember as TaskMember;
  }
  
  // Friends
  async addFriend(friendData: InsertFriend): Promise<Friend> {
    const now = new Date();
    const newFriend = {
      ...friendData,
      created_at: now
    };
    
    const { data, error } = await supabase
      .from('friends')
      .insert(newFriend)
      .select()
      .single();
    
    if (error) {
      console.error("Error adding friend:", error);
      throw new Error(`Failed to add friend: ${error.message}`);
    }
    
    return data as Friend;
  }
  
  async getFriendRequests(userId: number): Promise<Friend[]> {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    if (error) {
      console.error("Error fetching friend requests:", error);
      return [];
    }
    
    return data as Friend[];
  }
  
  async getFriends(userId: number): Promise<Friend[]> {
    // Get sent requests
    const { data: sent, error: sentError } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'accepted');
    
    if (sentError) {
      console.error("Error fetching sent friend requests:", sentError);
      return [];
    }
    
    // Get received requests
    const { data: received, error: receivedError } = await supabase
      .from('friends')
      .select('*')
      .eq('friend_id', userId)
      .eq('status', 'accepted');
    
    if (receivedError) {
      console.error("Error fetching received friend requests:", receivedError);
      return sent as Friend[];
    }
    
    return [...sent, ...received] as Friend[];
  }
  
  async updateFriendStatus(id: number, status: string): Promise<Friend | undefined> {
    const { data, error } = await supabase
      .from('friends')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating friend status:", error);
      return undefined;
    }
    
    return data as Friend;
  }
  
  // Achievements
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievementData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating achievement:", error);
      throw new Error(`Failed to create achievement: ${error.message}`);
    }
    
    return data as Achievement;
  }
  
  async getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*');
    
    if (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }
    
    return data as Achievement[];
  }
  
  async getUserAchievements(userId: number): Promise<{achievement: Achievement, achieved_at: Date}[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error fetching user achievements:", error);
      return [];
    }
    
    return data.map(ua => ({
      achievement: ua.achievement as Achievement,
      achieved_at: new Date(ua.achieved_at)
    }));
  }
  
  async addUserAchievement(userAchievementData: InsertUserAchievement): Promise<UserAchievement> {
    const now = new Date();
    const newUserAchievement = {
      ...userAchievementData,
      achieved_at: now
    };
    
    const { data, error } = await supabase
      .from('user_achievements')
      .insert(newUserAchievement)
      .select()
      .single();
    
    if (error) {
      console.error("Error adding user achievement:", error);
      throw new Error(`Failed to add user achievement: ${error.message}`);
    }
    
    return data as UserAchievement;
  }
  
  // Activities
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const now = new Date();
    const newActivity = {
      ...activityData,
      created_at: now
    };
    
    const { data, error } = await supabase
      .from('activities')
      .insert(newActivity)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating activity:", error);
      throw new Error(`Failed to create activity: ${error.message}`);
    }
    
    return data as Activity;
  }
  
  async getUserActivities(userId: number): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user activities:", error);
      return [];
    }
    
    return data as Activity[];
  }
  
  async getFriendsActivities(userId: number): Promise<Activity[]> {
    // Get all friends
    const friends = await this.getFriends(userId);
    
    if (friends.length === 0) {
      return [];
    }
    
    const friendIds = friends.map(friend => 
      friend.user_id === userId ? friend.friend_id : friend.user_id
    );
    
    // Get activities for all friends
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching friend activities:", error);
      return [];
    }
    
    return data as Activity[];
  }
}