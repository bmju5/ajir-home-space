CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(UUID, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION private.has_role(UUID, public.app_role) FROM authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM authenticated;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view published properties" ON public.properties;
CREATE POLICY "Anyone can view published properties"
ON public.properties FOR SELECT
USING (status = 'published' OR auth.uid() = host_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Hosts can update own properties" ON public.properties;
CREATE POLICY "Hosts can update own properties"
ON public.properties FOR UPDATE TO authenticated
USING (auth.uid() = host_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = host_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Hosts can delete own properties" ON public.properties;
CREATE POLICY "Hosts can delete own properties"
ON public.properties FOR DELETE TO authenticated
USING (auth.uid() = host_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Guests and hosts can view relevant bookings" ON public.bookings;
CREATE POLICY "Guests and hosts can view relevant bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  auth.uid() = guest_id
  OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.host_id = auth.uid())
  OR private.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Guests and hosts can update relevant bookings" ON public.bookings;
CREATE POLICY "Guests and hosts can update relevant bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (
  auth.uid() = guest_id
  OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.host_id = auth.uid())
  OR private.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = guest_id
  OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.host_id = auth.uid())
  OR private.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can view relevant payments" ON public.payments;
CREATE POLICY "Users can view relevant payments"
ON public.payments FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.properties p ON p.id = b.property_id
    WHERE b.id = booking_id AND p.host_id = auth.uid()
  )
  OR private.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments"
ON public.payments FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews"
ON public.reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites"
ON public.favorites FOR DELETE TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);