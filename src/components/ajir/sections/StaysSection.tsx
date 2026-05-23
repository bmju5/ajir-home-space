import { useEffect, useMemo, useState } from "react";
import { BedDouble, Heart, Loader2, MapPin, Settings2, Star, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import { popularProperties, trendingProperties, type AjirProperty } from "@/data/ajir-properties";
import type { Database } from "@/integrations/supabase/types";
import type { PropertyRow } from "@/types/ajir";
import stayOne from "@/assets/ajir-stays-1.jpg";

import { Icon3D, type Icon3DName } from "@/components/ajir/Icon3D";

type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

const categories: Array<{ id: string; label: string; icon: Icon3DName }> = [
  { id: "all", label: "All", icon: "home" },
  { id: "Algiers", label: "Algiers", icon: "city" },
  { id: "Oran", label: "Oran", icon: "beach" },
  { id: "Casbah", label: "Casbah", icon: "casbah" },
  { id: "Beach", label: "Beachfront", icon: "beach" },
  { id: "Desert", label: "Sahara", icon: "desert" },
  { id: "Mountain", label: "Mountains", icon: "mountain" },
  { id: "Heritage", label: "Heritage", icon: "heritage" },
  { id: "Bridge", label: "Bridges", icon: "bridge" },
  { id: "Oasis", label: "Oases", icon: "oasis" },
];

const matchCategory = (p: AjirProperty, cat: string) => {
  if (cat === "all") return true;
  const hay = `${p.title} ${p.location} ${p.distance} ${p.badge ?? ""}`.toLowerCase();
  return hay.includes(cat.toLowerCase());
};

const dbToAjir = (p: PropertyRow): AjirProperty => ({
  id: `db-${p.id}`,
  title: p.title,
  location: `${p.city}, ${p.country}`,
  distance: p.address || "Verified Algeria location",
  dates: "Available now",
  price: Number(p.price),
  rating: 4.9,
  images: (p.images && p.images.length ? p.images : [stayOne]),
  badge: p.status === "published" ? "Host listing" : undefined,
  lat: 36.7, lng: 3.05,
});

const nights = (a: string, b: string) => Math.max(1, Math.ceil((+new Date(b) - +new Date(a)) / 86400000));
const money = (v: number) => `$${v.toFixed(2)}`;
const applyCoupon = (coupons: Coupon[], code: string, total: number) => {
  if (!code.trim()) return { discount: 0, final: total, coupon: null as Coupon | null, message: "" };
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c?.is_active) return { discount: 0, final: total, coupon: null, message: "Coupon not found." };
  if (c.scope !== "all" && c.scope !== "stays") return { discount: 0, final: total, coupon: c, message: `Only for ${c.scope}.` };
  const now = Date.now();
  if (new Date(c.starts_at).getTime() > now || (c.expires_at && new Date(c.expires_at).getTime() < now)) return { discount: 0, final: total, coupon: c, message: "Not valid." };
  if (total < Number(c.min_spend)) return { discount: 0, final: total, coupon: c, message: `Min spend ${money(Number(c.min_spend))}.` };
  const d = Math.min(total, c.discount_type === "percent" ? total * Number(c.discount_value) / 100 : Number(c.discount_value));
  return { discount: d, final: total - d, coupon: c, message: `Discount: -${money(d)}` };
};

