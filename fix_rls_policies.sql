-- ============================================================
-- FIX: Infinite recursion in RLS policies on "profiles" table
-- Run this in your Supabase SQL Editor (supabase.com -> SQL Editor)
-- ============================================================

-- Step 1: Create a SECURITY DEFINER function that reads the
-- current user's role WITHOUT triggering RLS (bypasses policy checks).
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$;

-- Step 2: Drop ALL existing policies on profiles to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "admins_can_read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_can_update_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_read_all" ON profiles;
DROP POLICY IF EXISTS "admin_update_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Step 3: Recreate policies using the SECURITY DEFINER function
-- (this avoids the recursion by not querying profiles inside a profiles policy)

-- Allow users to view their own profile, OR admins to view all
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR get_my_role() = 'admin'
  );

-- Allow users to update their own profile, OR admins to update any
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    user_id = auth.uid()
    OR get_my_role() = 'admin'
  );

-- Allow insert only for own profile (triggered on sign-up)
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
