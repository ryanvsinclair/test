-- Migration: Enforce user ownership on dealer_applications
-- Purpose: Fix "Could not find the 'user_id' column" error
-- Requirement: Each application must belong to exactly one auth.users record

-- Add user_id column with NOT NULL constraint and foreign key
ALTER TABLE public.dealer_applications
ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Enforce one application per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_dealer_applications_user_id
ON public.dealer_applications(user_id);

-- Add helpful comment
COMMENT ON COLUMN public.dealer_applications.user_id IS 'References auth.users.id - one application per user';
