import { useState } from "react";
import { Chrome, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type AuthDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const redirectTo = window.location.origin;
    const result = mode === "signup"
      ? await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { emailRedirectTo: redirectTo, data: { name: form.name } },
        })
      : await supabase.auth.signInWithPassword({ email: form.email, password: form.password });

    setLoading(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success(mode === "signup" ? "Check your email to confirm your ajir account." : "Welcome back to ajir.");
    if (mode === "login") onOpenChange(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    setLoading(false);
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-ajir border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-foreground">{mode === "login" ? "Log in to ajir" : "Create your ajir account"}</DialogTitle>
          <DialogDescription>Book stays, save favorites, host homes, and manage trips.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <Button type="submit" className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Mail />}
            {mode === "login" ? "Log in" : "Sign up"}
          </Button>
        </form>
        <Button type="button" variant="outline" className="rounded-full" onClick={signInWithGoogle} disabled={loading}>
          <Chrome /> Continue with Google
        </Button>
        <button type="button" className="text-sm font-bold text-primary hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "New to ajir? Create an account" : "Already have an account? Log in"}
        </button>
      </DialogContent>
    </Dialog>
  );
};
