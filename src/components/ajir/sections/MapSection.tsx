import { useState } from "react";
import { Home, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { popularProperties, trendingProperties, type AjirProperty } from "@/data/ajir-properties";

const allProperties = [...popularProperties, ...trendingProperties];

export const MapSection = () => {
  const [selected, setSelected] = useState<AjirProperty>(allProperties[0]);
  const navigate = useNavigate();

  return (
    <section className="px-5 py-12 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground md:text-3xl">Explore Algeria on the map</h1>
            <p className="text-sm text-muted-foreground">Click a price point to open a stay detail view with images, address, price, and booking action.</p>
          </div>
          <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/stays")}><MapPin /> Book selected stay</Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[520px] overflow-hidden rounded-ajir border border-border bg-card shadow-ajir-card">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent)/0.28),transparent_28%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)))]" />
            <div className="absolute left-[34%] top-[18%] h-[58%] w-[34%] rounded-[45%_55%_50%_45%] border-2 border-primary/25 bg-background/70 shadow-ajir-soft" />
            {allProperties.map((property) => (
              <button
                key={property.id}
                type="button"
                className={property.id === selected.id ? "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-3 py-1.5 text-xs font-black text-accent-foreground shadow-ajir-float ring-2 ring-ring transition hover:scale-110" : "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-ajir-float transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"}
                style={{ left: `${((property.lng + 8.7) / 20.7) * 100}%`, top: `${((37.2 - property.lat) / 13.2) * 100}%` }}
                title={property.location}
                onClick={() => setSelected(property)}
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
            <img src={selected.images[0]} alt={selected.title} className="aspect-[1.35/1] w-full object-cover" />
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="text-xl font-black text-foreground">{selected.title}</h3><p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {selected.location}</p></div>
                <Badge>{selected.rating} ★</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selected.images.map((image) => <img key={image} src={image} alt={`${selected.title} gallery`} className="aspect-square rounded-ajir object-cover" />)}
              </div>
              <div className="rounded-ajir bg-secondary p-4"><p className="text-sm text-muted-foreground">{selected.distance} · {selected.dates}</p><strong className="text-2xl text-foreground">${selected.price}</strong><span className="text-sm text-muted-foreground"> / night</span></div>
              <Button className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/stays")}><Home /> Reserve this stay</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
