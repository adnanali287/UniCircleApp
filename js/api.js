import { supabase } from './supabase.js';

// Authentication API calls
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw new Error(error.message);
  return data.user;
}

export async function register(name, email, password) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (authError) throw new Error(authError.message);

  // Create user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert([{ id: authData.user.id, name, email }]);

  if (profileError) throw new Error(profileError.message);
  
  return authData.user;
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) throw new Error('Failed to fetch profile');
  return data;
}

export async function updateProfile(profileData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('users')
    .update(profileData)
    .eq('id', user.id);
  
  if (error) throw new Error('Failed to update profile');
  return true;
}

// Posts API calls
export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users(name, image_url)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error('Failed to fetch posts');
  return data;
}

export async function createPost(postData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('posts')
    .insert([{
      author_id: user.id,
      text: postData.text,
      image_url: postData.image
    }]);
  
  if (error) throw new Error('Failed to create post');
  return true;
}

// Messages API calls
export async function getMessages(userId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
    .order('created_at', { ascending: true });
  
  if (error) throw new Error('Failed to fetch messages');
  return data;
}

export async function sendMessage(userId, message) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('messages')
    .insert([{
      from_id: user.id,
      to_id: userId,
      text: message
    }]);
  
  if (error) throw new Error('Failed to send message');
  return true;
}