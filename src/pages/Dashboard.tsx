import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, CreditCard, Gift, Heart, LogIn, LogOut, Plus, Star, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/ajir/PageShell";
import { AuthDialog } from "@/components/ajir/AuthDialog";
import { Icon3D } from "@/components/ajir/Icon3D";
import { ListingWizard } from "@/components/ajir/ListingWizard";
import { BillsPanel } from "@/components/ajir/owner/BillsPanel";
import { MarketplacePanel } from "@/components/ajir/owner/MarketplacePanel";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import { supabase } from "@/integrations/supabase/client";
import type { BookingRow, FavoriteRow, PaymentRow, PropertyRow } from "@/types/ajir";
import type { Database } from "@/integrations/supabase/types";
import stayOne from "@/assets/ajir-stays-1.jpg";

type Trip = BookingRow & { properties: Pick<PropertyRow, "title" | "city" | "country" | "host_id" | "images" | "price"> | null };
type FavoriteWithProperty = FavoriteRow & { properties: Pick<PropertyRow, "title" | "city" | "country" | "images" | "price"> | null };
type GiftCard = Database["public"]["Tables"]["gift_cards"]["Row"];
type ServiceOrder = Database["public"]["Tables"]["service_orders"]["Row"] & { services?: { title: string; location: string } | null };
type ExperienceBooking = Database["public"]["Tables"]["experience_bookings"]["Row"] & { experiences?: { title: string; location: string } | null };

type PropertyForm = { title: string; city: string; country: string; price: string; description: string; address: string; maxGuests: string; bedrooms: string; bathrooms: string; amenities: string; images: string };
const emptyForm: PropertyForm = { title: "", city: "Algiers", country: "Algeria", price: "120", description: "", address: "", maxGuests: "2", bedrooms: "1", bathrooms: "1", amenities: "WiFi, Pool, Kitchen", images: "" };
const money = (v: number | string) => `$${Number(v || 0).toFixed(2)}`;
const imageFor = (p?: { images?: string[] | null } | null) => p?.images?.[0] || stayOne;

