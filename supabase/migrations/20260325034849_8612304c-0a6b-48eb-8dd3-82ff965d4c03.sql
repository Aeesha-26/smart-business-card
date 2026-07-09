
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business Cards table
CREATE TABLE public.business_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  name TEXT NOT NULL,
  job_title TEXT,
  organization TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cards" ON public.business_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON public.business_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.business_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON public.business_cards FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active cards by public_id" ON public.business_cards FOR SELECT USING (status = 'active');

CREATE TRIGGER update_business_cards_updated_at
  BEFORE UPDATE ON public.business_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- QR Codes table
CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  qr_string TEXT NOT NULL,
  qr_type TEXT NOT NULL DEFAULT 'dynamic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own QR codes" ON public.qr_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.business_cards WHERE id = qr_codes.card_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own QR codes" ON public.qr_codes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.business_cards WHERE id = qr_codes.card_id AND user_id = auth.uid())
);
CREATE POLICY "Anyone can view QR codes for active cards" ON public.qr_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.business_cards WHERE id = qr_codes.card_id AND status = 'active')
);

-- Scan Logs table
CREATE TABLE public.scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert scan logs" ON public.scan_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own scan logs" ON public.scan_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.qr_codes qr
    JOIN public.business_cards bc ON bc.id = qr.card_id
    WHERE qr.id = scan_logs.qr_id AND bc.user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_business_cards_user_id ON public.business_cards(user_id);
CREATE INDEX idx_business_cards_public_id ON public.business_cards(public_id);
CREATE INDEX idx_qr_codes_card_id ON public.qr_codes(card_id);
CREATE INDEX idx_scan_logs_qr_id ON public.scan_logs(qr_id);
CREATE INDEX idx_scan_logs_scanned_at ON public.scan_logs(scanned_at);
