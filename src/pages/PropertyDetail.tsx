import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BedDouble, Heart, Loader2, MapPin, Share2, Star, Tag, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageShell } from "@/components/ajir/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import { popularProperties, trendingProperties, type AjirProperty } from "@/data/ajir-properties";
import type { Database } from "@/integrations/supabase/types";
import type { PropertyRow } from "@/types/ajir";
import stayOne from "@/assets/ajir-stays-1.jpg";

type Variant = Database["public"]["Tables"]["property_variants"]["Row"];
type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

const money = (v: number) => `$${Number(v || 0).toFixed(2)}`;
const nights = (a: string, b: string) => Math.max(1, Math.ceil((+new Date(b) - +new Date(a)) / 86400000));

const dbToAjir = (p: PropertyRow): AjirProperty => ({
  id: `db-${p.id}`,
  title: p.title,
  location: `${p.city}, ${p.country}`,
  distance: p.address || "Verified Algeria location",
  dates: "Available now",
  price: Number(p.price),
  rating: 4.9,
  images: p.images?.length ? p.images : [stayOne, stayOne, stayOne],
  badge: p.status === "published" ? "Host listing" : undefined,
  lat: Number(p.latitude ?? 36.7), lng: Number(p.longitude ?? 3.05),
});

const PropertyDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAjirAuth();
  const [property, setProperty] = useState<AjirProperty | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [selVariant, setSelVariant] = useState<string | null>(null);
  const [booking, setBooking] = useState({ checkIn: "", checkOut: "", guests: "2", coupon: "" });
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    void (async () => {
      // db property
      if (id.startsWith("db-")) {
        const realId = id.replace("db-", "");
        const [{ data: p }, { data: v }, { data: c }] = await Promise.all([
          supabase.from("properties").select("*").eq("id", realId).maybeSingle(),
          supabase.from("property_variants").select("*").eq("property_id", realId).eq("is_active", true).order("price"),
          supabase.from("coupons").select("*").eq("is_active", true),
        ]);
        if (p) setProperty(dbToAjir(p));
        if (v) { setVariants(v); if (v[0]) setSelVariant(v[0].id); }
        if (c) setCoupons(c);
      } else {
        const all = [...popularProperties, ...trendingProperties];
        const found = all.find((x) => x.id === id) ?? null;
        setProperty(found);
        const { data: c } = await supabase.from("coupons").select("*").eq("is_active", true);
        if (c) setCoupons(c);
      }
    })();
  }, [id]);

  const variant = useMemo(() => variants.find((v) => v.id === selVariant) ?? null, [variants, selVariant]);
  const unitPrice = variant ? Number(variant.price) : property?.price ?? 0;
  const subtotal = booking.checkIn && booking.checkOut ? nights(booking.checkIn, booking.checkOut) * unitPrice : unitPrice;
  const cleaningFee = Math.round(unitPrice * 0.1);
  const serviceFee = Math.round(subtotal * 0.06);
  const taxes = Math.round(subtotal * 0.05);
  const totalBefore = subtotal + cleaningFee + serviceFee + taxes;
  const couponMatch = booking.coupon.trim() ? coupons.find((c) => c.code.toUpperCase() === booking.coupon.trim().toUpperCase()) : null;
  let discount = 0;
  let couponMsg = "";
  if (booking.coupon.trim()) {
    if (!couponMatch) couponMsg = "Coupon not found.";
    else if (couponMatch.scope !== "all" && couponMatch.scope !== "stays") couponMsg = `Only for ${couponMatch.scope}.`;
    else if (totalBefore < Number(couponMatch.min_spend)) couponMsg = `Min spend ${money(Number(couponMatch.min_spend))}.`;
    else {
      discount = Math.min(totalBefore, couponMatch.discount_type === "percent" ? totalBefore * Number(couponMatch.discount_value) / 100 : Number(couponMatch.discount_value));
      couponMsg = `Applied: -${money(discount)}`;
    }
  }
  const total = totalBefore - discount;

  const reserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in first.");
    if (!property) return;
    if (!booking.checkIn || !booking.checkOut) return toast.error("Pick your dates.");
    if (!id.startsWith("db-")) return toast.success(`Demo reserved: ${property.title} · ${money(total)}.`);
    setSubmitting(true);
    const propertyId = id.replace("db-", "");
    const { data, error } = await supabase.from("bookings").insert({
      property_id: propertyId, guest_id: user.id, check_in: booking.checkIn, check_out: booking.checkOut,
      guests: Number(booking.guests), total_price: total, variant_id: variant?.id ?? null,
    }).select("id").single();
    if (!error && data) {
      await supabase.from("payments").insert({ booking_id: data.id, user_id: user.id, amount: total, status: "succeeded", provider_payment_id: `sim_${Date.now()}` });
    }
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Booking confirmed!");
    navigate("/dashboard");
  };

  if (!property) return <PageShell><div className="p-10 text-center text-muted-foreground">Loading property...</div></PageShell>;

  return (
    <PageShell>
      <section className="px-5 py-6 md:px-10">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <Button variant="ghost" className="rounded-full" onClick={() => navigate(-1)}><ArrowLeft /> Back</Button>

          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-foreground md:text-4xl">{property.title}</h1>
              <p className="text-sm text-muted-foreground"><Star className="inline h-4 w-4 fill-primary text-primary" /> {property.rating} · <MapPin className="inline h-4 w-4" /> {property.location}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="rounded-full"><Share2 /> Share</Button>
              <Button variant="ghost" className="rounded-full" onClick={() => setLiked((l) => !l)}><Heart className={liked ? "fill-primary text-primary" : ""} /> Save</Button>
            </div>
          </header>

          <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2">
            <img src={property.images[activeImg] ?? property.images[0]} alt={property.title} className="aspect-[4/3] w-full rounded-ajir object-cover md:col-span-2 md:row-span-2 md:aspect-auto md:h-full" />
            {property.images.slice(0, 4).map((src, i) => (
              <button type="button" key={src + i} onClick={() => setActiveImg(i)} className="hidden overflow-hidden rounded-ajir md:block">
                <img src={src} alt={`${property.title} ${i + 1}`} className="h-full w-full object-cover transition hover:scale-105" />
              </button>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black">About this place</h2>
                <p className="mt-2 text-muted-foreground">{property.distance}. Hosted with care for ajir travellers exploring authentic Algeria.</p>
              </div>
              {variants.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-black">Choose a variant</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {variants.map((v) => (
                      <button key={v.id} type="button" onClick={() => setSelVariant(v.id)} className={`rounded-ajir border p-4 text-left transition ${selVariant === v.id ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"}`}>
                        <div className="flex items-start justify-between gap-2"><strong>{v.name}</strong><Badge>{money(Number(v.price))}/night</Badge></div>
                        <p className="mt-1 text-sm text-muted-foreground">{v.description || "Comfortable variant"}</p>
                        <p className="mt-1 text-xs text-muted-foreground"><Users className="inline h-3 w-3" /> Up to {v.max_guests} · {v.bedrooms} BR · {v.beds} beds · {v.bathrooms} BA</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              <div>
                <h2 className="text-xl font-black">Where you'll be</h2>
                <p className="text-muted-foreground">{property.location} · lat {property.lat.toFixed(3)}, lng {property.lng.toFixed(3)}</p>
                <iframe title="map" className="mt-3 h-72 w-full rounded-ajir border border-border" src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.lng - 0.05}%2C${property.lat - 0.05}%2C${property.lng + 0.05}%2C${property.lat + 0.05}&marker=${property.lat}%2C${property.lng}`} />
              </div>
            </div>

            <Card className="sticky top-24 h-fit rounded-ajir border-border bg-card shadow-ajir-card">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-baseline justify-between"><span className="text-2xl font-black">{money(unitPrice)}</span><span className="text-sm text-muted-foreground">per night</span></div>
                <form onSubmit={reserve} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Check in</Label><Input type="date" value={booking.checkIn} onChange={(e) => setBooking({ ...booking, checkIn: e.target.value })} required /></div>
                    <div><Label>Check out</Label><Input type="date" value={booking.checkOut} onChange={(e) => setBooking({ ...booking, checkOut: e.target.value })} required /></div>
                  </div>
                  <div><Label>Guests</Label><Input type="number" min="1" max={variant?.max_guests ?? 10} value={booking.guests} onChange={(e) => setBooking({ ...booking, guests: e.target.value })} /></div>
                  <div><Label>Coupon</Label><Input placeholder="AJIR15" value={booking.coupon} onChange={(e) => setBooking({ ...booking, coupon: e.target.value })} /></div>
                  <div className="space-y-1 rounded-ajir bg-secondary p-3 text-sm">
                    <Row label={`${money(unitPrice)} × ${booking.checkIn && booking.checkOut ? nights(booking.checkIn, booking.checkOut) : 1} nights`} value={money(subtotal)} />
                    <Row label="Cleaning fee" value={money(cleaningFee)} />
                    <Row label="Service fee" value={money(serviceFee)} />
                    <Row label="Taxes" value={money(taxes)} />
                    {discount > 0 && <Row label="Coupon" value={`-${money(discount)}`} />}
                    {couponMsg && discount === 0 && <p className="text-xs text-destructive"><Tag className="inline h-3 w-3" /> {couponMsg}</p>}
                    <Separator className="my-1" />
                    <Row label={<strong>Total</strong>} value={<strong>{money(total)}</strong>} />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                    {submitting ? <Loader2 className="animate-spin" /> : <BedDouble />} Reserve
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

const Row = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>
);

export default PropertyDetail;
