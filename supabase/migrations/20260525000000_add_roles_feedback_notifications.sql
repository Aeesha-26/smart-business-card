-- ============================================================
-- Migration: Add roles, feedback, notifications, field visibility
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 2. Add avatar_url to profiles  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Add field visibility controls to business_cards (JSONB)
ALTER TABLE business_cards ADD COLUMN IF NOT EXISTS visible_fields JSONB NOT NULL DEFAULT '{"phone": true, "email": true, "website": true, "address": true, "linkedin_url": true, "instagram_url": true, "twitter_url": true}';

-- 4. Add theme customization to business_cards (JSONB)
ALTER TABLE business_cards ADD COLUMN IF NOT EXISTS theme JSONB NOT NULL DEFAULT '{"primaryColor": "#1a365d", "accentColor": "#2d9c83", "backgroundColor": "#f8fafc"}';

-- 5. Add avatar_url to business_cards
ALTER TABLE business_cards ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- 6. Create feedback table
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (public)
CREATE POLICY "Anyone can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Card owners can read feedback on their cards
CREATE POLICY "Card owners can read feedback"
  ON feedback FOR SELECT
  USING (
    card_id IN (
      SELECT id FROM business_cards WHERE user_id = auth.uid()
    )
  );

-- Admins can read all feedback
CREATE POLICY "Admins can read all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 7. Create notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System/triggers can insert notifications  
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 8. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_feedback_card_id ON feedback(card_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================
-- 9. Trigger: create notification when a scan happens
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_scan()
RETURNS TRIGGER AS $$
DECLARE
  card_owner_id UUID;
  card_name TEXT;
BEGIN
  -- Find the card owner through qr_codes -> business_cards
  SELECT bc.user_id, bc.name INTO card_owner_id, card_name
  FROM qr_codes qc
  JOIN business_cards bc ON bc.id = qc.card_id
  WHERE qc.id = NEW.qr_id;

  IF card_owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      card_owner_id,
      'scan',
      'New card scan',
      'Your card "' || COALESCE(card_name, 'Unknown') || '" was just scanned.'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_scan_log_created ON scan_logs;
CREATE TRIGGER on_scan_log_created
  AFTER INSERT ON scan_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_scan();

-- ============================================================
-- 10. Admin RLS policies for profiles (admin can see all)
-- ============================================================
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admin can see all business cards
CREATE POLICY "Admins can read all business_cards"
  ON business_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can see all scan_logs
CREATE POLICY "Admins can read all scan_logs"
  ON scan_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 11. Storage bucket for avatars
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
