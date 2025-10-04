-- Rename secret_key_hash column to password_hash for clarity
ALTER TABLE public.users RENAME COLUMN secret_key_hash TO password_hash;