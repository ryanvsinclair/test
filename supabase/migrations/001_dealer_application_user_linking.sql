-- Migration: Link dealer_applications to auth.users
-- Purpose: Switch to dealer-creates-account-first flow

-- 1) Add user_id column to link application to auth user
ALTER TABLE public.dealer_applications 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2) Backfill user_id by matching email (case-insensitive)
UPDATE public.dealer_applications da
SET user_id = u.id
FROM auth.users u
WHERE da.user_id IS NULL
  AND lower(da.email) = lower(u.email);

-- 3) Create unique index to enforce one application per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_dealer_applications_user_id 
ON public.dealer_applications(user_id) 
WHERE user_id IS NOT NULL;

-- 4) Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dealer_applications_email 
ON public.dealer_applications(email);

-- 5) Ensure status enum is strict (if not already)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dealer_application_status') THEN
    CREATE TYPE dealer_application_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- 6) Normalize existing status values
UPDATE public.dealer_applications 
SET status = lower(trim(status))
WHERE status IS NOT NULL;

-- 7) Alter status column to use enum (if not already)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.dealer_applications 
    ALTER COLUMN status TYPE dealer_application_status 
    USING status::dealer_application_status;
  EXCEPTION
    WHEN others THEN
      -- Column already correct type, skip
      NULL;
  END;
END $$;

-- 8) Set default status
ALTER TABLE public.dealer_applications 
ALTER COLUMN status SET DEFAULT 'pending'::dealer_application_status;

-- 9) Optional: Allow authenticated dealers to view their own application
-- (Admin service_role can already SELECT/UPDATE/DELETE everything)
CREATE POLICY IF NOT EXISTS "Dealers can view own application"
ON public.dealer_applications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

COMMENT ON COLUMN public.dealer_applications.user_id IS 'Links application to auth.users - dealer creates account before applying';
COMMENT ON INDEX idx_dealer_applications_user_id IS 'Enforces one application per user';
