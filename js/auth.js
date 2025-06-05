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
    // First, sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError) throw signUpError;
    
    if (!authData.user) {
      throw new Error('Registration failed - no user data returned');
    }

    // Then create their profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        name,
        email,
        bio: '',
        image_url: ''
      }]);
    
    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.signOut();
      throw new Error('Failed to create user profile');
    }

    return authData.user;
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = '/login.html';
}