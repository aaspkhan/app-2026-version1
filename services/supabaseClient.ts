import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

const SUPABASE_URL = 'https://fqhkdkkspwqqcveqrfhq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rt6mluu6Hgq6vPrgbQOwRw_4paRe66u';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface HealthLog {
  id?: number;
  created_at?: string;
  user_id?: string;
  metric_type: 'RHR' | 'GLUCOSE' | 'HRV';
  value: number;
}

// --- Auth Functions ---

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password });
};

export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// --- Data Functions ---

export const saveUserProfile = async (profile: UserProfile) => {
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, // Matches auth.users.id
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      waist: profile.waist,
      updated_at: new Date()
    });

  if (error) console.error("Error saving profile:", error);
  return error;
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('age, weight, height, waist')
    .eq('id', user.id)
    .single();

  if (error) {
    console.warn("No profile found or error fetching:", error.message);
    return null;
  }
  return data as UserProfile;
};

export const logHealthMetric = async (type: 'RHR' | 'GLUCOSE' | 'HRV', value: number) => {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    const { error } = await supabase
      .from('health_logs')
      .insert([{ 
        user_id: user.id,
        metric_type: type, 
        value 
      }]);
    
    if (error) throw error;
  } catch (err) {
    console.error("Error logging to Supabase:", err);
  }
};

export const getHealthHistory = async (type: 'RHR' | 'GLUCOSE' | 'HRV', limit = 30) => {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', user.id) // Filter by current user
      .eq('metric_type', type)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching history:", err);
    return [];
  }
};