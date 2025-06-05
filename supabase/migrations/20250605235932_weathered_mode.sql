/*
  # Add INSERT policy for users table
  
  1. Changes
    - Add INSERT policy to allow users to create their own profile
    
  2. Security
    - Policy ensures users can only create a profile with their own auth.uid()
    - Maintains data integrity by linking profiles to auth users
*/

CREATE POLICY "Users can create own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);