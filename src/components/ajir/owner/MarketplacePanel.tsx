import { useEffect, useState } from "react";
import { Check, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon3D, type Icon3DName } from "@/components/ajir/Icon3D";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import type { Database } from "@/integrations/supabase/types";

type Bundle = Database["public"]["Tables"]["ajir_bundles"]["Row"];
type Purchase = Database["public"]["Tables"]["bundle_purchases"]["Row"] & { bundle?: { title: string; category: string } | null };
type Sub = Database["public"]["Tables"]["owner_subscriptions"]["Row"];

const money = (v: number) => `$${Number(v || 0).toFixed(2)}`;

const iconFor = (cat: string): Icon3DName => {
  if (cat === "security") return "security";
  if (cat === "cleaning" || cat === "laundry" || cat === "pool") return "cleaning";
  if (cat === "smart_home") return "bundle";
  if (cat === "welcome") return "gift";
  return "bundle";
};

export const MarketplacePanel = () => {
  const { user } = useAjirAuth();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ scheduled_for: "", notes: "" });

  const load = async () => {
    if (!user) return;
    const [b, p, s] = await Promise.all([
      supabase.from("ajir_bundles").select("*").eq("is_active", true).order("price"),
      supabase.from("bundle_purchases").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("owner_subscriptions").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (b.data) setBundles(b.data);
    if (p.data) {
      const byId = new Map((b.data ?? []).map((x) => [x.id, x]));
      setPurchases(p.data.map((row) => ({ ...row, bundle: byId.get(row.bundle_id) ? { title: byId.get(row.bundle_id)!.title, category: byId.get(row.bundle_id)!.category } : null })) as Purchase[]);
    }
    if (s.data) setSubs(s.data);
  };
  useEffect(() => { void load(); }, [user]);

  const buy = async () => {
    if (!user || !selected) return;
    setBusy(true);
    if (selected.billing === "one_time" || selected.billing === "per_booking") {
      await supabase.from("bundle_purchases").insert({
        owner_id: user.id, bundle_id: selected.id, price_paid: Number(selected.price),
        scheduled_for: form.scheduled_for || null, notes: form.notes,
      });
      toast.success("Purchase confirmed!");
    } else {
      await supabase.from("owner_subscriptions").insert({
        owner_id: user.id, service_name: selected.title, service_category: selected.category,
        frequency: selected.billing, price: Number(selected.price),
        next_visit: form.scheduled_for || null,
      });
      toast.success("Subscription activated!");
    }
    setBusy(false);
    setSelected(null);
    setForm({ scheduled_for: "", notes: "" });
    void load();
  };

  const cancelSub = async (id: string) => {
    await supabase.from("owner_subscriptions").update({ status: "cancelled" }).eq("id", id);
    void load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><Icon3D name="bundle" size={32} /> Ajir marketplace for hosts</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((b) => (
            <Card key={b.id} className="overflow-hidden rounded-ajir border-border bg-card transition hover:shadow-ajir-card">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Icon3D name={iconFor(b.category)} size={64} />
                  <div className="flex-1">
                    <strong className="block">{b.title}</strong>
                    <Badge variant="secondary" className="mt-1 capitalize">{b.category.replace("_", " ")}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{b.description}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {b.features.map((f) => <li key={f}><Check className="mr-1 inline h-3 w-3 text-primary" /> {f}</li>)}
                </ul>
                <div className="mt-3 flex items-center justify-between">
                  <strong className="text-xl">{money(Number(b.price))}<span className="text-xs font-normal text-muted-foreground"> · {b.billing.replace("_"," ")}</span></strong>
                  <Button size="sm" onClick={() => setSelected(b)} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><ShoppingBag /> Get</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-ajir border-border bg-card">
          <CardHeader><CardTitle>My subscriptions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm">
                <div><strong>{s.service_name}</strong><p className="text-muted-foreground">{s.frequency} · {money(Number(s.price))} · next: {s.next_visit ?? "TBD"}</p></div>
                <div className="flex items-center gap-2"><Badge>{s.status}</Badge>{s.status === "active" && <Button size="sm" variant="ghost" onClick={() => cancelSub(s.id)}><Trash2 /></Button>}</div>
              </div>
            ))}
            {subs.length === 0 && <p className="text-sm text-muted-foreground">No active subscriptions.</p>}
          </CardContent>
        </Card>
        <Card className="rounded-ajir border-border bg-card">
          <CardHeader><CardTitle>Bundle purchases</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {purchases.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm">
                <div><strong>{p.bundle?.title ?? "Bundle"}</strong><p className="text-muted-foreground">{money(Number(p.price_paid))} · {p.scheduled_for ?? "anytime"}</p></div>
                <Badge>{p.status}</Badge>
              </div>
            ))}
            {purchases.length === 0 && <p className="text-sm text-muted-foreground">No purchases yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Icon3D name={iconFor(selected.category)} size={40} /> {selected.title}</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <div className="space-y-3">
                <div><Label>Preferred date</Label><Input type="date" value={form.scheduled_for} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} /></div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <div className="rounded-ajir bg-secondary p-3 text-sm"><div className="flex justify-between"><span>Total</span><strong>{money(Number(selected.price))} · {selected.billing.replace("_"," ")}</strong></div></div>
                <Button disabled={busy} onClick={buy} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {busy ? <Loader2 className="animate-spin" /> : <ShoppingBag />} {selected.billing === "one_time" || selected.billing === "per_booking" ? "Confirm purchase" : "Start subscription"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
