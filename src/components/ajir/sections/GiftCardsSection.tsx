import { useEffect, useState } from "react";
import { CreditCard, Gift } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import type { Database } from "@/integrations/supabase/types";

type GiftCard = Database["public"]["Tables"]["gift_cards"]["Row"];
const money = (v: number | string) => `$${Number(v || 0).toFixed(2)}`;
const code = () => `AJIR-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

export const GiftCardsSection = () => {
  const { user } = useAjirAuth();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [form, setForm] = useState({ amount: "100", recipientEmail: "", recipientName: "", message: "Enjoy your Algeria trip with ajir." });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("gift_cards").select("*").eq("purchaser_id", user.id).order("created_at", { ascending: false });
    if (data) setCards(data);
  };
  useEffect(() => { void load(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in.");
    const amount = Number(form.amount);
    const { error } = await supabase.from("gift_cards").insert({
      purchaser_id: user.id, code: code(), amount, balance: amount,
      recipient_email: form.recipientEmail, recipient_name: form.recipientName || null, message: form.message, status: "sent",
    });
    if (error) return toast.error(error.message);
    toast.success("Gift card generated.");
    setForm({ amount: "100", recipientEmail: "", recipientName: "", message: "Enjoy your Algeria trip with ajir." });
    await load();
  };

  return (
    <section className="px-5 py-12 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground md:text-3xl">Gift cards</h1>
          <p className="text-sm text-muted-foreground">Send the gift of travel — pick an amount and we'll generate a unique code.</p>
        </div>
        <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Gift /> Buy a gift card</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={submit}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input type="number" min="25" step="25" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                <Input type="email" placeholder="Recipient email" value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} required />
                <Input placeholder="Recipient name" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
              </div>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={240} />
              <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"><CreditCard /> Buy gift card</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardHeader><CardTitle>Gift card history</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {cards.map((c) => (
              <div key={c.id} className="rounded-ajir bg-secondary p-3 text-sm">
                <div className="flex justify-between gap-2"><strong>{c.code}</strong><Badge>{c.status}</Badge></div>
                <p className="text-muted-foreground">To {c.recipient_email} · {money(c.amount)} · sent {new Date(c.sent_at).toLocaleDateString()}</p>
              </div>
            ))}
            {cards.length === 0 && <p className="text-sm text-muted-foreground">{user ? "No gift cards purchased yet." : "Log in to view your gift cards."}</p>}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
