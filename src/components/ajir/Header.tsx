import { useEffect, useState } from "react";
import { Gift, Globe, MapPin, Menu, Tag, UserRound } from "lucide-react";
import { AjirLogo } from "./AjirLogo";
import { AuthDialog } from "./AuthDialog";
import { SearchBar } from "./SearchBar";
import { useAjirAuth } from "@/hooks/use-ajir-auth";

const navItems = [
  { video: "/videos/house.webm", label: "Stays", href: "#stays" },
  { video: "/videos/balloon.webm", label: "Experiences", href: "#experiences" },
  { video: "/videos/consierge.webm", label: "Services", href: "#services" },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, profile, signOut } = useAjirAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 70);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <header className={scrolled ? "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 shadow-ajir-soft backdrop-blur" : "fixed inset-x-0 top-0 z-50 border-b border-border bg-background"}>
      <nav className="mx-auto flex h-20 max-w-[1760px] items-center justify-between px-5 md:px-10">
        <AjirLogo />
        {scrolled ? <SearchBar compact /> : (
          <div className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="group flex items-center gap-1 border-b-2 border-transparent pb-2 text-sm font-bold text-muted-foreground transition hover:border-primary hover:text-primary">
                <video src={item.video} autoPlay muted playsInline loop className="h-12 w-12 transition-transform group-hover:scale-110" />
                {item.label}
              </a>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <a href="#map" aria-label="Map" className="hidden rounded-full p-3 text-foreground transition hover:bg-secondary xl:block"><MapPin className="h-5 w-5" /></a>
          <a href="#gift-cards" aria-label="Gift cards" className="hidden rounded-full p-3 text-foreground transition hover:bg-secondary xl:block"><Gift className="h-5 w-5" /></a>
          <a href="#offers" aria-label="Offers" className="hidden rounded-full p-3 text-foreground transition hover:bg-secondary xl:block"><Tag className="h-5 w-5" /></a>
          <a href="#host" className="hidden rounded-full px-4 py-3 text-sm font-bold text-foreground transition hover:bg-secondary md:block">List your home</a>
          <button type="button" aria-label="Language" className="rounded-full p-3 text-foreground transition hover:bg-secondary"><Globe className="h-5 w-5" /></button>
          <button type="button" aria-label="Account menu" onClick={() => user ? void signOut() : setAuthOpen(true)} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-foreground shadow-ajir-soft transition hover:shadow-ajir-card"><Menu className="h-4 w-4" /><span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">{user ? (profile?.name?.[0] ?? user.email?.[0] ?? "A").toUpperCase() : <UserRound className="h-4 w-4" />}</span></button>
        </div>
      </nav>
      {!scrolled && <div className="pb-5"><SearchBar /></div>}
    </header>
    <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};
