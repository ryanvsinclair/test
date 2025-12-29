-- Function to upsert dealer profile (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION upsert_dealer_profile(
  p_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT,
  p_dealer_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, dealer_status, created_at, updated_at)
  VALUES (p_id, p_email, p_name, p_role::user_role, p_dealer_status::dealer_status_type, NOW(), NOW())
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    dealer_status = EXCLUDED.dealer_status,
    updated_at = NOW();
END;
$$;
