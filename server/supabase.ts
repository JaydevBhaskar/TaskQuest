import { createClient } from '@supabase/supabase-js';
import { User, Task, TaskMember, Friend, Achievement, UserAchievement, Activity } from '../shared/schema';
import dotenv from "dotenv";

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function initializeDatabase() {
  console.log('Initializing Supabase with URL:', supabaseUrl);
  
  // Check if tables exist, if not create them
  const { error: usersError } = await supabase
    .from('users')
    .select('id')
    .limit(1);
  
  if (usersError) {
    console.log('Creating tables... Error:', usersError);
    await createTables();
  } else {
    console.log('Database tables exist, checking connection...');
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) {
      console.error('Database connection error:', error);
    } else {
      console.log('Database connected successfully');
    }
  }
}

async function createTables() {
  // Create users table
  await supabase.rpc('create_users_table');
  
  // Create tasks table
  await supabase.rpc('create_tasks_table');
  
  // Create task_members table
  await supabase.rpc('create_task_members_table');
  
  // Create friends table
  await supabase.rpc('create_friends_table');
  
  // Create achievements table
  await supabase.rpc('create_achievements_table');
  
  // Create user_achievements table
  await supabase.rpc('create_user_achievements_table');
  
  // Create activities table
  await supabase.rpc('create_activities_table');
}