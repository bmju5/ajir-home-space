import { useEffect, useState } from "react";
import { Gift, Globe, LayoutDashboard, MapPin, Menu, Tag, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { AjirLogo } from "./AjirLogo";
import { AuthDialog } from "./AuthDialog";
import { SearchBar } from "./SearchBar";
import { useAjirAuth } from "@/hooks/use-ajir-auth";

const navItems = [
  { video: "/videos/house.webm", label: "Stays", to: "/stays" },
  { video: "/videos/balloon.webm", label: "Experiences", to: "/experiences" },
  { video: "/videos/consierge.webm", label: "Services", to: "/services" },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
          <Link to="/"><AjirLogo /></Link>
          {scrolled ? <SearchBar compact /> : (
            <div className="hidden items-center gap-6 lg:flex">
              {navItems.map((item) => (
                <NavLink key={item.label} to={item.to} className={({ isActive }) => `group flex items-center gap-1 border-b-2 pb-2 text-sm font-bold transition hover:border-primary hover:text-primary ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
                  <video src={item.video} autoPlay muted playsInline loop className="h-12 w-12 transition-transform group-hover:scale-110" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <NavLink to="/map" aria-label="Map" className="hidden rounded-full p-3 text-foreground transition hover:bg-secondary xl:block"><MapPin className="h-5 w-5" /></NavLink>
            <NavLink to="/gift-cards" aria-label="Gift cards" className="hidden rounded-full p-3 text-foreground transition hover:bg-secondary xl:block"><Gift className="h-5 w-5" /></NavLink>
            <NavLink to="/offers" aria-label="Offers" className="hidden rounded-full p-3 text-foreground transition hover:bg-secondary xl:block"><Tag className="h-5 w-5" /></NavLink>
            <NavLink to="/stays" className="hidden rounded-full px-4 py-3 text-sm font-bold text-foreground transition hover:bg-secondary md:block">List your home</NavLink>
            <button type="button" aria-label="Language" className="rounded-full p-3 text-foreground transition hover:bg-secondary"><Globe className="h-5 w-5" /></button>
            <div className="relative">
              <button type="button" aria-label="Account menu" onClick={() => setMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-foreground shadow-ajir-soft transition hover:shadow-ajir-card">
                <Menu className="h-4 w-4" />
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                  {user ? (profile?.name?.[0] ?? user.email?.[0] ?? "A").toUpperCase() : <UserRound className="h-4 w-4" />}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-ajir border border-border bg-card shadow-ajir-card">
                  {user ? (
                    <>
                      <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary"><LayoutDashboard className="h-4 w-4" /> Dashboard</NavLink>
                      <NavLink to="/stays" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-foreground hover:bg-secondary">My trips</NavLink>
                      <NavLink to="/gift-cards" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-foreground hover:bg-secondary">Gift cards</NavLink>
                      <button type="button" onClick={() => { setMenuOpen(false); void signOut(); }} className="block w-full px-4 py-3 text-left text-sm text-foreground hover:bg-secondary">Log out</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => { setMenuOpen(false); setAuthOpen(true); }} className="block w-full px-4 py-3 text-left text-sm font-bold text-foreground hover:bg-secondary">Log in / Sign up</button>
                      <NavLink to="/stays" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-foreground hover:bg-secondary">Host your home</NavLink>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
        {!scrolled && <div className="pb-5"><SearchBar /></div>}
      </header>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};
