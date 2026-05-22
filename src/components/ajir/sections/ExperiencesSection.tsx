import { useEffect, useMemo, useState } from "react";
import { Clock, Heart, Loader2, MapPin, Star, Tag, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import type { Database } from "@/integrations/supabase/types";
import stayOne from "@/assets/ajir-stays-1.jpg";
import stayTwo from "@/assets/ajir-stays-2.jpg";
import stayThree from "@/assets/ajir-stays-3.jpg";

type Experience = Database["public"]["Tables"]["experiences"]["Row"];
type Booking = Database["public"]["Tables"]["experience_bookings"]["Row"] & { experiences?: Pick<Experience, "title" | "location"> | null };
type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

const fallbacks = [stayOne, stayTwo, stayThree];
const imageFor = (id: string) => fallbacks[Math.abs(id.charCodeAt(0) + id.charCodeAt(1)) % fallbacks.length];

const categories = [
  { id: "all", label: "All", emoji: "✦" },
  { id: "food", label: "Food walks", emoji: "🥖", match: ["food", "casbah"] },
  { id: "history", label: "History", emoji: "🏛️", match: ["roman", "constantine", "bridge"] },
  { id: "desert", label: "Desert", emoji: "🌌", match: ["desert", "djanet", "tassili", "stargazing"] },
  { id: "coast", label: "Coast", emoji: "🌊", match: ["coast", "tipaza", "oran"] },
];

const today = new Date().toISOString().slice(0, 10);
const money = (v: number | string) => `$${Number(v || 0).toFixed(2)}`;

const calc = (coupons: Coupon[], code: string, total: number) => {
  if (!code.trim()) return { discount: 0, final: total, message: "", coupon: null as Coupon | null };
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c?.is_active) return { discount: 0, final: total, message: "Coupon not found.", coupon: null };
  if (c.scope !== "all" && c.scope !== "experiences") return { discount: 0, final: total, message: `Only for ${c.scope}.`, coupon: c };
  const now = Date.now();
  if (new Date(c.starts_at).getTime() > now || (c.expires_at && new Date(c.expires_at).getTime() < now)) return { discount: 0, final: total, message: "Not valid.", coupon: c };
  if (total < Number(c.min_spend)) return { discount: 0, final: total, message: `Min spend ${money(c.min_spend)}.`, coupon: c };
  const d = Math.min(total, c.discount_type === "percent" ? total * Number(c.discount_value) / 100 : Number(c.discount_value));
  return { discount: d, final: total - d, message: `Discount: -${money(d)}`, coupon: c };
};

