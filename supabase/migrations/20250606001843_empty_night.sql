/*
  # Add indexes and improve schema

  1. Changes
    - Add indexes for frequently queried columns
    - Add updated_at trigger for users table
    - Add cascade delete for posts and messages
  
  2. Indexes
    - posts(author_id, created_at)
    - messages(from_id, to_id, created_at)
    - users(name) for search functionality
*/

-- Add indexes
CREATE INDEX IF NOT EXISTS posts_author_date_idx ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_users_date_idx ON messages(from_id, to_id, created_at DESC);
CREATE INDEX IF NOT EXISTS users_name_idx ON users(name);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update foreign key constraints to cascade delete
ALTER TABLE posts
    DROP CONSTRAINT posts_author_id_fkey,
    ADD CONSTRAINT posts_author_id_fkey
        FOREIGN KEY (author_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

ALTER TABLE messages
    DROP CONSTRAINT messages_from_id_fkey,
    ADD CONSTRAINT messages_from_id_fkey
        FOREIGN KEY (from_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE,
    DROP CONSTRAINT messages_to_id_fkey,
    ADD CONSTRAINT messages_to_id_fkey
        FOREIGN KEY (to_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;