import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Heart, Loader2, MapPin, Star, Tag } from "lucide-react";
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

type Service = Database["public"]["Tables"]["services"]["Row"];
type Order = Database["public"]["Tables"]["service_orders"]["Row"] & { services?: Pick<Service, "title" | "location"> | null };
type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

const fallbacks = [stayOne, stayTwo, stayThree];
const imageFor = (id: string) => fallbacks[Math.abs(id.charCodeAt(0) + id.charCodeAt(1)) % fallbacks.length];

const categories = [
  { id: "all", label: "All", emoji: "✦" },
  { id: "transport", label: "Transport", emoji: "🚗" },
  { id: "chef", label: "Chefs", emoji: "👨‍🍳" },
  { id: "guide", label: "Guides", emoji: "🧭" },
  { id: "photo", label: "Photography", emoji: "📸" },
];

const today = new Date().toISOString().slice(0, 10);
const money = (v: number | string) => `$${Number(v || 0).toFixed(2)}`;

const calc = (coupons: Coupon[], code: string, total: number) => {
  if (!code.trim()) return { discount: 0, final: total, message: "", coupon: null as Coupon | null };
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c?.is_active) return { discount: 0, final: total, message: "Coupon not found.", coupon: null };
  if (c.scope !== "all" && c.scope !== "services") return { discount: 0, final: total, message: `Only for ${c.scope}.`, coupon: c };
  const now = Date.now();
  if (new Date(c.starts_at).getTime() > now || (c.expires_at && new Date(c.expires_at).getTime() < now)) return { discount: 0, final: total, message: "Not valid.", coupon: c };
  if (total < Number(c.min_spend)) return { discount: 0, final: total, message: `Min spend ${money(c.min_spend)}.`, coupon: c };
  const d = Math.min(total, c.discount_type === "percent" ? total * Number(c.discount_value) / 100 : Number(c.discount_value));
  return { discount: d, final: total - d, message: `Discount: -${money(d)}`, coupon: c };
};

export const ServicesSection = () => {
  const { user } = useAjirAuth();
  const [items, setItems] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [active, setActive] = useState("all");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Service | null>(null);
  const [form, setForm] = useState({ date: today, time: "", quantity: "1", coupon: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const [s, c] = await Promise.all([
        supabase.from("services").select("*").eq("is_active", true).order("created_at"),
        supabase.from("coupons").select("*").eq("is_active", true),
      ]);
      if (s.data) setItems(s.data);
      if (c.data) setCoupons(c.data);
    })();
  }, []);

  const loadOrders = async () => {
    if (!user) return;
    const { data } = await supabase.from("service_orders").select("*, services(title, location)").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
  };
  useEffect(() => { void loadOrders(); }, [user]);

  const filtered = useMemo(() => active === "all" ? items : items.filter((s) => s.category === active), [items, active]);

  const total = selected ? Number(selected.price) * Number(form.quantity || 1) : 0;
  const disc = calc(coupons, form.coupon, total);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in.");
    if (!selected) return;
    if (form.coupon && disc.discount === 0) return toast.error(disc.message);
    setSubmitting(true);
    const { error } = await supabase.from("service_orders").insert({
      service_id: selected.id, user_id: user.id, service_date: form.date, service_time: form.time,
      quantity: Number(form.quantity), total_price: total, coupon_code: disc.coupon?.code ?? null,
      discount_amount: disc.discount, final_price: disc.final,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Service order created.");
    setSelected(null);
    setForm({ date: today, time: "", quantity: "1", coupon: "" });
    await loadOrders();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("service_orders").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    await loadOrders();
  };

  return (
    <section className="px-5 py-6 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-foreground md:text-3xl">Services</h1>
          <p className="text-sm text-muted-foreground">Algerian chefs, drivers, guides and photographers — booked in a few taps.</p>
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
          {filtered.map((s) => (
            <article key={s.id} className="group cursor-pointer animate-fade-up" onClick={() => { setSelected(s); setForm({ date: today, time: s.available_times?.[0] || "", quantity: "1", coupon: "" }); }}>
              <div className="relative mb-3 aspect-[1.05/1] overflow-hidden rounded-ajir bg-card shadow-ajir-card">
                <img src={imageFor(s.id)} alt={s.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                <span className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-xs font-bold capitalize text-card-foreground shadow-ajir-soft">{s.category}</span>
                <button type="button" onClick={(ev) => { ev.stopPropagation(); setLiked((st) => ({ ...st, [s.id]: !st[s.id] })); }} className="absolute right-3 top-3 rounded-full bg-card/90 p-2 text-primary shadow-ajir-soft transition hover:scale-110"><Heart className={liked[s.id] ? "h-5 w-5 fill-primary" : "h-5 w-5"} /></button>
              </div>
              <div className="space-y-0.5 text-sm">
                <h3 className="truncate font-bold text-foreground">{s.title}</h3>
                <p className="flex items-center gap-1 truncate text-muted-foreground"><MapPin className="h-3 w-3" /> {s.location}</p>
                <p className="pt-1 font-bold text-foreground">{money(s.price)} <span className="font-normal text-muted-foreground">starting</span></p>
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No services in this category yet.</p>}
        </div>

        {orders.length > 0 && (
          <div className="space-y-3 border-t border-border pt-8">
            <h2 className="text-xl font-black text-foreground">Your service orders</h2>
            <div className="grid gap-2">
              {orders.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm">
                  <div><strong>{o.services?.title ?? "Service"}</strong><p className="text-muted-foreground">{o.service_date} {o.service_time} · {money(o.final_price)}</p></div>
                  <div className="flex items-center gap-2"><Badge>{o.status}</Badge>{o.status !== "cancelled" && <Button size="sm" variant="outline" className="rounded-full" onClick={() => cancel(o.id)}>Cancel</Button>}</div>
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
                  <Badge variant="secondary" className="capitalize">{selected.category}</Badge>
                  <p className="flex items-center gap-1 text-foreground"><Star className="h-4 w-4 fill-primary text-primary" /> 4.9 · Verified Algerian provider</p>
                  <p className="pt-2 text-lg font-black text-foreground">{money(selected.price)} <span className="text-sm font-normal text-muted-foreground">starting</span></p>
                </div>
              </div>
              <form onSubmit={submit} className="grid gap-3 rounded-ajir border border-border p-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-2"><Label>Date</Label><Input type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Time</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>{(selected.available_times ?? []).map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div className="space-y-2"><Label>Qty</Label><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Coupon</Label><Input value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} placeholder="SERVICE10" /></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {disc.message || "Total"}</span><strong>{money(disc.final)}</strong></div>
                <Button type="submit" disabled={submitting} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">{submitting ? <Loader2 className="animate-spin" /> : <CalendarCheck />} Order service</Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
