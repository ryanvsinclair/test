-- Add city and region columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region VARCHAR;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region);

-- Update the handle_new_user function to include city and region
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_city TEXT;
  v_region TEXT;
BEGIN
  -- Extract city and region from user metadata
  -- Format expected: "City, Region" or just "City"
  v_city := COALESCE(NEW.raw_user_meta_data->>'city', '');
  
  -- Parse region from city field if it contains comma
  IF position(',' in v_city) > 0 THEN
    v_region := trim(substring(v_city from position(',' in v_city) + 1));
    v_city := trim(substring(v_city from 1 for position(',' in v_city) - 1));
  ELSE
    v_region := '';
  END IF;

  INSERT INTO public.profiles (id, email, name, city, region, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_city,
    v_region,
    'buyer', -- Default role
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
