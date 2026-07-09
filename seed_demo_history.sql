-- ============================================================
-- CardSync — Restore demo history from project screenshots
-- Run in Supabase → SQL Editor (as project owner)
-- ============================================================
--
-- TARGET TOTALS (from screenshots):
--   Users: 9 | Cards: 9 | Scans: 42 | Feedback: 2
--
-- REAL ACCOUNTS (kept as-is, only updated):
--   meet.aeesha04@gmail.com  → Nana Aishah (admin, 5 cards)
--   chukwubright014@gmail.com → Chukwu Bright (user, 0 cards)
--
-- DEMO ACCOUNTS (created with password: CardSyncDemo123!)
--   *@cardsync.demo emails — not real inboxes, for display/history only
--
-- SAFE TO RE-RUN: removes previous seed data first, then re-inserts.
-- ============================================================

BEGIN;

-- ----------------------------------------------------------
-- 0. Fixed UUIDs (deterministic so re-runs are predictable)
-- ----------------------------------------------------------
-- Demo users
-- Bootify, Kirah, Osamuyi, Peculiar, Nana2, Ella, Lilio
-- Cards owned by Nana (5) + one each for Kirah, Osamuyi, Peculiar, Lilio (4)

-- Demo user UUIDs
-- u_bootify, u_kirah, u_osamuyi, u_peculiar, u_nana2, u_ella, u_lilio

-- We'll assign in DO block

-- ----------------------------------------------------------
-- 1. Helper: create auth user + identity (skip if exists)
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION seed_auth_user(
  p_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_created_at TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_id) THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      p_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', p_email,
      crypt('CardSyncDemo123!', gen_salt('bf')),
      p_created_at,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name),
      p_created_at, p_created_at,
      '', '', '', ''
    );

    INSERT INTO auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      p_id::text, p_id,
      jsonb_build_object(
        'sub', p_id::text,
        'email', p_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      p_created_at, p_created_at, p_created_at
    );
  END IF;

  -- Upsert profile (trigger may have created a bare row)
  INSERT INTO public.profiles (user_id, full_name, role, created_at, updated_at)
  VALUES (p_id, p_full_name, 'user', p_created_at, p_created_at)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

  RETURN p_id;
END;
$$;

