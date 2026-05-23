
-- Extend booking lifecycle
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'checked_in';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'checked_out';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS variant_id uuid,
  ADD COLUMN IF NOT EXISTS check_in_time timestamptz,
  ADD COLUMN IF NOT EXISTS check_out_time timestamptz;

-- Property variants
CREATE TABLE IF NOT EXISTS public.property_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  max_guests integer NOT NULL DEFAULT 1,
  bedrooms integer NOT NULL DEFAULT 1,
  bathrooms integer NOT NULL DEFAULT 1,
  beds integer NOT NULL DEFAULT 1,
  images text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.property_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active variants" ON public.property_variants FOR SELECT USING (
  is_active = true OR EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.host_id = auth.uid()) OR private.has_role(auth.uid(),'admin')
);
CREATE POLICY "Hosts manage own variants" ON public.property_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.host_id = auth.uid()) OR private.has_role(auth.uid(),'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.host_id = auth.uid()) OR private.has_role(auth.uid(),'admin')
);
CREATE TRIGGER trg_property_variants_updated BEFORE UPDATE ON public.property_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Utility bills
CREATE TYPE bill_kind AS ENUM ('electricity','water','gas','internet','other');
CREATE TYPE bill_status AS ENUM ('unpaid','paid','overdue');
CREATE TABLE IF NOT EXISTS public.utility_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  property_id uuid,
  kind bill_kind NOT NULL DEFAULT 'electricity',
  provider text NOT NULL DEFAULT '',
  period_label text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  due_date date NOT NULL,
  paid_at timestamptz,
  status bill_status NOT NULL DEFAULT 'unpaid',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.utility_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own bills" ON public.utility_bills FOR SELECT USING (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners create own bills" ON public.utility_bills FOR INSERT WITH CHECK (auth.uid()=owner_id);
CREATE POLICY "Owners update own bills" ON public.utility_bills FOR UPDATE USING (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete own bills" ON public.utility_bills FOR DELETE USING (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_utility_bills_updated BEFORE UPDATE ON public.utility_bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ajir bundles catalog
CREATE TABLE IF NOT EXISTS public.ajir_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'security',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing text NOT NULL DEFAULT 'one_time',
  features text[] NOT NULL DEFAULT '{}',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ajir_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active bundles" ON public.ajir_bundles FOR SELECT USING (is_active=true OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage bundles" ON public.ajir_bundles FOR ALL USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ajir_bundles_updated BEFORE UPDATE ON public.ajir_bundles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bundle purchases
CREATE TABLE IF NOT EXISTS public.bundle_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  bundle_id uuid NOT NULL,
  property_id uuid,
  status text NOT NULL DEFAULT 'pending',
  price_paid numeric NOT NULL DEFAULT 0,
  notes text,
  scheduled_for date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bundle_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own purchases" ON public.bundle_purchases FOR SELECT USING (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners create own purchases" ON public.bundle_purchases FOR INSERT WITH CHECK (auth.uid()=owner_id);
CREATE POLICY "Owners update own purchases" ON public.bundle_purchases FOR UPDATE USING (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bundle_purchases_updated BEFORE UPDATE ON public.bundle_purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Owner subscriptions
CREATE TABLE IF NOT EXISTS public.owner_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  service_name text NOT NULL,
  service_category text NOT NULL DEFAULT 'cleaning',
  property_id uuid,
  frequency text NOT NULL DEFAULT 'weekly',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active',
  starts_on date NOT NULL DEFAULT CURRENT_DATE,
  next_visit date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.owner_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own subs" ON public.owner_subscriptions FOR SELECT USING (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners create own subs" ON public.owner_subscriptions FOR INSERT WITH CHECK (auth.uid()=owner_id);
CREATE POLICY "Owners update own subs" ON public.owner_subscriptions FOR UPDATE USING (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete own subs" ON public.owner_subscriptions FOR DELETE USING (auth.uid()=owner_id OR private.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_owner_subs_updated BEFORE UPDATE ON public.owner_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed bundles
INSERT INTO public.ajir_bundles (slug, title, description, category, price, billing, features) VALUES
  ('security-pro','Ajir Security Pro','4K outdoor cameras, smart lock, 24/7 monitoring and Algerian-based response team.','security',499,'one_time', ARRAY['4× 4K cameras','Smart lock with PIN','Motion + glass-break sensors','24/7 monitoring (DZ)']),
  ('smart-home','Smart Home Essentials','Voice assistant, smart thermostat, leak detector and bridge for your rental.','smart_home',329,'one_time', ARRAY['Smart thermostat','Leak detector','Voice assistant','Zigbee bridge']),
  ('welcome-pack','Guest Welcome Pack','Curated Algerian welcome basket: dates, tea, towels and a city guide.','welcome',45,'per_booking', ARRAY['Dates & nuts','Mint tea kit','Fresh towels','City guide']),
  ('cleaning-weekly','Weekly Pro Cleaning','Trusted local cleaners, full turnover service.','cleaning',80,'weekly', ARRAY['Full clean','Linen change','Restock essentials']),
  ('laundry','Laundry Service','Pickup, wash, fold and return within 24h.','laundry',35,'per_visit', ARRAY['Pickup & return','Eco detergent','24h turnaround']),
  ('pool-care','Pool Care','Bi-weekly chemical balance and skim.','pool',60,'biweekly', ARRAY['Chemical balance','Skimming','Equipment check'])
ON CONFLICT (slug) DO NOTHING;
