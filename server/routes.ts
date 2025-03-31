import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertTaskSchema, insertTaskMemberSchema, 
  insertFriendSchema, insertActivitySchema 
} from "@shared/schema";
import { ZodError } from "zod";
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { z } from "zod";
import MemoryStore from 'memorystore';

// Utility function to handle zod errors
function formatZodError(error: ZodError) {
  return error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Configure session
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'taskforge-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Configure passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      
      // In a real app, you'd use bcrypt to compare hashed passwords
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Authentication required' });
  };
  
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      const user = await storage.createUser(userData);
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: formatZodError(error) 
        });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    // Exclude password from response
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/user', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    // Exclude password from response
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
  
  // User routes
  app.get('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.patch('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      // Only allow users to update their own profiles
      if (currentUser.id !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updateData = req.body;
      
      // Don't allow updating critical fields
      delete updateData.id;
      delete updateData.password;
      delete updateData.created_at;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Task routes
  app.post('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const taskData = insertTaskSchema.parse({
        ...req.body,
        owner_id: user.id
      });
      
      const task = await storage.createTask(taskData);
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: formatZodError(error) 
        });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/tasks/user', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const tasks = await storage.getUserTasks(user.id);
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/tasks/group', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const tasks = await storage.getGroupTasks(user.id);
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.patch('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = req.user as any;
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user is the owner
      if (task.owner_id !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updateData = req.body;
      
      // Don't allow updating critical fields
      delete updateData.id;
      delete updateData.owner_id;
      delete updateData.created_at;
      
      const updatedTask = await storage.updateTask(taskId, updateData);
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = req.user as any;
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user is the owner
      if (task.owner_id !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      await storage.deleteTask(taskId);
      
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/tasks/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = req.user as any;
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      const updatedTask = await storage.completeTask(taskId, user.id);
      
      if (!updatedTask) {
        return res.status(403).json({ message: 'Not authorized to complete this task' });
      }
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/tasks/:id/progress', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = req.user as any;
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user is the owner or a member
      if (task.owner_id !== user.id) {
        const isMember = (await storage.getTaskMembers(taskId))
          .some(member => member.user_id === user.id);
        
        if (!isMember) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      }
      
      const progressSchema = z.object({
        progress: z.number().min(0).max(100)
      });
      
      const { progress } = progressSchema.parse(req.body);
      
      const updatedTask = await storage.updateTaskProgress(taskId, progress);
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: formatZodError(error) 
        });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Task Members routes
  app.post('/api/tasks/:id/members', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = req.user as any;
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user is the owner
      if (task.owner_id !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const memberSchema = z.object({
        user_id: z.number()
      });
      
      const { user_id } = memberSchema.parse(req.body);
      
      // Check if user exists
      const memberUser = await storage.getUser(user_id);
      if (!memberUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if already a member
      const members = await storage.getTaskMembers(taskId);
      if (members.some(member => member.user_id === user_id)) {
        return res.status(400).json({ message: 'User is already a member of this task' });
      }
      
      const taskMember = await storage.addTaskMember({
        task_id: taskId,
        user_id: user_id
      });
      
      res.status(201).json(taskMember);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: formatZodError(error) 
        });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/tasks/:id/members', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      const members = await storage.getTaskMembers(taskId);
      
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Friends routes
  app.post('/api/friends/request', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const friendSchema = z.object({
        friend_id: z.number()
      });
      
      const { friend_id } = friendSchema.parse(req.body);
      
      // Can't add yourself
      if (user.id === friend_id) {
        return res.status(400).json({ message: 'Cannot add yourself as a friend' });
      }
      
      // Check if friend exists
      const friendUser = await storage.getUser(friend_id);
      if (!friendUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if already friends or request pending
      const friends = await storage.getFriends(user.id);
      if (friends.some(f => 
        (f.user_id === friend_id && f.friend_id === user.id) || 
        (f.user_id === user.id && f.friend_id === friend_id)
      )) {
        return res.status(400).json({ message: 'Already friends' });
      }
      
      const pendingRequests = await storage.getFriendRequests(friend_id);
      if (pendingRequests.some(f => f.user_id === user.id)) {
        return res.status(400).json({ message: 'Friend request already sent' });
      }
      
      const friend = await storage.addFriend({
        user_id: user.id,
        friend_id: friend_id,
        status: 'pending'
      });
      
      res.status(201).json(friend);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: formatZodError(error) 
        });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/friends', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const friends = await storage.getFriends(user.id);
      
      // Get friend user details
      const friendDetails = await Promise.all(friends.map(async (friend) => {
        const friendId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
        const friendUser = await storage.getUser(friendId);
        
        if (!friendUser) return null;
        
        // Exclude password
        const { password, ...friendWithoutPassword } = friendUser;
        
        return {
          ...friend,
          friend: friendWithoutPassword
        };
      }));
      
      // Filter out nulls (in case a user was deleted)
      const validFriends = friendDetails.filter(f => f !== null);
      
      res.json(validFriends);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/friends/requests', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const requests = await storage.getFriendRequests(user.id);
      
      // Get requester user details
      const requestDetails = await Promise.all(requests.map(async (request) => {
        const requester = await storage.getUser(request.user_id);
        
        if (!requester) return null;
        
        // Exclude password
        const { password, ...requesterWithoutPassword } = requester;
        
        return {
          ...request,
          requester: requesterWithoutPassword
        };
      }));
      
      // Filter out nulls (in case a user was deleted)
      const validRequests = requestDetails.filter(r => r !== null);
      
      res.json(validRequests);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/friends/requests/:id/accept', isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const user = req.user as any;
      
      const request = await storage.friends.get(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Friend request not found' });
      }
      
      // Check if user is the recipient
      if (request.friend_id !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Check if already accepted or rejected
      if (request.status !== 'pending') {
        return res.status(400).json({ message: `Request already ${request.status}` });
      }
      
      const updatedRequest = await storage.updateFriendStatus(requestId, 'accepted');
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/friends/requests/:id/reject', isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const user = req.user as any;
      
      const request = await storage.friends.get(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Friend request not found' });
      }
      
      // Check if user is the recipient
      if (request.friend_id !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Check if already accepted or rejected
      if (request.status !== 'pending') {
        return res.status(400).json({ message: `Request already ${request.status}` });
      }
      
      const updatedRequest = await storage.updateFriendStatus(requestId, 'rejected');
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Achievements routes
  app.get('/api/achievements', isAuthenticated, async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/users/:id/achievements', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Activities routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const activities = await storage.getUserActivities(user.id);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/activities/friends', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const activities = await storage.getFriendsActivities(user.id);
      
      // Enrich with user details
      const enrichedActivities = await Promise.all(activities.map(async (activity) => {
        const activityUser = await storage.getUser(activity.user_id);
        
        if (!activityUser) return null;
        
        // Exclude password
        const { password, ...userWithoutPassword } = activityUser;
        
        return {
          ...activity,
          user: userWithoutPassword
        };
      }));
      
      // Filter out nulls
      const validActivities = enrichedActivities.filter(a => a !== null);
      
      res.json(validActivities);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Leaderboard route
  app.get('/api/leaderboard', isAuthenticated, async (req, res) => {
    try {
      // Get all users sorted by XP
      const allUsers = Array.from(storage.users.values());
      
      // Sort by XP (descending)
      const leaderboard = allUsers
        .sort((a, b) => b.xp - a.xp)
        .map(user => {
          // Exclude password and other sensitive data
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
      
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return httpServer;
}