export const StaysSection = () => {
  const { user } = useAjirAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("all");
  const [dbProps, setDbProps] = useState<AjirProperty[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selected, setSelected] = useState<AjirProperty | null>(null);
  const [imgIdx, setImgIdx] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [booking, setBooking] = useState({ checkIn: "", checkOut: "", guests: "1", coupon: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const [p, c] = await Promise.all([
        supabase.from("properties").select("*").eq("status", "published").order("created_at", { ascending: false }),
        supabase.from("coupons").select("*").eq("is_active", true),
      ]);
      if (p.data) setDbProps(p.data.map(dbToAjir));
      if (c.data) setCoupons(c.data);
    })();
  }, []);

  const all = useMemo(() => [...dbProps, ...popularProperties, ...trendingProperties], [dbProps]);
  const filtered = all.filter((p) => matchCategory(p, active));

  const total = selected && booking.checkIn && booking.checkOut ? nights(booking.checkIn, booking.checkOut) * selected.price : selected?.price ?? 0;
  const disc = applyCoupon(coupons, booking.coupon, total);

  const reserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in to reserve.");
    if (!selected) return;
    if (booking.coupon && disc.discount === 0) return toast.error(disc.message);
    if (!selected.id.startsWith("db-")) return toast.success(`Demo: reserved ${selected.title} for ${money(disc.final)}. Host listings can be booked end-to-end.`);
    setSubmitting(true);
    const propertyId = selected.id.replace("db-", "");
    const { data, error } = await supabase.from("bookings").insert({
      property_id: propertyId, guest_id: user.id, check_in: booking.checkIn, check_out: booking.checkOut,
      guests: Number(booking.guests), total_price: disc.final,
    }).select("id").single();
    if (!error && data) await supabase.from("payments").insert({ booking_id: data.id, user_id: user.id, amount: disc.final, status: "succeeded", provider_payment_id: `sim_${Date.now()}` });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Reservation confirmed.");
    setSelected(null);
    setBooking({ checkIn: "", checkOut: "", guests: "1", coupon: "" });
  };

  return (
    <section className="px-5 py-6 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
          <div className="flex gap-7">
            {categories.map((c) => (
              <button key={c.id} type="button" onClick={() => setActive(c.id)} className={active === c.id ? "flex min-w-[64px] flex-col items-center gap-1 border-b-2 border-foreground pb-3 text-xs font-bold text-foreground" : "flex min-w-[64px] flex-col items-center gap-1 border-b-2 border-transparent pb-3 text-xs font-bold text-muted-foreground transition hover:border-border hover:text-foreground"}>
                <span className="text-2xl leading-none">{c.emoji}</span>
                <span className="whitespace-nowrap">{c.label}</span>
              </button>
            ))}
          </div>
          <Button variant="outline" className="hidden shrink-0 rounded-xl border-border md:inline-flex" onClick={() => navigate("/dashboard")}><Settings2 /> Filters</Button>
        </div>

        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((p) => {
            const idx = imgIdx[p.id] ?? 0;
            return (
              <article key={p.id} className="group cursor-pointer animate-fade-up" onClick={() => { setSelected(p); setBooking({ checkIn: "", checkOut: "", guests: "1", coupon: "" }); }}>
                <div className="relative mb-3 aspect-[1.05/1] overflow-hidden rounded-ajir bg-card shadow-ajir-card">
                  <img src={p.images[idx]} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  {p.badge && <span className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-xs font-bold text-card-foreground shadow-ajir-soft">{p.badge}</span>}
                  <button type="button" onClick={(e) => { e.stopPropagation(); setLiked((s) => ({ ...s, [p.id]: !s[p.id] })); }} className="absolute right-3 top-3 rounded-full bg-card/90 p-2 text-primary shadow-ajir-soft transition hover:scale-110"><Heart className={liked[p.id] ? "h-5 w-5 fill-primary" : "h-5 w-5"} /></button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {p.images.map((im, i) => (
                      <button key={im + i} type="button" onClick={(e) => { e.stopPropagation(); setImgIdx((s) => ({ ...s, [p.id]: i })); }} className={i === idx ? "h-1.5 w-1.5 rounded-full bg-card" : "h-1.5 w-1.5 rounded-full bg-card/60"} />
                    ))}
                  </div>
                </div>
                <div className="space-y-0.5 text-sm">
                  <div className="flex items-start justify-between gap-2"><h3 className="truncate font-bold text-foreground">{p.location}</h3><span className="flex items-center gap-1 text-foreground"><Star className="h-3.5 w-3.5 fill-primary text-primary" />{p.rating}</span></div>
                  <p className="truncate text-muted-foreground">{p.title}</p>
                  <p className="text-muted-foreground">{p.distance}</p>
                  <p className="text-muted-foreground">{p.dates}</p>
                  <p className="pt-1 font-bold text-foreground">${p.price} <span className="font-normal text-muted-foreground">night</span></p>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No stays match this category yet.</p>}
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/dashboard")}><BedDouble /> Manage your listings & trips</Button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="text-xl font-black">{selected.title}</DialogTitle></DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <img src={selected.images[0]} alt={selected.title} className="aspect-square w-full rounded-ajir object-cover" />
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> {selected.location}</p>
                  <p className="text-muted-foreground">{selected.distance}</p>
                  <p className="flex items-center gap-1 text-foreground"><Star className="h-4 w-4 fill-primary text-primary" /> {selected.rating} · {selected.dates}</p>
                  {selected.badge && <Badge variant="secondary">{selected.badge}</Badge>}
                  <p className="pt-2 text-lg font-black text-foreground">${selected.price} <span className="text-sm font-normal text-muted-foreground">night</span></p>
                </div>
              </div>
              <form onSubmit={reserve} className="grid gap-3 rounded-ajir border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Check in</Label><Input type="date" value={booking.checkIn} onChange={(e) => setBooking({ ...booking, checkIn: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Check out</Label><Input type="date" value={booking.checkOut} onChange={(e) => setBooking({ ...booking, checkOut: e.target.value })} required /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Guests</Label><Input type="number" min="1" value={booking.guests} onChange={(e) => setBooking({ ...booking, guests: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Coupon</Label><Input value={booking.coupon} onChange={(e) => setBooking({ ...booking, coupon: e.target.value })} placeholder="AJIR15" /></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {disc.message || "Total"}</span><strong>{money(disc.final)}</strong></div>
                <Button type="submit" disabled={submitting} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">{submitting ? <Loader2 className="animate-spin" /> : <BedDouble />} Reserve</Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
