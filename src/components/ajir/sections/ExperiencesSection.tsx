import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import type { Database } from "@/integrations/supabase/types";

type Experience = Database["public"]["Tables"]["experiences"]["Row"];
type ExperienceBooking = Database["public"]["Tables"]["experience_bookings"]["Row"] & { experiences?: Pick<Experience, "title" | "location"> | null };
type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

const today = new Date().toISOString().slice(0, 10);
const money = (v: number | string) => `$${Number(v || 0).toFixed(2)}`;

const calc = (coupons: Coupon[], code: string, total: number) => {
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!code.trim()) return { discount: 0, final: total, message: "", coupon: null };
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
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bookings, setBookings] = useState<ExperienceBooking[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ experienceId: "", date: today, guests: "1", coupon: "" });

  const selected = useMemo(() => experiences.find((e) => e.id === form.experienceId), [experiences, form.experienceId]);
  const total = selected ? Number(selected.price) * Number(form.guests || 1) : 0;
  const discount = calc(coupons, form.coupon, total);

  const load = async () => {
    const [e, c] = await Promise.all([
      supabase.from("experiences").select("*").eq("is_active", true).order("created_at"),
      supabase.from("coupons").select("*").eq("is_active", true),
    ]);
    if (e.data) {
      setExperiences(e.data);
      setForm((f) => ({ ...f, experienceId: f.experienceId || e.data[0]?.id || "", date: f.date || e.data[0]?.available_dates?.[0] || today }));
    }
    if (c.data) setCoupons(c.data);
  };
  const loadBookings = async () => {
    if (!user) return;
    const { data } = await supabase.from("experience_bookings").select("*, experiences(title, location)").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setBookings(data as ExperienceBooking[]);
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { void loadBookings(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in.");
    if (!selected) return;
    if (form.coupon && discount.discount === 0) return toast.error(discount.message);
    const { error } = await supabase.from("experience_bookings").insert({
      experience_id: selected.id, user_id: user.id, booking_date: form.date, guests: Number(form.guests),
      total_price: total, coupon_code: discount.coupon?.code ?? null, discount_amount: discount.discount, final_price: discount.final,
    });
    if (error) return toast.error(error.message);
    toast.success("Experience booked.");
    setForm({ ...form, coupon: "" });
    await loadBookings();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("experience_bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    await loadBookings();
  };

  return (
    <section className="px-5 py-12 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground md:text-3xl">Experiences in Algeria</h1>
          <p className="text-sm text-muted-foreground">Casbah food walks, desert camps, and more — pick a date and book.</p>
        </div>
        <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {experiences.map((item) => (
                <button key={item.id} type="button" onClick={() => setForm({ ...form, experienceId: item.id, date: item.available_dates[0] || today })} className={form.experienceId === item.id ? "rounded-ajir border border-ring bg-accent/20 p-4 text-left" : "rounded-ajir border border-border bg-secondary p-4 text-left hover:border-ring"}>
                  <div className="flex items-center justify-between gap-3">
                    <div><strong>{item.title}</strong><p className="text-sm text-muted-foreground">{item.location} · {item.duration_hours}h · up to {item.max_guests}</p></div>
                    <span className="font-black">{money(item.price)}</span>
                  </div>
                </button>
              ))}
            </div>
            <form className="grid gap-3 rounded-ajir border border-border p-4" onSubmit={submit}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2"><Label>Date</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}>{(selected?.available_dates ?? [today]).map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
                <div className="space-y-2"><Label>Guests</Label><Input type="number" min="1" max={selected?.max_guests ?? 12} value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} /></div>
                <div className="space-y-2"><Label>Coupon</Label><Input value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} placeholder="EXPERIENCE20" /></div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><span>{discount.message || "Discount calculated at checkout"}</span><strong>{money(discount.final)}</strong></div>
              <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><Clock /> Book experience</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardHeader><CardTitle>Your experience bookings</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {bookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm">
                <div><strong>{b.experiences?.title ?? "Experience"}</strong><p className="text-muted-foreground">{b.booking_date} · {b.guests} guests · {money(b.final_price)}</p></div>
                <div className="flex items-center gap-2"><Badge>{b.status}</Badge>{b.status !== "cancelled" && <Button size="sm" variant="outline" className="rounded-full" onClick={() => cancel(b.id)}>Cancel</Button>}</div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-sm text-muted-foreground">No experience bookings yet.</p>}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
