DO $$ BEGIN
  CREATE TYPE public.ajir_order_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.discount_type AS ENUM ('percent', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.coupon_scope AS ENUM ('stays', 'services', 'experiences', 'all');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  category TEXT NOT NULL DEFAULT 'concierge',
  available_times TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  service_date DATE NOT NULL,
  service_time TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status public.ajir_order_status NOT NULL DEFAULT 'pending',
  coupon_code TEXT,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  final_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  duration_hours NUMERIC NOT NULL DEFAULT 2,
  max_guests INTEGER NOT NULL DEFAULT 8,
  available_dates DATE[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.experience_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status public.ajir_order_status NOT NULL DEFAULT 'pending',
  coupon_code TEXT,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  final_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  discount_type public.discount_type NOT NULL DEFAULT 'percent',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  min_spend NUMERIC NOT NULL DEFAULT 0,
  scope public.coupon_scope NOT NULL DEFAULT 'all',
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchaser_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true OR private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create own service orders" ON public.service_orders;
CREATE POLICY "Users can create own service orders" ON public.service_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own service orders" ON public.service_orders;
CREATE POLICY "Users can view own service orders" ON public.service_orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can update own service orders" ON public.service_orders;
CREATE POLICY "Users can update own service orders" ON public.service_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view active experiences" ON public.experiences;
CREATE POLICY "Anyone can view active experiences" ON public.experiences FOR SELECT USING (is_active = true OR private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage experiences" ON public.experiences;
CREATE POLICY "Admins can manage experiences" ON public.experiences FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create own experience bookings" ON public.experience_bookings;
CREATE POLICY "Users can create own experience bookings" ON public.experience_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own experience bookings" ON public.experience_bookings;
CREATE POLICY "Users can view own experience bookings" ON public.experience_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can update own experience bookings" ON public.experience_bookings;
CREATE POLICY "Users can update own experience bookings" ON public.experience_bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view usable coupons" ON public.coupons;
CREATE POLICY "Anyone can view usable coupons" ON public.coupons FOR SELECT USING (is_active = true OR private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create purchased gift cards" ON public.gift_cards;
CREATE POLICY "Users can create purchased gift cards" ON public.gift_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = purchaser_id);
DROP POLICY IF EXISTS "Users can view own gift cards" ON public.gift_cards;
CREATE POLICY "Users can view own gift cards" ON public.gift_cards FOR SELECT TO authenticated USING (auth.uid() = purchaser_id OR private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can update own gift cards" ON public.gift_cards;
CREATE POLICY "Users can update own gift cards" ON public.gift_cards FOR UPDATE TO authenticated USING (auth.uid() = purchaser_id OR private.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = purchaser_id OR private.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_service_orders_updated_at ON public.service_orders;
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_experiences_updated_at ON public.experiences;
CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_experience_bookings_updated_at ON public.experience_bookings;
CREATE TRIGGER update_experience_bookings_updated_at BEFORE UPDATE ON public.experience_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON public.gift_cards;
CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON public.gift_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_service_orders_user_id ON public.service_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_user_id ON public.experience_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser_id ON public.gift_cards(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);