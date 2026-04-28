import { useState } from "react";
import { Minus, Plus, Search } from "lucide-react";

type Section = "destination" | "dates" | "guests" | null;

type SearchBarProps = { compact?: boolean; initialSection?: Section };

const destinations = ["Marrakech", "Casablanca", "Tangier", "Taghazout", "Rabat"];

export const SearchBar = ({ compact = false, initialSection = null }: SearchBarProps) => {
  const [active, setActive] = useState<Section>(initialSection);
  const [guests, setGuests] = useState({ adults: 0, children: 0, pets: 0 });

  if (compact) {
    return (
      <button type="button" onClick={() => setActive("destination")} className="hidden h-12 min-w-[430px] items-center rounded-full border border-border bg-card shadow-ajir-soft transition hover:shadow-ajir-card lg:flex">
        <span className="flex-1 px-5 text-sm font-bold text-foreground">Anywhere</span>
        <span className="h-5 w-px bg-border" />
        <span className="flex-1 px-5 text-sm font-bold text-foreground">Any week</span>
        <span className="h-5 w-px bg-border" />
        <span className="flex-1 px-5 text-sm text-muted-foreground">Add guests</span>
        <span className="mr-2 grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground"><Search className="h-4 w-4" /></span>
      </button>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[880px] px-4">
      <div className={active ? "flex rounded-full border border-border bg-muted shadow-ajir-search" : "flex rounded-full border border-border bg-card shadow-ajir-search"}>
        {(["destination", "dates", "guests"] as const).map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => setActive(active === section ? null : section)}
            className={active === section ? "flex-1 rounded-full bg-card px-6 py-3 text-left shadow-ajir-soft transition" : "flex-1 rounded-full px-6 py-3 text-left transition hover:bg-secondary"}
          >
            <span className="block text-xs font-black capitalize text-foreground">{section === "guests" ? "Travelers" : section}</span>
            <span className="block truncate text-sm text-muted-foreground">{section === "destination" ? "Search destinations" : section === "dates" ? "Add dates" : "Add guests"}</span>
          </button>
        ))}
        <button type="button" className="m-2 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Search className="h-5 w-5" />
        </button>
      </div>

      {active && (
        <div className="absolute left-4 right-4 top-20 z-30 rounded-[2rem] border border-border bg-card p-6 shadow-ajir-float md:left-auto md:right-auto md:w-[430px]">
          {active === "destination" && (
            <div className="space-y-2">
              <h3 className="px-2 text-xs font-black text-foreground">Suggested destinations</h3>
              {destinations.map((destination) => (
                <button key={destination} type="button" className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition hover:bg-secondary">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-xl">⌂</span>
                  <span><strong className="block text-sm text-foreground">{destination}</strong><span className="text-sm text-muted-foreground">Popular stays and weekend homes</span></span>
                </button>
              ))}
            </div>
          )}
          {active === "dates" && (
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {Array.from({ length: 35 }, (_, i) => <button key={i} type="button" className="aspect-square rounded-full font-bold text-foreground transition hover:bg-accent hover:text-accent-foreground">{i + 1}</button>)}
            </div>
          )}
          {active === "guests" && (
            <div className="space-y-5">
              {(Object.keys(guests) as Array<keyof typeof guests>).map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <div><strong className="block capitalize text-foreground">{type}</strong><span className="text-sm text-muted-foreground">{type === "pets" ? "Service animals welcome" : "Ages 2 and up"}</span></div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setGuests((g) => ({ ...g, [type]: Math.max(0, g[type] - 1) }))} className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground disabled:opacity-30" disabled={guests[type] === 0}><Minus className="h-4 w-4" /></button>
                    <span className="w-5 text-center text-foreground">{guests[type]}</span>
                    <button type="button" onClick={() => setGuests((g) => ({ ...g, [type]: g[type] + 1 }))} className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
