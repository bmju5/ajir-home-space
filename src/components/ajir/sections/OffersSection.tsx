import { useEffect, useState } from "react";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import type { Database } from "@/integrations/supabase/types";

type Coupon = Database["public"]["Tables"]["coupons"]["Row"];
type CouponScope = Database["public"]["Enums"]["coupon_scope"];
type DiscountType = Database["public"]["Enums"]["discount_type"];
const money = (v: number | string) => `$${Number(v || 0).toFixed(2)}`;

export const OffersSection = () => {
  const { user } = useAjirAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ code: "", title: "", discountType: "percent" as DiscountType, discountValue: "10", expiresAt: "", minSpend: "0", scope: "all" as CouponScope, maxUses: "" });

  const load = async () => {
    const { data } = await supabase.from("coupons").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setCoupons(data);
  };
  useEffect(() => { void load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in.");
    const { error } = await supabase.from("coupons").insert({
      code: form.code.trim().toUpperCase(), title: form.title, discount_type: form.discountType,
      discount_value: Number(form.discountValue), expires_at: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      min_spend: Number(form.minSpend), scope: form.scope, max_uses: form.maxUses ? Number(form.maxUses) : null, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Coupon created.");
    setForm({ code: "", title: "", discountType: "percent", discountValue: "10", expiresAt: "", minSpend: "0", scope: "all", maxUses: "" });
    await load();
  };

  return (
    <section className="px-5 py-12 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground md:text-3xl">Offers & discount codes</h1>
          <p className="text-sm text-muted-foreground">Use discount codes at checkout, or create your own.</p>
        </div>
        <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Tag /> Active coupons</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map((c) => (
                <div key={c.id} className="rounded-ajir bg-secondary p-4">
                  <strong>{c.code}</strong>
                  <p className="text-sm text-muted-foreground">{c.title} · {c.discount_type === "percent" ? `${c.discount_value}%` : money(c.discount_value)} off · {c.scope}</p>
                  {c.expires_at && <p className="text-xs text-muted-foreground">Expires {new Date(c.expires_at).toLocaleDateString()}</p>}
                </div>
              ))}
              {coupons.length === 0 && <p className="text-sm text-muted-foreground">No active coupons.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardHeader><CardTitle>Create coupon</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={submit}>
              <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /><Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="grid gap-3 sm:grid-cols-4">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}><option value="percent">Percent</option><option value="fixed">Fixed</option></select>
                <Input type="number" min="1" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
                <Input type="number" min="0" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: e.target.value })} placeholder="Min spend" />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as CouponScope })}><option value="all">All</option><option value="stays">Stays</option><option value="services">Services</option><option value="experiences">Experiences</option></select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2"><Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /><Input type="number" min="1" placeholder="Max uses" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
              <Button className="rounded-full"><Plus /> Create coupon</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
