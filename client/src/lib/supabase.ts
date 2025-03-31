// This is a placeholder for future Supabase integration.
// Currently, we're using in-memory storage as per the guidelines,
// but the code will be structured to make migration to Supabase easy.

import { User, Task, Friend } from "@shared/schema";
import { apiRequest } from "./queryClient";

// User related functions
export const getUser = async (id: number): Promise<User> => {
  const res = await apiRequest('GET', `/api/users/${id}`);
  return res.json();
};

export const getCurrentUser = async (): Promise<User> => {
  const res = await apiRequest('GET', '/api/auth/user');
  return res.json();
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const res = await apiRequest('PATCH', `/api/users/${id}`, userData);
  return res.json();
};

// Authentication functions
export const register = async (userData: any): Promise<User> => {
  const res = await apiRequest('POST', '/api/auth/register', userData);
  return res.json();
};

export const login = async (credentials: { username: string, password: string }): Promise<User> => {
  const res = await apiRequest('POST', '/api/auth/login', credentials);
  return res.json();
};

export const logout = async (): Promise<void> => {
  await apiRequest('POST', '/api/auth/logout');
};

// Task related functions
export const getTasks = async (): Promise<Task[]> => {
  const res = await apiRequest('GET', '/api/tasks/user');
  return res.json();
};

export const getGroupTasks = async (): Promise<Task[]> => {
  const res = await apiRequest('GET', '/api/tasks/group');
  return res.json();
};

export const createTask = async (taskData: any): Promise<Task> => {
  const res = await apiRequest('POST', '/api/tasks', taskData);
  return res.json();
};

export const updateTask = async (id: number, taskData: any): Promise<Task> => {
  const res = await apiRequest('PATCH', `/api/tasks/${id}`, taskData);
  return res.json();
};

export const deleteTask = async (id: number): Promise<void> => {
  await apiRequest('DELETE', `/api/tasks/${id}`);
};

export const completeTask = async (id: number): Promise<Task> => {
  const res = await apiRequest('POST', `/api/tasks/${id}/complete`);
  return res.json();
};

export const updateTaskProgress = async (id: number, progress: number): Promise<Task> => {
  const res = await apiRequest('POST', `/api/tasks/${id}/progress`, { progress });
  return res.json();
};

// Friend related functions
export const getFriends = async (): Promise<Friend[]> => {
  const res = await apiRequest('GET', '/api/friends');
  return res.json();
};

export const getFriendRequests = async (): Promise<any[]> => {
  const res = await apiRequest('GET', '/api/friends/requests');
  return res.json();
};

export const sendFriendRequest = async (friendId: number): Promise<Friend> => {
  const res = await apiRequest('POST', '/api/friends/request', { friend_id: friendId });
  return res.json();
};

export const acceptFriendRequest = async (requestId: number): Promise<Friend> => {
  const res = await apiRequest('POST', `/api/friends/requests/${requestId}/accept`);
  return res.json();
};

export const rejectFriendRequest = async (requestId: number): Promise<Friend> => {
  const res = await apiRequest('POST', `/api/friends/requests/${requestId}/reject`);
  return res.json();
};

// Achievement related functions
export const getAchievements = async (): Promise<any[]> => {
  const res = await apiRequest('GET', '/api/achievements');
  return res.json();
};

export const getUserAchievements = async (userId: number): Promise<any[]> => {
  const res = await apiRequest('GET', `/api/users/${userId}/achievements`);
  return res.json();
};

// Activity related functions
export const getActivities = async (): Promise<any[]> => {
  const res = await apiRequest('GET', '/api/activities');
  return res.json();
};

export const getFriendsActivities = async (): Promise<any[]> => {
  const res = await apiRequest('GET', '/api/activities/friends');
  return res.json();
};

// Leaderboard related functions
export const getLeaderboard = async (): Promise<User[]> => {
  const res = await apiRequest('GET', '/api/leaderboard');
  return res.json();
};
