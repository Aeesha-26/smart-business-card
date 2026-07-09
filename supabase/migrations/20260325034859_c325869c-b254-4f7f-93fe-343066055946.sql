
DROP POLICY "Anyone can insert scan logs" ON public.scan_logs;
CREATE POLICY "Anyone can insert scan logs for existing QR codes" ON public.scan_logs 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.qr_codes qr
    JOIN public.business_cards bc ON bc.id = qr.card_id
    WHERE qr.id = scan_logs.qr_id AND bc.status = 'active'
  )
);
