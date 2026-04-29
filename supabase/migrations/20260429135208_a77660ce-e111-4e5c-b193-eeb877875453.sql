DROP POLICY IF EXISTS "Users can create own coupons" ON public.coupons;
CREATE POLICY "Users can create own coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own coupons" ON public.coupons;
CREATE POLICY "Users can update own coupons" ON public.coupons FOR UPDATE TO authenticated USING (auth.uid() = created_by OR private.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = created_by OR private.has_role(auth.uid(), 'admin'));