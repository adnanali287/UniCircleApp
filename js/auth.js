import { supabase } from './supabase.js';

export function isAuthenticated() {
  return supabase.auth.getSession().then(({ data: { session } }) => !!session);
}

export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data.user;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
}

export async function register(name, email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    
    if (error) throw error;
    
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: data.user.id,
        name,
        email
      }]);
    
    if (profileError) throw profileError;
    return data.user;
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}