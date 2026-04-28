import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AjirProperty } from "@/data/ajir-properties";
import { PropertyCard } from "./PropertyCard";

type PropertyCarouselProps = { title: string; properties: AjirProperty[] };

export const PropertyCarousel = ({ title, properties }: PropertyCarouselProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => ref.current?.scrollBy({ left: direction * 720, behavior: "smooth" });

  return (
    <section className="space-y-4 px-5 md:px-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-foreground md:text-2xl">{title}</h2>
        <div className="hidden gap-2 md:flex">
          <button type="button" aria-label="Scroll left" onClick={() => scroll(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Scroll right" onClick={() => scroll(1)} className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={ref} className="scrollbar-hide grid auto-cols-[minmax(230px,1fr)] grid-flow-col gap-5 overflow-x-auto scroll-smooth pb-2 sm:auto-cols-[minmax(280px,1fr)] lg:auto-cols-[minmax(300px,1fr)]">
        {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
      </div>
    </section>
  );
};
