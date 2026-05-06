import { useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import type { Database } from "@/integrations/supabase/types";

type Service = Database["public"]["Tables"]["services"]["Row"];
type ServiceOrder = Database["public"]["Tables"]["service_orders"]["Row"] & { services?: Pick<Service, "title" | "location"> | null };
type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

const today = new Date().toISOString().slice(0, 10);
const money = (v: number | string) => `$${Number(v || 0).toFixed(2)}`;

const calc = (coupons: Coupon[], code: string, total: number) => {
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!code.trim()) return { discount: 0, final: total, message: "", coupon: null };
  if (!c?.is_active) return { discount: 0, final: total, message: "Coupon not found.", coupon: null };
  if (c.scope !== "all" && c.scope !== "services") return { discount: 0, final: total, message: `Coupon only for ${c.scope}.`, coupon: c };
  const now = Date.now();
  if (new Date(c.starts_at).getTime() > now || (c.expires_at && new Date(c.expires_at).getTime() < now)) return { discount: 0, final: total, message: "Coupon not valid.", coupon: c };
  if (total < Number(c.min_spend)) return { discount: 0, final: total, message: `Min spend ${money(c.min_spend)}.`, coupon: c };
  const d = Math.min(total, c.discount_type === "percent" ? total * Number(c.discount_value) / 100 : Number(c.discount_value));
  return { discount: d, final: total - d, message: `Discount: -${money(d)}`, coupon: c };
};

export const ServicesSection = () => {
  const { user } = useAjirAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ serviceId: "", date: today, time: "", quantity: "1", coupon: "" });

  const selected = useMemo(() => services.find((s) => s.id === form.serviceId), [services, form.serviceId]);
  const total = selected ? Number(selected.price) * Number(form.quantity || 1) : 0;
  const discount = calc(coupons, form.coupon, total);

  const load = async () => {
    const [s, c] = await Promise.all([
      supabase.from("services").select("*").eq("is_active", true).order("created_at"),
      supabase.from("coupons").select("*").eq("is_active", true),
    ]);
    if (s.data) {
      setServices(s.data);
      setForm((f) => ({ ...f, serviceId: f.serviceId || s.data[0]?.id || "", time: f.time || s.data[0]?.available_times?.[0] || "" }));
    }
    if (c.data) setCoupons(c.data);
  };
  const loadOrders = async () => {
    if (!user) return;
    const { data } = await supabase.from("service_orders").select("*, services(title, location)").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setOrders(data as ServiceOrder[]);
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { void loadOrders(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in.");
    if (!selected) return;
    if (form.coupon && discount.discount === 0) return toast.error(discount.message);
    const { error } = await supabase.from("service_orders").insert({
      service_id: selected.id, user_id: user.id, service_date: form.date, service_time: form.time,
      quantity: Number(form.quantity), total_price: total, coupon_code: discount.coupon?.code ?? null,
      discount_amount: discount.discount, final_price: discount.final,
    });
    if (error) return toast.error(error.message);
    toast.success("Service order created.");
    setForm({ ...form, coupon: "" });
    await loadOrders();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("service_orders").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order cancelled.");
    await loadOrders();
  };

  return (
    <section className="px-5 py-12 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground md:text-3xl">Services</h1>
          <p className="text-sm text-muted-foreground">Concierge, transport, dining — pick a service, time, and track your order.</p>
        </div>
        <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <button key={s.id} type="button" onClick={() => setForm({ ...form, serviceId: s.id, time: s.available_times[0] || "" })} className={form.serviceId === s.id ? "rounded-ajir border border-ring bg-accent/20 p-4 text-left" : "rounded-ajir border border-border bg-secondary p-4 text-left hover:border-ring"}>
                  <strong>{s.title}</strong>
                  <p className="text-sm text-muted-foreground">{s.location}</p>
                  <p className="mt-2 font-black">{money(s.price)}</p>
                </button>
              ))}
            </div>
            <form className="grid gap-3 rounded-ajir border border-border p-4" onSubmit={submit}>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Time</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>{(selected?.available_times ?? []).map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="space-y-2"><Label>Qty</Label><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div className="space-y-2"><Label>Coupon</Label><Input value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} placeholder="SERVICE10" /></div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><span>{discount.message || "Discount calculated at checkout"}</span><strong>{money(discount.final)}</strong></div>
              <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><CalendarCheck /> Order service</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardHeader><CardTitle>Your service orders</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm">
                <div><strong>{o.services?.title ?? "Service"}</strong><p className="text-muted-foreground">{o.service_date} {o.service_time} · {money(o.final_price)}</p></div>
                <div className="flex items-center gap-2"><Badge>{o.status}</Badge>{o.status !== "cancelled" && <Button size="sm" variant="outline" className="rounded-full" onClick={() => cancel(o.id)}>Cancel</Button>}</div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-muted-foreground">No service orders yet.</p>}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
