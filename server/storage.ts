import { 
  users, tasks, taskMembers, friends, achievements, userAchievements, activities,
  type User, type InsertUser, type Task, type InsertTask, 
  type TaskMember, type InsertTaskMember, type Friend, type InsertFriend,
  type Achievement, type InsertAchievement, type UserAchievement, 
  type InsertUserAchievement, type Activity, type InsertActivity
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  getUserTasks(userId: number): Promise<Task[]>;
  getGroupTasks(userId: number): Promise<Task[]>;
  completeTask(id: number, userId: number): Promise<Task | undefined>;
  updateTaskProgress(id: number, progress: number): Promise<Task | undefined>;
  updateTask(id: number, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Task members
  addTaskMember(taskMember: InsertTaskMember): Promise<TaskMember>;
  getTaskMembers(taskId: number): Promise<TaskMember[]>;
  completeTaskMember(taskId: number, userId: number): Promise<TaskMember | undefined>;
  
  // Friends
  addFriend(friend: InsertFriend): Promise<Friend>;
  getFriendRequests(userId: number): Promise<Friend[]>;
  getFriends(userId: number): Promise<Friend[]>;
  updateFriendStatus(id: number, status: string): Promise<Friend | undefined>;
  
  // Achievements
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<{achievement: Achievement, achieved_at: Date}[]>;
  addUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  
  // Activities
  createActivity(activity: InsertActivity): Promise<Activity>;
  getUserActivities(userId: number): Promise<Activity[]>;
  getFriendsActivities(userId: number): Promise<Activity[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private taskMembers: Map<number, TaskMember>;
  private friends: Map<number, Friend>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private activities: Map<number, Activity>;
  
  private userId: number;
  private taskId: number;
  private taskMemberId: number;
  private friendId: number;
  private achievementId: number;
  private userAchievementId: number;
  private activityId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.taskMembers = new Map();
    this.friends = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.activities = new Map();
    
    this.userId = 1;
    this.taskId = 1;
    this.taskMemberId = 1;
    this.friendId = 1;
    this.achievementId = 1;
    this.userAchievementId = 1;
    this.activityId = 1;
    
    // Initialize with some achievements
    this.createAchievement({
      name: "Weekly Warrior",
      description: "Complete tasks 7 days in a row",
      badge_url: "/api/badges/weekly-warrior",
      xp_reward: 150
    });
    
    this.createAchievement({
      name: "Early Bird",
      description: "Complete 5 tasks before 9am",
      badge_url: "/api/badges/early-bird",
      xp_reward: 100
    });
    
    this.createAchievement({
      name: "Team Player",
      description: "Complete 10 group tasks",
      badge_url: "/api/badges/team-player",
      xp_reward: 200
    });
    
    this.createAchievement({
      name: "Perfect Week",
      description: "Complete all scheduled tasks in a week",
      badge_url: "/api/badges/perfect-week",
      xp_reward: 250
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = {
      id,
      username: userData.username,
      password: userData.password,
      email: userData.email,
      avatar_url: userData.avatar_url || null,
      level: 1,
      xp: 0,
      streak: 0,
      tasks_completed: 0,
      created_at: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Task operations
  async createTask(taskData: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const now = new Date();
    const task: Task = {
      id,
      title: taskData.title,
      description: taskData.description || null,
      due_date: taskData.due_date || null,
      xp_reward: taskData.xp_reward || 10,
      is_completed: false,
      completion_date: null,
      progress: 0,
      is_group_task: taskData.is_group_task || false,
      owner_id: taskData.owner_id,
      created_at: now
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getUserTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.owner_id === userId && !task.is_group_task
    );
  }
  
  async getGroupTasks(userId: number): Promise<Task[]> {
    // Get tasks owned by user that are group tasks
    const ownedGroupTasks = Array.from(this.tasks.values()).filter(
      (task) => task.owner_id === userId && task.is_group_task
    );
    
    // Get tasks where user is a member
    const taskMemberIds = Array.from(this.taskMembers.values())
      .filter(member => member.user_id === userId)
      .map(member => member.task_id);
    
    const memberGroupTasks = Array.from(this.tasks.values()).filter(
      (task) => taskMemberIds.includes(task.id) && task.is_group_task
    );
    
    // Combine both lists
    return [...ownedGroupTasks, ...memberGroupTasks];
  }
  
  async completeTask(id: number, userId: number): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    // Check if user is owner or member
    if (task.owner_id !== userId) {
      const isMember = Array.from(this.taskMembers.values()).some(
        member => member.task_id === id && member.user_id === userId
      );
      if (!isMember) return undefined;
    }
    
    const now = new Date();
    const updatedTask = { 
      ...task, 
      is_completed: true, 
      completion_date: now,
      progress: 100
    };
    this.tasks.set(id, updatedTask);
    
    // Update user stats
    const user = await this.getUser(userId);
    if (user) {
      const updatedUser = { 
        ...user,
        tasks_completed: user.tasks_completed + 1,
        xp: user.xp + task.xp_reward
      };
      
      // Check if level up is needed (100 XP per level)
      const newLevel = Math.floor(updatedUser.xp / 100) + 1;
      if (newLevel > user.level) {
        updatedUser.level = newLevel;
        
        // Create level up activity
        this.createActivity({
          user_id: userId,
          activity_type: 'level_up',
          activity_data: { new_level: newLevel }
        });
      }
      
      this.users.set(userId, updatedUser);
      
      // Create task completion activity
      this.createActivity({
        user_id: userId,
        activity_type: 'task_completed',
        activity_data: { 
          task_id: id,
          task_title: task.title,
          xp_earned: task.xp_reward
        }
      });
      
      // Check for streak (simplified)
      // In a real implementation, you'd check if there's a task completed each day
      if (user.streak > 0 || user.tasks_completed === 0) {
        const updatedUserWithStreak = {
          ...updatedUser,
          streak: updatedUser.streak + 1
        };
        this.users.set(userId, updatedUserWithStreak);
        
        // Check for streak achievements
        if (updatedUserWithStreak.streak === 7) {
          const weeklyWarrior = Array.from(this.achievements.values()).find(
            a => a.name === "Weekly Warrior"
          );
          
          if (weeklyWarrior) {
            this.addUserAchievement({
              user_id: userId,
              achievement_id: weeklyWarrior.id
            });
            
            // Update XP for achievement
            const userWithAchievement = {
              ...updatedUserWithStreak,
              xp: updatedUserWithStreak.xp + weeklyWarrior.xp_reward
            };
            this.users.set(userId, userWithAchievement);
            
            // Create achievement activity
            this.createActivity({
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
      }
    }
    
    return updatedTask;
  }
  
  async updateTaskProgress(id: number, progress: number): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, progress: Math.min(100, Math.max(0, progress)) };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...data };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Task members
  async addTaskMember(taskMemberData: InsertTaskMember): Promise<TaskMember> {
    const id = this.taskMemberId++;
    const now = new Date();
    const taskMember: TaskMember = {
      id,
      task_id: taskMemberData.task_id,
      user_id: taskMemberData.user_id,
      is_completed: false,
      created_at: now
    };
    this.taskMembers.set(id, taskMember);
    return taskMember;
  }
  
  async getTaskMembers(taskId: number): Promise<TaskMember[]> {
    return Array.from(this.taskMembers.values()).filter(
      member => member.task_id === taskId
    );
  }
  
  async completeTaskMember(taskId: number, userId: number): Promise<TaskMember | undefined> {
    const taskMember = Array.from(this.taskMembers.values()).find(
      member => member.task_id === taskId && member.user_id === userId
    );
    
    if (!taskMember) return undefined;
    
    const updatedMember = { ...taskMember, is_completed: true };
    this.taskMembers.set(taskMember.id, updatedMember);
    
    // Check if all members have completed
    const allMembers = await this.getTaskMembers(taskId);
    const allCompleted = allMembers.every(member => member.is_completed);
    
    if (allCompleted) {
      const task = await this.getTask(taskId);
      if (task) {
        const now = new Date();
        const updatedTask = { 
          ...task, 
          is_completed: true, 
          completion_date: now,
          progress: 100
        };
        this.tasks.set(taskId, updatedTask);
        
        // Update owner stats
        const owner = await this.getUser(task.owner_id);
        if (owner) {
          this.users.set(owner.id, {
            ...owner,
            tasks_completed: owner.tasks_completed + 1,
            xp: owner.xp + task.xp_reward
          });
        }
      }
    }
    
    return updatedMember;
  }
  
  // Friends
  async addFriend(friendData: InsertFriend): Promise<Friend> {
    const id = this.friendId++;
    const now = new Date();
    const friend: Friend = {
      id,
      user_id: friendData.user_id,
      friend_id: friendData.friend_id,
      status: friendData.status,
      created_at: now
    };
    this.friends.set(id, friend);
    return friend;
  }
  
  async getFriendRequests(userId: number): Promise<Friend[]> {
    return Array.from(this.friends.values()).filter(
      friend => friend.friend_id === userId && friend.status === 'pending'
    );
  }
  
  async getFriends(userId: number): Promise<Friend[]> {
    const sentRequests = Array.from(this.friends.values()).filter(
      friend => friend.user_id === userId && friend.status === 'accepted'
    );
    
    const receivedRequests = Array.from(this.friends.values()).filter(
      friend => friend.friend_id === userId && friend.status === 'accepted'
    );
    
    return [...sentRequests, ...receivedRequests];
  }
  
  async updateFriendStatus(id: number, status: string): Promise<Friend | undefined> {
    const friend = this.friends.get(id);
    if (!friend) return undefined;
    
    const updatedFriend = { ...friend, status };
    this.friends.set(id, updatedFriend);
    return updatedFriend;
  }
  
  // Achievements
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const id = this.achievementId++;
    const achievement: Achievement = {
      id,
      name: achievementData.name,
      description: achievementData.description,
      badge_url: achievementData.badge_url || null,
      xp_reward: achievementData.xp_reward || 50
    };
    this.achievements.set(id, achievement);
    return achievement;
  }
  
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  async getUserAchievements(userId: number): Promise<{achievement: Achievement, achieved_at: Date}[]> {
    const userAchievements = Array.from(this.userAchievements.values()).filter(
      ua => ua.user_id === userId
    );
    
    return userAchievements.map(ua => {
      const achievement = this.achievements.get(ua.achievement_id);
      return {
        achievement: achievement!,
        achieved_at: ua.achieved_at
      };
    }).filter(item => item.achievement !== undefined) as {achievement: Achievement, achieved_at: Date}[];
  }
  
  async addUserAchievement(userAchievementData: InsertUserAchievement): Promise<UserAchievement> {
    const id = this.userAchievementId++;
    const now = new Date();
    const userAchievement: UserAchievement = {
      id,
      user_id: userAchievementData.user_id,
      achievement_id: userAchievementData.achievement_id,
      achieved_at: now
    };
    this.userAchievements.set(id, userAchievement);
    return userAchievement;
  }
  
  // Activities
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const activity: Activity = {
      id,
      user_id: activityData.user_id,
      activity_type: activityData.activity_type,
      activity_data: activityData.activity_data || null,
      created_at: now
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  async getUserActivities(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }
  
  async getFriendsActivities(userId: number): Promise<Activity[]> {
    // Get all friends
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(friend => 
      friend.user_id === userId ? friend.friend_id : friend.user_id
    );
    
    // Get activities for all friends
    return Array.from(this.activities.values())
      .filter(activity => friendIds.includes(activity.user_id))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }
}

// Export MemStorage for reference
export const memStorage = new MemStorage();

// Import and export SupabaseStorage
import { SupabaseStorage } from "./supabase-storage";
export const storage = new SupabaseStorage();