-- ----------------------------------------------------------
-- 2. Helper: insert scan logs spread across dates
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION seed_scans(
  p_qr_id UUID,
  p_count INT,
  p_start DATE,
  p_end DATE
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  i INT;
  scan_day DATE;
  day_span INT;
BEGIN
  IF p_count <= 0 THEN RETURN; END IF;
  day_span := GREATEST(1, (p_end - p_start));

  FOR i IN 1..p_count LOOP
    scan_day := p_start + ((i - 1) % (day_span + 1));
    INSERT INTO public.scan_logs (qr_id, scanned_at)
    VALUES (
      p_qr_id,
      (scan_day + (INTERVAL '1 hour' * (i % 12)))::timestamptz
    );
  END LOOP;
END;
$$;

-- ----------------------------------------------------------
-- 3. Clean previous seed data (demo emails + Nana's seeded cards)
-- ----------------------------------------------------------
DELETE FROM public.feedback
WHERE card_id IN (
  SELECT bc.id FROM public.business_cards bc
  JOIN auth.users u ON u.id = bc.user_id
  WHERE u.email LIKE '%@cardsync.demo'
     OR u.email = 'meet.aeesha04@gmail.com'
);

DELETE FROM public.scan_logs
WHERE qr_id IN (
  SELECT qr.id FROM public.qr_codes qr
  JOIN public.business_cards bc ON bc.id = qr.card_id
  JOIN auth.users u ON u.id = bc.user_id
  WHERE u.email LIKE '%@cardsync.demo'
     OR u.email = 'meet.aeesha04@gmail.com'
);

DELETE FROM public.qr_codes
WHERE card_id IN (
  SELECT bc.id FROM public.business_cards bc
  JOIN auth.users u ON u.id = bc.user_id
  WHERE u.email LIKE '%@cardsync.demo'
     OR u.email = 'meet.aeesha04@gmail.com'
);

DELETE FROM public.business_cards
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@cardsync.demo'
     OR email = 'meet.aeesha04@gmail.com'
);

-- Remove demo auth users (not real accounts)
DELETE FROM auth.users WHERE email LIKE '%@cardsync.demo';

-- ----------------------------------------------------------
-- 4. Ensure real accounts exist & Nana is admin
-- ----------------------------------------------------------
DO $$
DECLARE
  v_nana_id UUID;
  v_bright_id UUID;

  -- Demo user IDs
  u_bootify   UUID := 'a1000001-0000-4000-8000-000000000001';
  u_kirah     UUID := 'a1000002-0000-4000-8000-000000000002';
  u_osamuyi   UUID := 'a1000003-0000-4000-8000-000000000003';
  u_peculiar  UUID := 'a1000004-0000-4000-8000-000000000004';
  u_nana2     UUID := 'a1000005-0000-4000-8000-000000000005';
  u_ella      UUID := 'a1000006-0000-4000-8000-000000000006';
  u_lilio     UUID := 'a1000007-0000-4000-8000-000000000007';

  -- Card IDs
  c_nana1 UUID := 'b2000001-0000-4000-8000-000000000001';
  c_nana2 UUID := 'b2000002-0000-4000-8000-000000000002';
  c_nana3 UUID := 'b2000003-0000-4000-8000-000000000003';
  c_nana4 UUID := 'b2000004-0000-4000-8000-000000000004';
  c_nana5 UUID := 'b2000005-0000-4000-8000-000000000005';
  c_kirah UUID := 'b2000006-0000-4000-8000-000000000006';
  c_osam  UUID := 'b2000007-0000-4000-8000-000000000007';
  c_pec   UUID := 'b2000008-0000-4000-8000-000000000008';
  c_lilio UUID := 'b2000009-0000-4000-8000-000000000009';

  -- QR IDs
  q_nana1 UUID := 'c3000001-0000-4000-8000-000000000001';
  q_nana2 UUID := 'c3000002-0000-4000-8000-000000000002';
  q_nana3 UUID := 'c3000003-0000-4000-8000-000000000003';
  q_nana4 UUID := 'c3000004-0000-4000-8000-000000000004';
  q_nana5 UUID := 'c3000005-0000-4000-8000-000000000005';
  q_kirah UUID := 'c3000006-0000-4000-8000-000000000006';
  q_osam  UUID := 'c3000007-0000-4000-8000-000000000007';
  q_pec   UUID := 'c3000008-0000-4000-8000-000000000008';
  q_lilio UUID := 'c3000009-0000-4000-8000-000000000009';

  v_site TEXT := 'https://smart-business-card-omega.vercel.app';
BEGIN
  -- Real users: must already exist from registration
  SELECT id INTO v_nana_id FROM auth.users WHERE email = 'meet.aeesha04@gmail.com';
  SELECT id INTO v_bright_id FROM auth.users WHERE email = 'chukwubright014@gmail.com';

  IF v_nana_id IS NULL THEN
    RAISE EXCEPTION 'Nana account not found. Register meet.aeesha04@gmail.com on the site first, then re-run.';
  END IF;

  UPDATE public.profiles SET
    full_name = 'Nana Aishah',
    role = 'admin',
    created_at = '2026-05-25 10:00:00+00',
    updated_at = now()
  WHERE user_id = v_nana_id;

  IF v_bright_id IS NOT NULL THEN
    UPDATE public.profiles SET
      full_name = 'Chukwu Bright',
      role = 'user',
      created_at = COALESCE(created_at, '2026-06-01 10:00:00+00')
    WHERE user_id = v_bright_id;
  END IF;

  -- ----------------------------------------------------------
  -- 5. Create 7 demo users (screenshot names + join dates)
  -- ----------------------------------------------------------
  PERFORM seed_auth_user(u_bootify,  'bootify@cardsync.demo',   'Bootify',           '2026-06-16 09:00:00+00');
  PERFORM seed_auth_user(u_kirah,    'kirah@cardsync.demo',     'Kirah oyaks',       '2026-05-29 11:00:00+00');
  PERFORM seed_auth_user(u_osamuyi,  'osamuyi@cardsync.demo',   'Osamuyi Aiyeki',    '2026-05-26 14:00:00+00');
  PERFORM seed_auth_user(u_peculiar, 'peculiar@cardsync.demo',  'PECULIAR ALEONGIE', '2026-05-25 08:30:00+00');
  PERFORM seed_auth_user(u_nana2,    'nana2@cardsync.demo',     'Nana Aishah',       '2026-05-25 07:00:00+00');
  PERFORM seed_auth_user(u_ella,     'ella@cardsync.demo',      'Ella Omorogbe',     '2026-05-25 12:00:00+00');
  PERFORM seed_auth_user(u_lilio,    'lilio@cardsync.demo',     'lilio',             '2026-05-25 16:00:00+00');

  -- ----------------------------------------------------------
  -- 6. Business cards (9 total — names from screenshots)
  -- ----------------------------------------------------------

  -- Nana's 5 cards (28 scans total: 2+4+5+15+2)
  INSERT INTO public.business_cards (id, user_id, public_id, name, job_title, organization, status, created_at, updated_at) VALUES
    (c_nana1, v_nana_id, 'nanaaishah01', 'oyakhire nana aishah', 'Scientist', NULL, 'active', '2026-05-25 11:00:00+00', '2026-05-25 11:00:00+00'),
    (c_nana2, v_nana_id, 'alasarabaitu', 'Alasa Rabaitu', 'Influencer', 'Edo State University, Iyamho', 'active', '2026-05-26 10:00:00+00', '2026-05-26 10:00:00+00'),
    (c_nana3, v_nana_id, 'emmanullaom', 'Emmanulla Omorogbe', 'Director of Sports ( NACOS )', 'Edo State University, Iyamho', 'active', '2026-05-27 10:00:00+00', '2026-05-27 10:00:00+00'),
    (c_nana4, v_nana_id, 'mahmudaishah', 'Mahmud Nana Aishah', 'Computer Scientist', NULL, 'active', '2026-05-28 10:00:00+00', '2026-05-28 10:00:00+00'),
    (c_nana5, v_nana_id, 'alameenahyoo', 'Al-Ameenah Yoonek ❤️💕', 'Data Scientist', NULL, 'active', '2026-05-29 10:00:00+00', '2026-05-29 10:00:00+00');

  -- Other users' 4 cards (14 scans total: 4+3+4+3)
  INSERT INTO public.business_cards (id, user_id, public_id, name, job_title, organization, status, created_at, updated_at) VALUES
    (c_kirah, u_kirah,   'kirahoyaks01', 'Kirah oyaks', 'Content Creator', 'Edo State University, Iyamho', 'active', '2026-05-29 12:00:00+00', '2026-05-29 12:00:00+00'),
    (c_osam,  u_osamuyi, 'osamuyiaiy01', 'Osamuyi Aiyeki', 'Student', 'Edo State University, Iyamho', 'active', '2026-05-26 15:00:00+00', '2026-05-26 15:00:00+00'),
    (c_pec,   u_peculiar,'peculiarale1', 'PECULIAR ALEONGIE', 'Entrepreneur', NULL, 'active', '2026-05-25 09:00:00+00', '2026-05-25 09:00:00+00'),
    (c_lilio, u_lilio,   'liliocards01', 'lilio', 'Designer', NULL, 'active', '2026-05-25 17:00:00+00', '2026-05-25 17:00:00+00');

  -- ----------------------------------------------------------
  -- 7. QR codes (one per card)
  -- ----------------------------------------------------------
  INSERT INTO public.qr_codes (id, card_id, qr_string, qr_type, created_at) VALUES
    (q_nana1, c_nana1, v_site || '/card/nanaaishah01', 'dynamic', '2026-05-25 11:05:00+00'),
    (q_nana2, c_nana2, v_site || '/card/alasarabaitu', 'dynamic', '2026-05-26 10:05:00+00'),
    (q_nana3, c_nana3, v_site || '/card/emmanullaom', 'dynamic', '2026-05-27 10:05:00+00'),
    (q_nana4, c_nana4, v_site || '/card/mahmudaishah', 'dynamic', '2026-05-28 10:05:00+00'),
    (q_nana5, c_nana5, v_site || '/card/alameenahyoo', 'dynamic', '2026-05-29 10:05:00+00'),
    (q_kirah, c_kirah, v_site || '/card/kirahoyaks01', 'dynamic', '2026-05-29 12:05:00+00'),
    (q_osam,  c_osam,  v_site || '/card/osamuyiaiy01', 'dynamic', '2026-05-26 15:05:00+00'),
    (q_pec,   c_pec,   v_site || '/card/peculiarale1', 'dynamic', '2026-05-25 09:05:00+00'),
    (q_lilio, c_lilio, v_site || '/card/liliocards01', 'dynamic', '2026-05-25 17:05:00+00');

  -- ----------------------------------------------------------
  -- 8. Scan logs (42 total — matches admin dashboard)
  --    Spread May 25 – Jul 9 2026 for chart activity
  -- ----------------------------------------------------------
  PERFORM seed_scans(q_nana1, 2,  '2026-06-10', '2026-06-17');
  PERFORM seed_scans(q_nana2, 4,  '2026-06-11', '2026-06-20');
  PERFORM seed_scans(q_nana3, 5,  '2026-06-12', '2026-06-22');
  PERFORM seed_scans(q_nana4, 15, '2026-05-29', '2026-07-09');
  PERFORM seed_scans(q_nana5, 2,  '2026-06-14', '2026-06-18');
  PERFORM seed_scans(q_kirah, 4,  '2026-06-13', '2026-06-25');
  PERFORM seed_scans(q_osam,  3,  '2026-06-15', '2026-06-28');
  PERFORM seed_scans(q_pec,   4,  '2026-06-16', '2026-07-01');
  PERFORM seed_scans(q_lilio, 3,  '2026-06-17', '2026-07-05');

  -- ----------------------------------------------------------
  -- 9. Feedback (2 entries — from screenshot)
  -- ----------------------------------------------------------
  INSERT INTO public.feedback (card_id, name, email, message, created_at) VALUES
    (
      c_nana4,
      NULL,
      NULL,
      'It''s a great site',
      '2026-05-29 18:00:00+00'
    ),
    (
      c_nana4,
      'Kirah',
      NULL,
      'The query isn''t showing properly on mobile phone',
      '2026-05-29 19:30:00+00'
    );

END $$;

-- ----------------------------------------------------------
-- 10. Verify totals
-- ----------------------------------------------------------
SELECT 'profiles' AS table_name, COUNT(*) AS row_count FROM public.profiles
UNION ALL
SELECT 'business_cards', COUNT(*) FROM public.business_cards
UNION ALL
SELECT 'scan_logs', COUNT(*) FROM public.scan_logs
UNION ALL
SELECT 'feedback', COUNT(*) FROM public.feedback;

-- Expected after run:
--   profiles:       9
--   business_cards: 9
--   scan_logs:     42
--   feedback:       2

-- Cleanup helper functions (optional — comment out to keep them)
DROP FUNCTION IF EXISTS seed_scans(UUID, INT, DATE, DATE);
DROP FUNCTION IF EXISTS seed_auth_user(UUID, TEXT, TEXT, TIMESTAMPTZ);

COMMIT;
