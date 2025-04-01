import { pgTable, text, serial, integer, boolean, timestamp, jsonb, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  avatar_url: text("avatar_url"),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  tasks_completed: integer("tasks_completed").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  due_date: timestamp("due_date"),
  xp_reward: integer("xp_reward").default(10).notNull(),
  is_completed: boolean("is_completed").default(false).notNull(),
  completion_date: timestamp("completion_date"),
  progress: integer("progress").default(0).notNull(),
  is_group_task: boolean("is_group_task").default(false).notNull(),
  owner_id: integer("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Group tasks members
export const taskMembers = pgTable("task_members", {
  id: serial("id").primaryKey(),
  task_id: integer("task_id").notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  is_completed: boolean("is_completed").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Friends relationship
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  friend_id: integer("friend_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text("status").notNull(), // 'pending', 'accepted', 'rejected'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  badge_url: text("badge_url"),
  xp_reward: integer("xp_reward").default(50).notNull(),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievement_id: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  achieved_at: timestamp("achieved_at").defaultNow().notNull(),
});

// Activities for feed
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  activity_type: text("activity_type").notNull(), // 'task_completed', 'achievement_earned', 'level_up', etc.
  activity_data: jsonb("activity_data"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    avatar_url: true,
  })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email format"),
  });

export const insertTaskSchema = createInsertSchema(tasks)
  .pick({
    title: true,
    description: true,
    due_date: true,
    xp_reward: true,
    is_group_task: true,
    owner_id: true,
  })
  .extend({
    due_date: z.string().datetime().nullable().optional().transform(val => val ? new Date(val) : null),
  });

export const insertTaskMemberSchema = createInsertSchema(taskMembers)
  .pick({
    task_id: true,
    user_id: true,
  });

export const insertFriendSchema = createInsertSchema(friends)
  .pick({
    user_id: true,
    friend_id: true,
    status: true,
  });

export const insertAchievementSchema = createInsertSchema(achievements)
  .pick({
    name: true,
    description: true,
    badge_url: true,
    xp_reward: true,
  });

export const insertUserAchievementSchema = createInsertSchema(userAchievements)
  .pick({
    user_id: true,
    achievement_id: true,
  });

export const insertActivitySchema = createInsertSchema(activities)
  .pick({
    user_id: true,
    activity_type: true,
    activity_data: true,
  });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskMember = z.infer<typeof insertTaskMemberSchema>;
export type TaskMember = typeof taskMembers.$inferSelect;

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