export const ExperiencesSection = () => {
  const { user } = useAjirAuth();
  const [items, setItems] = useState<Experience[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [active, setActive] = useState("all");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Experience | null>(null);
  const [form, setForm] = useState({ date: today, guests: "1", coupon: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const [e, c] = await Promise.all([
        supabase.from("experiences").select("*").eq("is_active", true).order("created_at"),
        supabase.from("coupons").select("*").eq("is_active", true),
      ]);
      if (e.data) setItems(e.data);
      if (c.data) setCoupons(c.data);
    })();
  }, []);

  const loadBookings = async () => {
    if (!user) return;
    const { data } = await supabase.from("experience_bookings").select("*, experiences(title, location)").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setBookings(data as Booking[]);
  };
  useEffect(() => { void loadBookings(); }, [user]);

  const filtered = useMemo(() => {
    if (active === "all") return items;
    const cat = categories.find((c) => c.id === active);
    if (!cat?.match) return items;
    return items.filter((e) => cat.match!.some((m) => `${e.title} ${e.location}`.toLowerCase().includes(m)));
  }, [items, active]);

  const total = selected ? Number(selected.price) * Number(form.guests || 1) : 0;
  const disc = calc(coupons, form.coupon, total);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in.");
    if (!selected) return;
    if (form.coupon && disc.discount === 0) return toast.error(disc.message);
    setSubmitting(true);
    const { error } = await supabase.from("experience_bookings").insert({
      experience_id: selected.id, user_id: user.id, booking_date: form.date, guests: Number(form.guests),
      total_price: total, coupon_code: disc.coupon?.code ?? null, discount_amount: disc.discount, final_price: disc.final,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Experience booked.");
    setSelected(null);
    setForm({ date: today, guests: "1", coupon: "" });
    await loadBookings();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("experience_bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    await loadBookings();
  };

  return (
    <section className="px-5 py-6 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-foreground md:text-3xl">Experiences</h1>
          <p className="text-sm text-muted-foreground">Casbah food walks, Roman coast days, Sahara nights — led by Algerian hosts.</p>
        </div>

        <div className="flex gap-7 overflow-x-auto border-b border-border pb-1">
          {categories.map((c) => (
            <button key={c.id} type="button" onClick={() => setActive(c.id)} className={active === c.id ? "flex min-w-[80px] flex-col items-center gap-1 border-b-2 border-foreground pb-3 text-xs font-bold text-foreground" : "flex min-w-[80px] flex-col items-center gap-1 border-b-2 border-transparent pb-3 text-xs font-bold text-muted-foreground transition hover:text-foreground"}>
              <span className="text-2xl leading-none">{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e) => (
            <article key={e.id} className="group cursor-pointer animate-fade-up" onClick={() => { setSelected(e); setForm({ date: e.available_dates[0] || today, guests: "1", coupon: "" }); }}>
              <div className="relative mb-3 aspect-[1.05/1] overflow-hidden rounded-ajir bg-card shadow-ajir-card">
                <img src={imageFor(e.id)} alt={e.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                <span className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-xs font-bold text-card-foreground shadow-ajir-soft">Original</span>
                <button type="button" onClick={(ev) => { ev.stopPropagation(); setLiked((s) => ({ ...s, [e.id]: !s[e.id] })); }} className="absolute right-3 top-3 rounded-full bg-card/90 p-2 text-primary shadow-ajir-soft transition hover:scale-110"><Heart className={liked[e.id] ? "h-5 w-5 fill-primary" : "h-5 w-5"} /></button>
              </div>
              <div className="space-y-0.5 text-sm">
                <h3 className="truncate font-bold text-foreground">{e.title}</h3>
                <p className="flex items-center gap-1 truncate text-muted-foreground"><MapPin className="h-3 w-3" /> {e.location}</p>
                <p className="text-muted-foreground">{e.duration_hours}h · up to {e.max_guests} guests</p>
                <p className="pt-1 font-bold text-foreground">{money(e.price)} <span className="font-normal text-muted-foreground">/ person</span></p>
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No experiences yet.</p>}
        </div>

        {bookings.length > 0 && (
          <div className="space-y-3 border-t border-border pt-8">
            <h2 className="text-xl font-black text-foreground">Your experience bookings</h2>
            <div className="grid gap-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm">
                  <div><strong>{b.experiences?.title ?? "Experience"}</strong><p className="text-muted-foreground">{b.booking_date} · {b.guests} guests · {money(b.final_price)}</p></div>
                  <div className="flex items-center gap-2"><Badge>{b.status}</Badge>{b.status !== "cancelled" && <Button size="sm" variant="outline" className="rounded-full" onClick={() => cancel(b.id)}>Cancel</Button>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="text-xl font-black">{selected.title}</DialogTitle></DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <img src={imageFor(selected.id)} alt={selected.title} className="aspect-square w-full rounded-ajir object-cover" />
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> {selected.location}</p>
                  <p className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" /> {selected.duration_hours} hours</p>
                  <p className="flex items-center gap-1 text-muted-foreground"><Users className="h-4 w-4" /> up to {selected.max_guests} guests</p>
                  <p className="flex items-center gap-1 text-foreground"><Star className="h-4 w-4 fill-primary text-primary" /> 4.9 · Hosted in Algeria</p>
                  <p className="pt-2 text-lg font-black text-foreground">{money(selected.price)} <span className="text-sm font-normal text-muted-foreground">/ person</span></p>
                </div>
              </div>
              <form onSubmit={submit} className="grid gap-3 rounded-ajir border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2"><Label>Date</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}>{(selected.available_dates ?? [today]).map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
                  <div className="space-y-2"><Label>Guests</Label><Input type="number" min="1" max={selected.max_guests} value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Coupon</Label><Input value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} placeholder="EXPERIENCE20" /></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {disc.message || "Total"}</span><strong>{money(disc.final)}</strong></div>
                <Button type="submit" disabled={submitting} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">{submitting ? <Loader2 className="animate-spin" /> : <Clock />} Book experience</Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