const DashboardContent = () => {
  const { user, profile } = useAjirAuth();
  const [myProps, setMyProps] = useState<PropertyRow[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hostBookings, setHostBookings] = useState<Trip[]>([]);
  const [favorites, setFavorites] = useState<FavoriteWithProperty[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [experienceBookings, setExperienceBookings] = useState<ExperienceBooking[]>([]);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const [mine, gt, ht, fav, pay, gc, so, eb] = await Promise.all([
      supabase.from("properties").select("*").eq("host_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*, properties(title, city, country, host_id, images, price)").eq("guest_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*, properties(title, city, country, host_id, images, price)").order("created_at", { ascending: false }),
      supabase.from("favorites").select("*, properties(title, city, country, images, price)").eq("user_id", user.id),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("gift_cards").select("*").eq("purchaser_id", user.id).order("created_at", { ascending: false }),
      supabase.from("service_orders").select("*, services(title, location)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("experience_bookings").select("*, experiences(title, location)").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (mine.data) setMyProps(mine.data);
    if (gt.data) setTrips(gt.data as Trip[]);
    if (ht.data) setHostBookings((ht.data as Trip[]).filter((t) => t.properties?.host_id === user.id));
    if (fav.data) setFavorites(fav.data as FavoriteWithProperty[]);
    if (pay.data) setPayments(pay.data);
    if (gc.data) setGiftCards(gc.data);
    if (so.data) setServiceOrders(so.data as ServiceOrder[]);
    if (eb.data) setExperienceBookings(eb.data as ExperienceBooking[]);
  };

  useEffect(() => { void load(); }, [user]);

  const createProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("properties").insert({
      host_id: user.id, title: form.title, description: form.description || "A comfortable ajir stay in Algeria.",
      price: Number(form.price), property_type: "apartment", max_guests: Number(form.maxGuests),
      bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), address: form.address, city: form.city, country: form.country,
      amenities: form.amenities.split(",").map((x) => x.trim()).filter(Boolean),
      images: form.images.split("\n").map((x) => x.trim()).filter(Boolean), status: "draft",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Property created.");
    setForm(emptyForm);
    await load();
  };

  const setStatus = async (id: string, status: PropertyRow["status"]) => {
    const { error } = await supabase.from("properties").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Property ${status}.`);
    await load();
  };
  const removeProperty = async (id: string) => {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Property deleted.");
    await load();
  };
  const setBookingStatus = async (id: string, status: BookingRow["status"]) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    await load();
  };
  const removeFavorite = async (propertyId: string) => {
    const { error } = await supabase.from("favorites").delete().eq("property_id", propertyId).eq("user_id", user!.id);
    if (error) return toast.error(error.message);
    await load();
  };

  return (
    <section className="px-5 py-10 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground md:text-3xl">Welcome, {profile?.name ?? user?.email}</h1>
            <p className="text-sm text-muted-foreground">Manage your listings, trips, gift cards and more.</p>
          </div>
          <Badge variant="secondary">{user?.email}</Badge>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="h-auto flex-wrap justify-start rounded-ajir bg-secondary p-1">
            <TabsTrigger value="overview" className="rounded-ajir"><Home /> Overview</TabsTrigger>
            <TabsTrigger value="listings" className="rounded-ajir"><Plus /> Listings</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-ajir"><CalendarCheck /> Bookings</TabsTrigger>
            <TabsTrigger value="services" className="rounded-ajir"><Star /> Services & Experiences</TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-ajir"><Heart /> Wishlist</TabsTrigger>
            <TabsTrigger value="gift" className="rounded-ajir"><Gift /> Gift cards</TabsTrigger>
            <TabsTrigger value="payments" className="rounded-ajir"><CreditCard /> Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Listings" value={myProps.length} />
            <StatCard title="My trips" value={trips.length} />
            <StatCard title="Host requests" value={hostBookings.length} />
            <StatCard title="Gift cards" value={giftCards.length} />
            <StatCard title="Service orders" value={serviceOrders.length} />
            <StatCard title="Experiences booked" value={experienceBookings.length} />
            <StatCard title="Wishlist" value={favorites.length} />
            <StatCard title="Payments" value={payments.length} />
          </TabsContent>

          <TabsContent value="listings" className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="rounded-ajir border-border bg-card">
              <CardHeader><CardTitle>Create a new listing</CardTitle></CardHeader>
              <CardContent>
                <form className="grid gap-3" onSubmit={createProperty}>
                  <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                  <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div><div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div></div>
                  <div className="grid gap-3 sm:grid-cols-4"><div className="space-y-2"><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div><div className="space-y-2"><Label>Guests</Label><Input type="number" value={form.maxGuests} onChange={(e) => setForm({ ...form, maxGuests: e.target.value })} /></div><div className="space-y-2"><Label>Beds</Label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div><div className="space-y-2"><Label>Baths</Label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div></div>
                  <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Amenities (comma-separated)</Label><Input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Image URLs (one per line)</Label><Textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} /></div>
                  <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}><Plus /> Create draft</Button>
                </form>
              </CardContent>
            </Card>
            <div className="grid gap-3">
              {myProps.map((p) => (
                <Card key={p.id} className="rounded-ajir border-border bg-card">
                  <CardContent className="grid gap-3 p-4 sm:grid-cols-[140px_1fr]">
                    <img src={imageFor(p)} alt={p.title} className="aspect-[1.3/1] w-full rounded-ajir object-cover" />
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{p.title}</strong><p className="text-sm text-muted-foreground">{p.city}, {p.country} · {money(p.price)}/night</p></div><Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge></div>
                      <div className="flex flex-wrap gap-2"><Button size="sm" className="rounded-full" onClick={() => setStatus(p.id, "published")}><CheckCircle2 /> Publish</Button><Button size="sm" variant="secondary" className="rounded-full" onClick={() => setStatus(p.id, "archived")}><XCircle /> Archive</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => removeProperty(p.id)}><Trash2 /> Delete</Button></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {myProps.length === 0 && <Card className="rounded-ajir border-border bg-card"><CardContent className="p-6 text-muted-foreground">No listings yet.</CardContent></Card>}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6 grid gap-6 lg:grid-cols-2">
            <TripList title="My bookings" trips={trips} onStatus={setBookingStatus} />
            <TripList title="Host booking requests" trips={hostBookings} onStatus={setBookingStatus} host />
          </TabsContent>

          <TabsContent value="services" className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="rounded-ajir border-border bg-card"><CardHeader><CardTitle>Service orders</CardTitle></CardHeader><CardContent className="grid gap-2">
              {serviceOrders.map((o) => <div key={o.id} className="flex flex-wrap justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><div><strong>{o.services?.title ?? "Service"}</strong><p className="text-muted-foreground">{o.service_date} {o.service_time} · {money(o.final_price)}</p></div><Badge>{o.status}</Badge></div>)}
              {serviceOrders.length === 0 && <p className="text-sm text-muted-foreground">No service orders.</p>}
            </CardContent></Card>
            <Card className="rounded-ajir border-border bg-card"><CardHeader><CardTitle>Experience bookings</CardTitle></CardHeader><CardContent className="grid gap-2">
              {experienceBookings.map((b) => <div key={b.id} className="flex flex-wrap justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><div><strong>{b.experiences?.title ?? "Experience"}</strong><p className="text-muted-foreground">{b.booking_date} · {b.guests} guests · {money(b.final_price)}</p></div><Badge>{b.status}</Badge></div>)}
              {experienceBookings.length === 0 && <p className="text-sm text-muted-foreground">No experience bookings.</p>}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((f) => (
              <Card key={f.id} className="overflow-hidden rounded-ajir border-border bg-card">
                <img src={imageFor(f.properties)} alt={f.properties?.title ?? "Saved"} className="aspect-[1.4/1] w-full object-cover" />
                <CardContent className="p-4 space-y-2">
                  <strong>{f.properties?.title}</strong>
                  <p className="text-sm text-muted-foreground">{f.properties?.city}, {f.properties?.country}</p>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => removeFavorite(f.property_id)}><Trash2 /> Remove</Button>
                </CardContent>
              </Card>
            ))}
            {favorites.length === 0 && <Card className="rounded-ajir border-border bg-card"><CardContent className="p-6 text-muted-foreground">No saved homes yet.</CardContent></Card>}
          </TabsContent>

          <TabsContent value="gift" className="mt-6 grid gap-2">
            {giftCards.map((c) => (
              <Card key={c.id} className="rounded-ajir border-border bg-card"><CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div><strong>{c.code}</strong><p className="text-muted-foreground">To {c.recipient_email} · {money(c.amount)} · balance {money(c.balance)} · sent {new Date(c.sent_at).toLocaleDateString()}</p></div>
                <Badge>{c.status}</Badge>
              </CardContent></Card>
            ))}
            {giftCards.length === 0 && <Card className="rounded-ajir border-border bg-card"><CardContent className="p-6 text-muted-foreground">No gift cards yet.</CardContent></Card>}
          </TabsContent>

          <TabsContent value="payments" className="mt-6 grid gap-2">
            {payments.map((p) => (
              <Card key={p.id} className="rounded-ajir border-border bg-card"><CardContent className="flex justify-between p-4 text-sm">
                <span>{p.provider_payment_id ?? p.id}</span>
                <strong>{money(p.amount)} · {p.status}</strong>
              </CardContent></Card>
            ))}
            {payments.length === 0 && <Card className="rounded-ajir border-border bg-card"><CardContent className="p-6 text-muted-foreground">No payments yet.</CardContent></Card>}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

const StatCard = ({ title, value }: { title: string; value: number }) => (
  <Card className="rounded-ajir border-border bg-card"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><strong className="text-3xl text-foreground">{value}</strong></CardContent></Card>
);

const TripList = ({ title, trips, onStatus, host = false }: { title: string; trips: Trip[]; onStatus: (id: string, status: BookingRow["status"]) => void; host?: boolean }) => (
  <Card className="rounded-ajir border-border bg-card">
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {trips.map((t) => (
        <div key={t.id} className="grid gap-3 rounded-ajir bg-secondary p-3 sm:grid-cols-[120px_1fr]">
          <img src={imageFor(t.properties)} alt={t.properties?.title ?? "Booked"} className="aspect-[1.3/1] w-full rounded-ajir object-cover" />
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between gap-2"><strong>{t.properties?.title}</strong><Badge>{t.status}</Badge></div>
            <p className="text-sm text-muted-foreground">{t.check_in} → {t.check_out} · {t.guests} guests · {money(t.total_price)}</p>
            <div className="flex flex-wrap gap-2">
              {host && <Button size="sm" className="rounded-full" onClick={() => onStatus(t.id, "confirmed")}><CheckCircle2 /> Confirm</Button>}
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => onStatus(t.id, "cancelled")}><XCircle /> Cancel</Button>
            </div>
          </div>
        </div>
      ))}
      {trips.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, loading } = useAjirAuth();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => { if (!loading && !user) setAuthOpen(true); }, [loading, user]);

  return (
    <PageShell>
      {user ? <DashboardContent /> : (
        <section className="px-5 py-20 md:px-10">
          <div className="mx-auto max-w-xl space-y-4 text-center">
            <h1 className="text-2xl font-black text-foreground md:text-3xl">Sign in to access your dashboard</h1>
            <p className="text-muted-foreground">Manage listings, bookings, and gift cards from one place.</p>
            <Button className="rounded-full" onClick={() => setAuthOpen(true)}>Log in</Button>
          </div>
          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </section>
      )}
    </PageShell>
  );
};

export default Dashboard;
