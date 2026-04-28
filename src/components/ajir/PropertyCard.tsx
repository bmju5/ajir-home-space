import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import type { AjirProperty } from "@/data/ajir-properties";

type PropertyCardProps = { property: AjirProperty };

export const PropertyCard = ({ property }: PropertyCardProps) => {
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState(false);

  const previous = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIndex((value) => Math.max(0, value - 1));
  };

  const next = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIndex((value) => Math.min(property.images.length - 1, value + 1));
  };

  return (
    <article className="group cursor-pointer animate-fade-up">
      <div className="relative mb-3 aspect-[1.05/1] overflow-hidden rounded-ajir bg-card shadow-ajir-card">
        <img
          src={property.images[index]}
          alt={property.title}
          width={1280}
          height={960}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
        />
        {property.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-xs font-bold text-card-foreground shadow-ajir-soft">
            {property.badge}
          </span>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setLiked((value) => !value);
          }}
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-3 top-3 rounded-full bg-card/85 p-2 text-primary shadow-ajir-soft transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Heart className={liked ? "h-5 w-5 fill-primary" : "h-5 w-5"} />
        </button>
        {index > 0 && (
          <button type="button" onClick={previous} aria-label="Previous image" className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-card text-primary opacity-0 shadow-ajir-soft transition group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {index < property.images.length - 1 && (
          <button type="button" onClick={next} aria-label="Next image" className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-card text-primary opacity-0 shadow-ajir-soft transition group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {property.images.map((image, dotIndex) => (
            <span key={image} className={dotIndex === index ? "h-1.5 w-1.5 rounded-full bg-card" : "h-1.5 w-1.5 rounded-full bg-card/60"} />
          ))}
        </div>
      </div>
      <div className="space-y-0.5 text-sm">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-foreground">{property.location}</h3>
          <span className="flex items-center gap-1 text-foreground"><Star className="h-3.5 w-3.5 fill-primary text-primary" />{property.rating}</span>
        </div>
        <p className="truncate text-muted-foreground">{property.title}</p>
        <p className="text-muted-foreground">{property.distance}</p>
        <p className="text-muted-foreground">{property.dates}</p>
        <p className="pt-1 font-bold text-foreground"><span>${property.price}</span> night</p>
      </div>
    </article>
  );
};
