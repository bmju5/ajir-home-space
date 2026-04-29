import { Bike, Gift, MapPin, Sparkles, Tag, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { popularProperties, trendingProperties } from "@/data/ajir-properties";

const allProperties = [...popularProperties, ...trendingProperties];

const experiences = [
  { icon: Utensils, title: "Algiers food walk", place: "Casbah & Bab El Oued", price: 38 },
  { icon: Bike, title: "Oran corniche ride", place: "Front de Mer to Santa Cruz", price: 44 },
  { icon: Sparkles, title: "Djanet stargazing camp", place: "Tassili n’Ajjer", price: 86 },
];

const services = [
  "Airport pickup in Algiers, Oran, and Constantine",
  "Local chef for couscous, rechta, and seafood dinners",
  "Licensed guide for Tipaza, Timgad, Casbah, and Mzab Valley",
  "Photo session for riads, coast stays, and Sahara trips",
];

export const AjirFeatureHub = () => {
  return (
    <section id="ajir-features" className="border-y border-border bg-secondary px-5 py-12 md:px-10">
      <div className="mx-auto grid max-w-[1760px] gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div id="map" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-foreground md:text-3xl">Explore Algeria on the map</h2>
              <p className="text-sm text-muted-foreground">Real destinations from the coast, highlands, oasis towns, and Sahara routes.</p>
            </div>
            <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><MapPin /> Open map</Button>
          </div>
          <div className="relative min-h-[420px] overflow-hidden rounded-ajir border border-border bg-card shadow-ajir-card">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent)/0.28),transparent_28%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)))]" />
            <div className="absolute left-[34%] top-[18%] h-[58%] w-[34%] rounded-[45%_55%_50%_45%] border-2 border-primary/25 bg-background/70 shadow-ajir-soft" />
            {allProperties.map((property) => (
              <button
                key={property.id}
                type="button"
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-ajir-float transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ left: `${((property.lng + 8.7) / 20.7) * 100}%`, top: `${((37.2 - property.lat) / 13.2) * 100}%` }}
                title={property.location}
              >
                ${property.price}
              </button>
            ))}
            <div className="absolute bottom-4 left-4 rounded-ajir bg-card/95 p-4 shadow-ajir-soft backdrop-blur">
              <strong className="block text-sm text-foreground">12 live Algeria destinations</strong>
              <span className="text-sm text-muted-foreground">Algiers, Oran, Constantine, Tipaza, Béjaïa, Djanet, and more.</span>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <Card id="offers" className="rounded-ajir border-border bg-card shadow-ajir-card">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground"><Tag className="h-5 w-5" /></span><h2 className="text-xl font-black text-foreground">Offers</h2></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-ajir bg-secondary p-4"><strong>New guest deal</strong><p className="text-sm text-muted-foreground">Save 15% on first Algeria booking.</p></div>
                <div className="rounded-ajir bg-secondary p-4"><strong>Weekly stays</strong><p className="text-sm text-muted-foreground">Lower rates for 7+ nights.</p></div>
              </div>
            </CardContent>
          </Card>

          <Card id="gift-cards" className="rounded-ajir border-border bg-card shadow-ajir-card">
            <CardContent className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="space-y-2"><div className="flex items-center gap-3"><Gift className="h-6 w-6 text-primary" /><h2 className="text-xl font-black text-foreground">Gift cards</h2></div><p className="text-sm text-muted-foreground">Send ajir credit for Algeria stays, experiences, and services.</p></div>
              <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Buy gift card</Button>
            </CardContent>
          </Card>

          <div id="experiences" className="grid gap-3">
            <h2 className="text-xl font-black text-foreground">Experiences</h2>
            {experiences.map((item) => <Card key={item.title} className="rounded-ajir border-border bg-card"><CardContent className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-3"><item.icon className="h-5 w-5 text-primary" /><div><strong>{item.title}</strong><p className="text-sm text-muted-foreground">{item.place}</p></div></div><span className="font-black text-foreground">${item.price}</span></CardContent></Card>)}
          </div>

          <Card id="services" className="rounded-ajir border-border bg-card shadow-ajir-card">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-black text-foreground">Services</h2>
              <div className="grid gap-2">{services.map((service) => <div key={service} className="rounded-ajir bg-secondary px-4 py-3 text-sm font-bold text-foreground">{service}</div>)}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
