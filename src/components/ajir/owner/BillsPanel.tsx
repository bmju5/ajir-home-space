import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import type { Database } from "@/integrations/supabase/types";
import { Icon3D } from "@/components/ajir/Icon3D";

type Bill = Database["public"]["Tables"]["utility_bills"]["Row"];

const kinds: Array<{ value: Bill["kind"]; label: string; icon: "electricity" | "bill" }> = [
  { value: "electricity", label: "Electricity", icon: "electricity" },
  { value: "water", label: "Water", icon: "bill" },
  { value: "gas", label: "Gas", icon: "bill" },
  { value: "internet", label: "Internet", icon: "bill" },
  { value: "other", label: "Other", icon: "bill" },
];

const money = (v: number) => `$${Number(v || 0).toFixed(2)}`;

export const BillsPanel = () => {
  const { user } = useAjirAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [form, setForm] = useState({ kind: "electricity" as Bill["kind"], provider: "Sonelgaz", period_label: "", amount: "", due_date: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("utility_bills").select("*").eq("owner_id", user.id).order("due_date", { ascending: false });
    if (data) setBills(data);
  };
  useEffect(() => { void load(); }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.amount || !form.due_date) return toast.error("Amount and due date required.");
    setBusy(true);
    const { error } = await supabase.from("utility_bills").insert({
      owner_id: user.id, kind: form.kind, provider: form.provider,
      period_label: form.period_label || new Date().toLocaleString("en", { month: "long", year: "numeric" }),
      amount: Number(form.amount), due_date: form.due_date,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bill saved.");
    setForm({ ...form, amount: "", period_label: "" });
    void load();
  };

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("utility_bills").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("utility_bills").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  const totalDue = bills.filter((b) => b.status !== "paid").reduce((s, b) => s + Number(b.amount), 0);
  const totalPaid = bills.filter((b) => b.status === "paid").reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card className="rounded-ajir border-border bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Icon3D name="electricity" size={36} /> Add a bill</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-3">
            <div><Label>Kind</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Bill["kind"] })}>
                {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <div><Label>Provider</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
            <div><Label>Period</Label><Input placeholder="May 2026" value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Amount (USD)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required /></div>
            </div>
            <Button disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">{busy ? <Loader2 className="animate-spin" /> : <Plus />} Save bill</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-ajir border-border bg-card"><CardContent className="flex items-center gap-3 p-4"><Icon3D name="bill" size={48} /><div><p className="text-xs text-muted-foreground">Total due</p><strong className="text-2xl">{money(totalDue)}</strong></div></CardContent></Card>
          <Card className="rounded-ajir border-border bg-card"><CardContent className="flex items-center gap-3 p-4"><Icon3D name="electricity" size={48} /><div><p className="text-xs text-muted-foreground">Total paid</p><strong className="text-2xl">{money(totalPaid)}</strong></div></CardContent></Card>
        </div>
        <div className="space-y-2">
          {bills.map((b) => (
            <Card key={b.id} className="rounded-ajir border-border bg-card">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div className="flex items-center gap-3">
                  <Icon3D name={b.kind === "electricity" ? "electricity" : "bill"} size={40} />
                  <div>
                    <strong className="capitalize">{b.kind} · {b.provider}</strong>
                    <p className="text-muted-foreground">{b.period_label} · due {b.due_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <strong>{money(Number(b.amount))}</strong>
                  <Badge variant={b.status === "paid" ? "default" : "secondary"}>{b.status}</Badge>
                  {b.status !== "paid" && <Button size="sm" variant="outline" className="rounded-full" onClick={() => markPaid(b.id)}><CheckCircle2 /> Pay</Button>}
                  <Button size="sm" variant="ghost" onClick={() => remove(b.id)}><Trash2 /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {bills.length === 0 && <Card className="rounded-ajir border-border bg-card"><CardContent className="p-6 text-sm text-muted-foreground">No bills yet — add electricity, water, gas or internet bills to track them here.</CardContent></Card>}
        </div>
      </div>
    </div>
  );
};
