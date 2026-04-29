import { useEffect, useMemo, useState } from "react";
import { Bike, CalendarCheck, Clock, CreditCard, Gift, Home, MapPin, Plus, Sparkles, Tag, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import type { Database } from "@/integrations/supabase/types";
import { popularProperties, trendingProperties, type AjirProperty } from "@/data/ajir-properties";

const allProperties = [...popularProperties, ...trendingProperties];

type Service = Database["public"]["Tables"]["services"]["Row"];
type ServiceOrder = Database["public"]["Tables"]["service_orders"]["Row"] & { services?: Pick<Service, "title" | "location"> | null };
type Experience = Database["public"]["Tables"]["experiences"]["Row"];
type ExperienceBooking = Database["public"]["Tables"]["experience_bookings"]["Row"] & { experiences?: Pick<Experience, "title" | "location"> | null };
type Coupon = Database["public"]["Tables"]["coupons"]["Row"];
type GiftCard = Database["public"]["Tables"]["gift_cards"]["Row"];
type CouponScope = Database["public"]["Enums"]["coupon_scope"];
type DiscountType = Database["public"]["Enums"]["discount_type"];

const fallbackExperiences = [
  { icon: Utensils, title: "Algiers food walk", place: "Casbah & Bab El Oued", price: 38 },
  { icon: Bike, title: "Oran corniche ride", place: "Front de Mer to Santa Cruz", price: 44 },
  { icon: Sparkles, title: "Djanet stargazing camp", place: "Tassili n’Ajjer", price: 86 },
];

const codeForGiftCard = () => `AJIR-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
const money = (value: number | string) => `$${Number(value || 0).toFixed(2)}`;
const today = new Date().toISOString().slice(0, 10);

const calculateDiscount = (coupons: Coupon[], code: string, total: number, scope: CouponScope) => {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { coupon: null, discount: 0, final: total, message: "" };
  const coupon = coupons.find((item) => item.code.toUpperCase() === normalized);
  const now = Date.now();
  if (!coupon || !coupon.is_active) return { coupon: null, discount: 0, final: total, message: "Coupon not found." };
  if (new Date(coupon.starts_at).getTime() > now) return { coupon, discount: 0, final: total, message: "Coupon is not active yet." };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) return { coupon, discount: 0, final: total, message: "Coupon has expired." };
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return { coupon, discount: 0, final: total, message: "Coupon usage limit reached." };
  if (coupon.scope !== "all" && coupon.scope !== scope) return { coupon, discount: 0, final: total, message: `Coupon is only for ${coupon.scope}.` };
  if (total < Number(coupon.min_spend)) return { coupon, discount: 0, final: total, message: `Minimum spend is ${money(coupon.min_spend)}.` };
  const rawDiscount = coupon.discount_type === "percent" ? (total * Number(coupon.discount_value)) / 100 : Number(coupon.discount_value);
  const discount = Math.min(total, Math.max(0, rawDiscount));
  return { coupon, discount, final: total - discount, message: `Discount applied: -${money(discount)}` };
};

export const AjirFeatureHub = () => {
  const { user } = useAjirAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [experienceBookings, setExperienceBookings] = useState<ExperienceBooking[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [selectedMapProperty, setSelectedMapProperty] = useState<AjirProperty>(allProperties[0]);
  const [serviceForm, setServiceForm] = useState({ serviceId: "", date: today, time: "", quantity: "1", coupon: "" });
  const [experienceForm, setExperienceForm] = useState({ experienceId: "", date: "", guests: "1", coupon: "" });
  const [couponForm, setCouponForm] = useState({ code: "", title: "", discountType: "percent" as DiscountType, discountValue: "10", expiresAt: "", minSpend: "0", scope: "all" as CouponScope, maxUses: "" });
  const [giftForm, setGiftForm] = useState({ amount: "100", recipientEmail: "", recipientName: "", message: "Enjoy your Algeria trip with ajir." });

  const selectedService = useMemo(() => services.find((item) => item.id === serviceForm.serviceId), [services, serviceForm.serviceId]);
  const selectedExperience = useMemo(() => experiences.find((item) => item.id === experienceForm.experienceId), [experiences, experienceForm.experienceId]);
  const serviceTotal = selectedService ? Number(selectedService.price) * Number(serviceForm.quantity || 1) : 0;
  const serviceDiscount = calculateDiscount(coupons, serviceForm.coupon, serviceTotal, "services");
  const experienceTotal = selectedExperience ? Number(selectedExperience.price) * Number(experienceForm.guests || 1) : 0;
  const experienceDiscount = calculateDiscount(coupons, experienceForm.coupon, experienceTotal, "experiences");

  const requireUser = () => {
    if (user) return true;
    toast.error("Please log in to complete this ajir action.");
    return false;
  };

  const loadCatalogs = async () => {
    const [serviceResult, experienceResult, couponResult] = await Promise.all([
      supabase.from("services").select("*").eq("is_active", true).order("created_at", { ascending: true }),
      supabase.from("experiences").select("*").eq("is_active", true).order("created_at", { ascending: true }),
      supabase.from("coupons").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    if (serviceResult.data) {
      setServices(serviceResult.data);
      setServiceForm((current) => ({ ...current, serviceId: current.serviceId || serviceResult.data[0]?.id || "", time: current.time || serviceResult.data[0]?.available_times?.[0] || "" }));
    }
    if (experienceResult.data) {
      setExperiences(experienceResult.data);
      setExperienceForm((current) => ({ ...current, experienceId: current.experienceId || experienceResult.data[0]?.id || "", date: current.date || experienceResult.data[0]?.available_dates?.[0] || today }));
    }
    if (couponResult.data) setCoupons(couponResult.data);
  };

  const loadUserRecords = async () => {
    if (!user) return;
    const [orders, bookings, cards] = await Promise.all([
      supabase.from("service_orders").select("*, services(title, location)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("experience_bookings").select("*, experiences(title, location)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("gift_cards").select("*").eq("purchaser_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (orders.data) setServiceOrders(orders.data as ServiceOrder[]);
    if (bookings.data) setExperienceBookings(bookings.data as ExperienceBooking[]);
    if (cards.data) setGiftCards(cards.data);
  };

  useEffect(() => {
    void loadCatalogs();
  }, []);

  useEffect(() => {
    void loadUserRecords();
  }, [user]);

  const createServiceOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireUser() || !selectedService) return;
    if (serviceForm.coupon && serviceDiscount.discount === 0) return toast.error(serviceDiscount.message || "Coupon cannot be applied.");
    const { error } = await supabase.from("service_orders").insert({
      service_id: selectedService.id,
      user_id: user!.id,
      service_date: serviceForm.date,
      service_time: serviceForm.time,
      quantity: Number(serviceForm.quantity),
      total_price: serviceTotal,
      coupon_code: serviceDiscount.coupon?.code ?? null,
      discount_amount: serviceDiscount.discount,
      final_price: serviceDiscount.final,
    });
    if (error) return toast.error(error.message);
    toast.success("Service order created.");
    setServiceForm((current) => ({ ...current, coupon: "" }));
    await loadUserRecords();
  };

  const createExperienceBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireUser() || !selectedExperience) return;
    if (experienceForm.coupon && experienceDiscount.discount === 0) return toast.error(experienceDiscount.message || "Coupon cannot be applied.");
    const { error } = await supabase.from("experience_bookings").insert({
      experience_id: selectedExperience.id,
      user_id: user!.id,
      booking_date: experienceForm.date,
      guests: Number(experienceForm.guests),
      total_price: experienceTotal,
      coupon_code: experienceDiscount.coupon?.code ?? null,
      discount_amount: experienceDiscount.discount,
      final_price: experienceDiscount.final,
    });
    if (error) return toast.error(error.message);
    toast.success("Experience booking submitted.");
    setExperienceForm((current) => ({ ...current, coupon: "" }));
    await loadUserRecords();
  };

  const createCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireUser()) return;
    const { error } = await supabase.from("coupons").insert({
      code: couponForm.code.trim().toUpperCase(),
      title: couponForm.title,
      discount_type: couponForm.discountType,
      discount_value: Number(couponForm.discountValue),
      expires_at: couponForm.expiresAt ? new Date(couponForm.expiresAt).toISOString() : null,
      min_spend: Number(couponForm.minSpend),
      scope: couponForm.scope,
      max_uses: couponForm.maxUses ? Number(couponForm.maxUses) : null,
      created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Coupon created.");
    setCouponForm({ code: "", title: "", discountType: "percent", discountValue: "10", expiresAt: "", minSpend: "0", scope: "all", maxUses: "" });
    await loadCatalogs();
  };

  const createGiftCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireUser()) return;
    const amount = Number(giftForm.amount);
    const { error } = await supabase.from("gift_cards").insert({
      purchaser_id: user!.id,
      code: codeForGiftCard(),
      amount,
      balance: amount,
      recipient_email: giftForm.recipientEmail,
      recipient_name: giftForm.recipientName || null,
      message: giftForm.message,
      status: "sent",
    });
    if (error) return toast.error(error.message);
    toast.success("Gift card generated and recorded.");
    setGiftForm({ amount: "100", recipientEmail: "", recipientName: "", message: "Enjoy your Algeria trip with ajir." });
    await loadUserRecords();
  };

  const updateServiceOrderStatus = async (id: string, status: ServiceOrder["status"]) => {
    const { error } = await supabase.from("service_orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Service order ${status}.`);
    await loadUserRecords();
  };

  const updateExperienceStatus = async (id: string, status: ExperienceBooking["status"]) => {
    const { error } = await supabase.from("experience_bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Experience booking ${status}.`);
    await loadUserRecords();
  };

  const scrollToBooking = () => document.getElementById("host")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section id="ajir-features" className="border-y border-border bg-secondary px-5 py-12 md:px-10">
      <div className="mx-auto grid max-w-[1760px] gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div id="map" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-foreground md:text-3xl">Explore Algeria on the map</h2>
              <p className="text-sm text-muted-foreground">Click a price point to open a stay detail view with images, address, price, and booking action.</p>
            </div>
            <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={scrollToBooking}><MapPin /> Book selected stay</Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[420px] overflow-hidden rounded-ajir border border-border bg-card shadow-ajir-card">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent)/0.28),transparent_28%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)))]" />
              <div className="absolute left-[34%] top-[18%] h-[58%] w-[34%] rounded-[45%_55%_50%_45%] border-2 border-primary/25 bg-background/70 shadow-ajir-soft" />
              {allProperties.map((property) => (
                <button
                  key={property.id}
                  type="button"
                  className={property.id === selectedMapProperty.id ? "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-3 py-1.5 text-xs font-black text-accent-foreground shadow-ajir-float ring-2 ring-ring transition hover:scale-110" : "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-ajir-float transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"}
                  style={{ left: `${((property.lng + 8.7) / 20.7) * 100}%`, top: `${((37.2 - property.lat) / 13.2) * 100}%` }}
                  title={property.location}
                  onClick={() => setSelectedMapProperty(property)}
                >
                  ${property.price}
                </button>
              ))}
              <div className="absolute bottom-4 left-4 rounded-ajir bg-card/95 p-4 shadow-ajir-soft backdrop-blur">
                <strong className="block text-sm text-foreground">12 live Algeria destinations</strong>
                <span className="text-sm text-muted-foreground">Algiers, Oran, Constantine, Tipaza, Béjaïa, Djanet, and more.</span>
              </div>
            </div>
            <Card className="overflow-hidden rounded-ajir border-border bg-card shadow-ajir-card">
              <img src={selectedMapProperty.images[0]} alt={selectedMapProperty.title} className="aspect-[1.35/1] w-full object-cover" />
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="text-xl font-black text-foreground">{selectedMapProperty.title}</h3><p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {selectedMapProperty.location}</p></div>
                  <Badge>{selectedMapProperty.rating} ★</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {selectedMapProperty.images.map((image) => <img key={image} src={image} alt={`${selectedMapProperty.title} gallery`} className="aspect-square rounded-ajir object-cover" />)}
                </div>
                <div className="rounded-ajir bg-secondary p-4"><p className="text-sm text-muted-foreground">{selectedMapProperty.distance} · {selectedMapProperty.dates}</p><strong className="text-2xl text-foreground">${selectedMapProperty.price}</strong><span className="text-sm text-muted-foreground"> / night</span></div>
                <Button className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={scrollToBooking}><Home /> Reserve this stay</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-5">
          <Card id="offers" className="rounded-ajir border-border bg-card shadow-ajir-card">
            <CardHeader><CardTitle className="flex items-center gap-3 text-xl font-black"><span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground"><Tag className="h-5 w-5" /></span>Offers & discount codes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {coupons.map((coupon) => <div key={coupon.id} className="rounded-ajir bg-secondary p-4"><strong>{coupon.code}</strong><p className="text-sm text-muted-foreground">{coupon.title} · {coupon.discount_type === "percent" ? `${coupon.discount_value}%` : money(coupon.discount_value)} off · {coupon.scope}</p></div>)}
              </div>
              <form className="grid gap-3 rounded-ajir border border-border p-4" onSubmit={createCoupon}>
                <strong>Create coupon</strong>
                <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} required /><Input placeholder="Title" value={couponForm.title} onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })} required /></div>
                <div className="grid gap-3 sm:grid-cols-4"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as DiscountType })}><option value="percent">Percent</option><option value="fixed">Fixed</option></select><Input type="number" min="1" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} /><Input type="number" min="0" value={couponForm.minSpend} onChange={(e) => setCouponForm({ ...couponForm, minSpend: e.target.value })} placeholder="Min spend" /><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={couponForm.scope} onChange={(e) => setCouponForm({ ...couponForm, scope: e.target.value as CouponScope })}><option value="all">All</option><option value="stays">Stays</option><option value="services">Services</option><option value="experiences">Experiences</option></select></div>
                <div className="grid gap-3 sm:grid-cols-2"><Input type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} /><Input type="number" min="1" placeholder="Max uses" value={couponForm.maxUses} onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })} /></div>
                <Button className="rounded-full"><Plus /> Create coupon</Button>
              </form>
            </CardContent>
          </Card>

          <Card id="gift-cards" className="rounded-ajir border-border bg-card shadow-ajir-card">
            <CardHeader><CardTitle className="flex items-center gap-3 text-xl font-black"><Gift className="h-6 w-6 text-primary" /> Gift cards</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3" onSubmit={createGiftCard}>
                <div className="grid gap-3 sm:grid-cols-3"><Input type="number" min="25" step="25" value={giftForm.amount} onChange={(e) => setGiftForm({ ...giftForm, amount: e.target.value })} /><Input type="email" placeholder="Recipient email" value={giftForm.recipientEmail} onChange={(e) => setGiftForm({ ...giftForm, recipientEmail: e.target.value })} required /><Input placeholder="Recipient name" value={giftForm.recipientName} onChange={(e) => setGiftForm({ ...giftForm, recipientName: e.target.value })} /></div>
                <Textarea value={giftForm.message} onChange={(e) => setGiftForm({ ...giftForm, message: e.target.value })} maxLength={240} />
                <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"><CreditCard /> Buy gift card</Button>
              </form>
              <div className="grid gap-2">{giftCards.map((card) => <div key={card.id} className="rounded-ajir bg-secondary p-3 text-sm"><div className="flex justify-between gap-2"><strong>{card.code}</strong><Badge>{card.status}</Badge></div><p className="text-muted-foreground">To {card.recipient_email} · {money(card.amount)} · sent {new Date(card.sent_at).toLocaleDateString()}</p></div>)}{giftCards.length === 0 && <p className="text-sm text-muted-foreground">Purchased gift cards and send records will appear here.</p>}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-[1760px] gap-6 lg:grid-cols-2">
        <Card id="services" className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardHeader><CardTitle className="text-xl font-black">Services catalog</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">{services.map((service) => <button key={service.id} type="button" onClick={() => setServiceForm({ ...serviceForm, serviceId: service.id, time: service.available_times[0] || "" })} className={serviceForm.serviceId === service.id ? "rounded-ajir border border-ring bg-accent/20 p-4 text-left" : "rounded-ajir border border-border bg-secondary p-4 text-left hover:border-ring"}><strong>{service.title}</strong><p className="text-sm text-muted-foreground">{service.location}</p><p className="mt-2 font-black">{money(service.price)}</p></button>)}</div>
            <form className="grid gap-3 rounded-ajir border border-border p-4" onSubmit={createServiceOrder}>
              <div className="grid gap-3 sm:grid-cols-4"><div className="space-y-2"><Label>Date</Label><Input type="date" min={today} value={serviceForm.date} onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })} required /></div><div className="space-y-2"><Label>Time</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={serviceForm.time} onChange={(e) => setServiceForm({ ...serviceForm, time: e.target.value })}>{(selectedService?.available_times ?? []).map((time) => <option key={time} value={time}>{time}</option>)}</select></div><div className="space-y-2"><Label>Qty</Label><Input type="number" min="1" value={serviceForm.quantity} onChange={(e) => setServiceForm({ ...serviceForm, quantity: e.target.value })} /></div><div className="space-y-2"><Label>Coupon</Label><Input value={serviceForm.coupon} onChange={(e) => setServiceForm({ ...serviceForm, coupon: e.target.value })} placeholder="SERVICE10" /></div></div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><span>{serviceDiscount.message || "Discount calculated at checkout"}</span><strong>{money(serviceDiscount.final)}</strong></div>
              <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><CalendarCheck /> Order service</Button>
            </form>
            <RecordList items={serviceOrders.map((order) => ({ id: order.id, title: order.services?.title ?? "Service", meta: `${order.service_date} ${order.service_time} · ${money(order.final_price)}`, status: order.status }))} onCancel={(id) => updateServiceOrderStatus(id, "cancelled")} />
          </CardContent>
        </Card>

        <Card id="experiences" className="rounded-ajir border-border bg-card shadow-ajir-card">
          <CardHeader><CardTitle className="text-xl font-black">Experiences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">{(experiences.length ? experiences : []).map((item) => <button key={item.id} type="button" onClick={() => setExperienceForm({ ...experienceForm, experienceId: item.id, date: item.available_dates[0] || today })} className={experienceForm.experienceId === item.id ? "rounded-ajir border border-ring bg-accent/20 p-4 text-left" : "rounded-ajir border border-border bg-secondary p-4 text-left hover:border-ring"}><div className="flex items-center justify-between gap-3"><div><strong>{item.title}</strong><p className="text-sm text-muted-foreground">{item.location} · {item.duration_hours}h · up to {item.max_guests}</p></div><span className="font-black">{money(item.price)}</span></div></button>)}</div>
            {experiences.length === 0 && <div className="grid gap-3">{fallbackExperiences.map((item) => <div key={item.title} className="flex items-center justify-between gap-4 rounded-ajir bg-secondary p-4"><div className="flex items-center gap-3"><item.icon className="h-5 w-5 text-primary" /><div><strong>{item.title}</strong><p className="text-sm text-muted-foreground">{item.place}</p></div></div><span className="font-black text-foreground">${item.price}</span></div>)}</div>}
            <form className="grid gap-3 rounded-ajir border border-border p-4" onSubmit={createExperienceBooking}>
              <div className="grid gap-3 sm:grid-cols-3"><div className="space-y-2"><Label>Date</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={experienceForm.date} onChange={(e) => setExperienceForm({ ...experienceForm, date: e.target.value })}>{(selectedExperience?.available_dates ?? [today]).map((date) => <option key={date} value={date}>{date}</option>)}</select></div><div className="space-y-2"><Label>Guests</Label><Input type="number" min="1" max={selectedExperience?.max_guests ?? 12} value={experienceForm.guests} onChange={(e) => setExperienceForm({ ...experienceForm, guests: e.target.value })} /></div><div className="space-y-2"><Label>Coupon</Label><Input value={experienceForm.coupon} onChange={(e) => setExperienceForm({ ...experienceForm, coupon: e.target.value })} placeholder="EXPERIENCE20" /></div></div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><span>{experienceDiscount.message || "Discount calculated at checkout"}</span><strong>{money(experienceDiscount.final)}</strong></div>
              <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><Clock /> Book experience</Button>
            </form>
            <RecordList items={experienceBookings.map((booking) => ({ id: booking.id, title: booking.experiences?.title ?? "Experience", meta: `${booking.booking_date} · ${booking.guests} guests · ${money(booking.final_price)}`, status: booking.status }))} onCancel={(id) => updateExperienceStatus(id, "cancelled")} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

const RecordList = ({ items, onCancel }: { items: { id: string; title: string; meta: string; status: string }[]; onCancel: (id: string) => void }) => (
  <div className="grid gap-2">
    {items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-ajir bg-secondary p-3 text-sm"><div><strong>{item.title}</strong><p className="text-muted-foreground">{item.meta}</p></div><div className="flex items-center gap-2"><Badge>{item.status}</Badge>{item.status !== "cancelled" && <Button size="sm" variant="outline" className="rounded-full" onClick={() => onCancel(item.id)}>Cancel</Button>}</div></div>)}
    {items.length === 0 && <p className="text-sm text-muted-foreground">Your orders and status tracking will appear here.</p>}
  </div>
);
