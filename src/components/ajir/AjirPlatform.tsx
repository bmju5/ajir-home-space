import { useEffect, useMemo, useState } from "react";
import { BedDouble, CalendarCheck, CheckCircle2, Heart, Home, Loader2, MapPin, Plus, Star, Tag, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";
import type { Database } from "@/integrations/supabase/types";
import type { BookingRow, FavoriteRow, PaymentRow, PropertyRow, ReviewRow } from "@/types/ajir";
import stayOne from "@/assets/ajir-stays-1.jpg";
import stayTwo from "@/assets/ajir-stays-2.jpg";
import stayThree from "@/assets/ajir-stays-3.jpg";

const fallbackImages = [stayOne, stayTwo, stayThree];

type Trip = BookingRow & { properties: Pick<PropertyRow, "title" | "city" | "country" | "host_id" | "images" | "price"> | null };
type FavoriteWithProperty = FavoriteRow & { properties: Pick<PropertyRow, "title" | "city" | "country" | "images" | "price"> | null };
type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

type PropertyForm = {
  title: string;
  city: string;
  country: string;
  price: string;
  description: string;
  address: string;
  maxGuests: string;
  bedrooms: string;
  bathrooms: string;
  amenities: string;
  images: string;
};

const emptyForm: PropertyForm = {
  title: "",
  city: "Algiers",
  country: "Algeria",
  price: "120",
  description: "",
  address: "",
  maxGuests: "2",
  bedrooms: "1",
  bathrooms: "1",
  amenities: "WiFi, Pool, Kitchen",
  images: "",
};

const toImageList = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const nightsBetween = (start: string, end: string) => Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
const applyStayCoupon = (coupons: Coupon[], code: string, total: number) => {
  const coupon = coupons.find((item) => item.code.toUpperCase() === code.trim().toUpperCase());
  const now = Date.now();
  if (!code.trim()) return { discount: 0, final: total, coupon: null as Coupon | null, message: "" };
  if (!coupon || !coupon.is_active) return { discount: 0, final: total, coupon: null as Coupon | null, message: "Coupon not found." };
  if (coupon.scope !== "all" && coupon.scope !== "stays") return { discount: 0, final: total, coupon, message: `Coupon is only for ${coupon.scope}.` };
  if (new Date(coupon.starts_at).getTime() > now || (coupon.expires_at && new Date(coupon.expires_at).getTime() < now)) return { discount: 0, final: total, coupon, message: "Coupon is not currently valid." };
  if (total < Number(coupon.min_spend)) return { discount: 0, final: total, coupon, message: `Minimum spend is $${Number(coupon.min_spend).toFixed(0)}.` };
  const discount = Math.min(total, coupon.discount_type === "percent" ? total * Number(coupon.discount_value) / 100 : Number(coupon.discount_value));
  return { discount, final: total - discount, coupon, message: `Discount applied: -$${discount.toFixed(2)}` };
};

export const AjirPlatform = () => {
  const { user, loading: authLoading } = useAjirAuth();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [myProperties, setMyProperties] = useState<PropertyRow[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hostBookings, setHostBookings] = useState<Trip[]>([]);
  const [favorites, setFavorites] = useState<FavoriteWithProperty[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [booking, setBooking] = useState({ checkIn: "", checkOut: "", guests: "1", coupon: "" });
  const [review, setReview] = useState({ rating: "5", comment: "" });
  const [form, setForm] = useState<PropertyForm>(emptyForm);

  const selectedProperty = useMemo(() => properties.find((property) => property.id === selectedPropertyId) ?? properties[0], [properties, selectedPropertyId]);

  const loadPublic = async () => {
    const [{ data, error }, couponResult] = await Promise.all([
      supabase.from("properties").select("*").eq("status", "published").order("created_at", { ascending: false }),
      supabase.from("coupons").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    if (error) toast.error(error.message);
    setProperties(data ?? []);
    if (couponResult.data) setCoupons(couponResult.data);
    setSelectedPropertyId((current) => current || data?.[0]?.id || "");
  };

  const loadPrivate = async () => {
    if (!user) return;
    const [mine, guestTrips, hostTrips, wishlists, paid] = await Promise.all([
      supabase.from("properties").select("*").eq("host_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*, properties(title, city, country, host_id, images, price)").eq("guest_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*, properties(title, city, country, host_id, images, price)").order("created_at", { ascending: false }),
      supabase.from("favorites").select("*, properties(title, city, country, images, price)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (mine.data) setMyProperties(mine.data);
    if (guestTrips.data) setTrips(guestTrips.data as Trip[]);
    if (hostTrips.data) setHostBookings((hostTrips.data as Trip[]).filter((trip) => trip.properties?.host_id === user.id));
    if (wishlists.data) setFavorites(wishlists.data as FavoriteWithProperty[]);
    if (paid.data) setPayments(paid.data);
  };

  const loadReviews = async (propertyId: string) => {
    const { data } = await supabase.from("reviews").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    setReviews(data ?? []);
  };

  useEffect(() => {
    void loadPublic();
  }, []);

  useEffect(() => {
    if (user) void loadPrivate();
  }, [user]);

  useEffect(() => {
    if (selectedProperty?.id) void loadReviews(selectedProperty.id);
  }, [selectedProperty?.id]);

  const requireUser = () => {
    if (user) return true;
    toast.error("Please log in to use this ajir feature.");
    return false;
  };

  const createProperty = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireUser()) return;
    setLoading(true);
    const { error } = await supabase.from("properties").insert({
      host_id: user!.id,
      title: form.title,
      description: form.description || "A comfortable ajir stay in Algeria ready for guests.",
      price: Number(form.price),
      property_type: "apartment",
      max_guests: Number(form.maxGuests),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      address: form.address,
      city: form.city,
      country: form.country,
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
      images: toImageList(form.images),
      status: "draft",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Property created as draft.");
    setForm(emptyForm);
    await loadPrivate();
  };

  const updatePropertyStatus = async (propertyId: string, status: PropertyRow["status"]) => {
    if (!requireUser()) return;
    const { error } = await supabase.from("properties").update({ status }).eq("id", propertyId);
    if (error) return toast.error(error.message);
    toast.success(status === "published" ? "Property published." : "Property archived.");
    await Promise.all([loadPublic(), loadPrivate()]);
  };

  const deleteProperty = async (propertyId: string) => {
    if (!requireUser()) return;
    const { error } = await supabase.from("properties").delete().eq("id", propertyId);
    if (error) return toast.error(error.message);
    toast.success("Property deleted.");
    await Promise.all([loadPublic(), loadPrivate()]);
  };

  const createBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireUser() || !selectedProperty) return;
    const nights = nightsBetween(booking.checkIn, booking.checkOut);
    const total = nights * Number(selectedProperty.price);
    const discount = applyStayCoupon(coupons, booking.coupon, total);
    if (booking.coupon && discount.discount === 0) return toast.error(discount.message || "Coupon cannot be applied.");
    const { data, error } = await supabase.from("bookings").insert({
      property_id: selectedProperty.id,
      guest_id: user!.id,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      guests: Number(booking.guests),
      total_price: discount.final,
    }).select("id").single();
    if (error) return toast.error(error.message);
    await supabase.from("payments").insert({ booking_id: data.id, user_id: user!.id, amount: discount.final, status: "succeeded", provider_payment_id: `sim_${Date.now()}` });
    toast.success(discount.discount > 0 ? `Booking created with ${discount.message}` : "Booking created and payment simulated.");
    setBooking({ checkIn: "", checkOut: "", guests: "1", coupon: "" });
    await loadPrivate();
  };

  const setBookingStatus = async (bookingId: string, status: BookingRow["status"]) => {
    if (!requireUser()) return;
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status}.`);
    await loadPrivate();
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!requireUser()) return;
    const existing = favorites.find((favorite) => favorite.property_id === propertyId);
    const result = existing
      ? await supabase.from("favorites").delete().eq("property_id", propertyId).eq("user_id", user!.id)
      : await supabase.from("favorites").insert({ property_id: propertyId, user_id: user!.id });
    if (result.error) return toast.error(result.error.message);
    toast.success(existing ? "Removed from wishlist." : "Saved to wishlist.");
    await loadPrivate();
  };

  const createReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireUser() || !selectedProperty) return;
    const trip = trips.find((item) => item.property_id === selectedProperty.id);
    const { error } = await supabase.from("reviews").insert({
      booking_id: trip?.id,
      property_id: selectedProperty.id,
      user_id: user!.id,
      rating: Number(review.rating),
      comment: review.comment,
    });
    if (error) return toast.error(error.message);
    toast.success("Review posted.");
    setReview({ rating: "5", comment: "" });
    await loadReviews(selectedProperty.id);
  };

  const imageFor = (property?: Pick<PropertyRow, "images"> | null) => property?.images?.[0] || fallbackImages[0];

  return (
    <section id="host" className="border-t border-border bg-background px-5 py-12 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-foreground md:text-3xl">ajir full booking platform</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">Browse Algeria homes, host new listings, manage bookings, keep a wishlist, post reviews, and track simulated payments.</p>
        </div>

        <Tabs defaultValue="explore" className="w-full">
          <TabsList className="h-auto flex-wrap justify-start rounded-ajir bg-secondary p-1">
            <TabsTrigger value="explore" className="rounded-ajir"><Home /> Explore</TabsTrigger>
            <TabsTrigger value="host" className="rounded-ajir"><Plus /> Host</TabsTrigger>
            <TabsTrigger value="trips" className="rounded-ajir"><CalendarCheck /> Trips</TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-ajir"><Heart /> Wishlist</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-ajir"><Star /> Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {properties.length === 0 ? (
                <Card className="rounded-ajir border-border bg-card sm:col-span-2 xl:col-span-3"><CardContent className="p-6 text-muted-foreground">No published host listings yet. Create and publish one from the Host tab.</CardContent></Card>
              ) : properties.map((property) => (
                <Card key={property.id} className="overflow-hidden rounded-ajir border-border bg-card shadow-ajir-card">
                  <button type="button" className="block w-full text-left" onClick={() => setSelectedPropertyId(property.id)}>
                    <img src={imageFor(property)} alt={property.title} className="aspect-[1.25/1] w-full object-cover" />
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2"><strong className="text-foreground">{property.city}, {property.country}</strong><Badge variant="secondary">{property.property_type}</Badge></div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {property.address || "Verified Algeria location"}</p>
                      <p className="line-clamp-1 text-sm text-muted-foreground">{property.title}</p>
                      <p className="font-black text-foreground">${Number(property.price).toFixed(0)} night</p>
                    </CardContent>
                  </button>
                </Card>
              ))}
            </div>

            <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
              <CardHeader><CardTitle className="text-xl font-black">Book a stay</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Property</Label>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedProperty?.id ?? ""} onChange={(e) => setSelectedPropertyId(e.target.value)}>
                    {properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
                  </select>
                </div>
                {selectedProperty && <p className="text-sm text-muted-foreground">{selectedProperty.description}</p>}
                <form className="grid gap-4" onSubmit={createBooking}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Check in</Label><Input type="date" value={booking.checkIn} onChange={(e) => setBooking({ ...booking, checkIn: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Check out</Label><Input type="date" value={booking.checkOut} onChange={(e) => setBooking({ ...booking, checkOut: e.target.value })} required /></div>
                  </div>
                  <div className="space-y-2"><Label>Guests</Label><Input type="number" min="1" max={selectedProperty?.max_guests ?? 16} value={booking.guests} onChange={(e) => setBooking({ ...booking, guests: e.target.value })} required /></div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 rounded-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={!selectedProperty || authLoading}>{authLoading ? <Loader2 className="animate-spin" /> : <BedDouble />} Reserve</Button>
                    {selectedProperty && <Button type="button" variant="outline" className="rounded-full" onClick={() => toggleFavorite(selectedProperty.id)}><Heart className={favorites.some((f) => f.property_id === selectedProperty.id) ? "fill-primary" : ""} /></Button>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="host" className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="rounded-ajir border-border bg-card shadow-ajir-card">
              <CardHeader><CardTitle className="text-xl font-black">Create property</CardTitle></CardHeader>
              <CardContent>
                <form className="grid gap-4" onSubmit={createProperty}>
                  <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                  <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div><div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required /></div></div>
                  <div className="grid gap-3 sm:grid-cols-4"><div className="space-y-2"><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div><div className="space-y-2"><Label>Guests</Label><Input type="number" value={form.maxGuests} onChange={(e) => setForm({ ...form, maxGuests: e.target.value })} /></div><div className="space-y-2"><Label>Beds</Label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div><div className="space-y-2"><Label>Baths</Label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div></div>
                  <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Amenities</Label><Input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Image URLs, one per line</Label><Textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="Leave blank to use generated ajir images" /></div>
                  <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Plus />} Create draft</Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {myProperties.map((property) => (
                <Card key={property.id} className="rounded-ajir border-border bg-card">
                  <CardContent className="grid gap-4 p-4 sm:grid-cols-[150px_1fr]">
                    <img src={imageFor(property)} alt={property.title} className="aspect-[1.3/1] w-full rounded-ajir object-cover" />
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2"><div><strong className="text-foreground">{property.title}</strong><p className="text-sm text-muted-foreground">{property.city}, {property.country} · ${Number(property.price).toFixed(0)} night</p></div><Badge variant={property.status === "published" ? "default" : "secondary"}>{property.status}</Badge></div>
                      <div className="flex flex-wrap gap-2"><Button size="sm" className="rounded-full" onClick={() => updatePropertyStatus(property.id, "published")}><CheckCircle2 /> Publish</Button><Button size="sm" variant="secondary" className="rounded-full" onClick={() => updatePropertyStatus(property.id, "archived")}><XCircle /> Archive</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => deleteProperty(property.id)}><Trash2 /> Delete</Button></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {myProperties.length === 0 && <Card className="rounded-ajir border-border bg-card"><CardContent className="p-6 text-muted-foreground">Log in and create your first ajir listing.</CardContent></Card>}
            </div>
          </TabsContent>

          <TabsContent value="trips" className="mt-6 grid gap-6 lg:grid-cols-2">
            <TripList title="My bookings" trips={trips} onStatus={setBookingStatus} imageFor={imageFor} />
            <TripList title="Host booking requests" trips={hostBookings} onStatus={setBookingStatus} imageFor={imageFor} host />
            <Card className="rounded-ajir border-border bg-card lg:col-span-2"><CardHeader><CardTitle className="text-xl font-black">Payments</CardTitle></CardHeader><CardContent className="grid gap-2">{payments.map((payment) => <div key={payment.id} className="flex justify-between rounded-ajir bg-secondary p-3 text-sm"><span>{payment.provider_payment_id ?? payment.id}</span><strong>${Number(payment.amount).toFixed(2)} · {payment.status}</strong></div>)}{payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}</CardContent></Card>
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => <Card key={favorite.id} className="overflow-hidden rounded-ajir border-border bg-card"><img src={imageFor(favorite.properties)} alt={favorite.properties?.title ?? "Saved property"} className="aspect-[1.4/1] w-full object-cover" /><CardContent className="p-4"><strong>{favorite.properties?.title}</strong><p className="text-sm text-muted-foreground">{favorite.properties?.city}, {favorite.properties?.country}</p></CardContent></Card>)}
            {favorites.length === 0 && <Card className="rounded-ajir border-border bg-card"><CardContent className="p-6 text-muted-foreground">Saved homes will appear here.</CardContent></Card>}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="rounded-ajir border-border bg-card"><CardHeader><CardTitle className="text-xl font-black">Write a review</CardTitle></CardHeader><CardContent><form className="grid gap-4" onSubmit={createReview}><div className="space-y-2"><Label>Property</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedProperty?.id ?? ""} onChange={(e) => setSelectedPropertyId(e.target.value)}>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></div><div className="space-y-2"><Label>Rating</Label><Input type="number" min="1" max="5" value={review.rating} onChange={(e) => setReview({ ...review, rating: e.target.value })} /></div><div className="space-y-2"><Label>Comment</Label><Textarea value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} /></div><Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><Star /> Post review</Button></form></CardContent></Card>
            <Card className="rounded-ajir border-border bg-card"><CardHeader><CardTitle className="text-xl font-black">Property reviews</CardTitle></CardHeader><CardContent className="space-y-3">{reviews.map((item) => <div key={item.id} className="rounded-ajir bg-secondary p-4"><strong className="flex items-center gap-1 text-foreground"><Star className="h-4 w-4 fill-primary" /> {item.rating}/5</strong><p className="text-sm text-muted-foreground">{item.comment || "No comment"}</p></div>)}{reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

const TripList = ({ title, trips, onStatus, imageFor, host = false }: { title: string; trips: Trip[]; onStatus: (id: string, status: BookingRow["status"]) => void; imageFor: (property?: Pick<PropertyRow, "images"> | null) => string; host?: boolean }) => (
  <Card className="rounded-ajir border-border bg-card">
    <CardHeader><CardTitle className="text-xl font-black">{title}</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {trips.map((trip) => (
        <div key={trip.id} className="grid gap-3 rounded-ajir bg-secondary p-3 sm:grid-cols-[120px_1fr]">
          <img src={imageFor(trip.properties)} alt={trip.properties?.title ?? "Booked property"} className="aspect-[1.3/1] w-full rounded-ajir object-cover" />
          <div className="space-y-2"><div className="flex flex-wrap justify-between gap-2"><strong>{trip.properties?.title}</strong><Badge>{trip.status}</Badge></div><p className="text-sm text-muted-foreground">{trip.check_in} → {trip.check_out} · {trip.guests} guests · ${Number(trip.total_price).toFixed(0)}</p><div className="flex flex-wrap gap-2">{host && <Button size="sm" className="rounded-full" onClick={() => onStatus(trip.id, "confirmed")}><CheckCircle2 /> Confirm</Button>}<Button size="sm" variant="outline" className="rounded-full" onClick={() => onStatus(trip.id, "cancelled")}><XCircle /> Cancel</Button></div></div>
        </div>
      ))}
      {trips.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
    </CardContent>
  </Card>
);
