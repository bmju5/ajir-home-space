import { Link } from "react-router-dom";
import { AjirLogo } from "./AjirLogo";

export const Footer = () => (
  <footer className="border-t border-border bg-background px-5 py-8 md:px-10">
    <div className="mx-auto flex max-w-[1760px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <Link to="/"><AjirLogo /></Link>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-muted-foreground">
        <Link to="/stays" className="hover:text-primary">Stays</Link>
        <Link to="/experiences" className="hover:text-primary">Experiences</Link>
        <Link to="/services" className="hover:text-primary">Services</Link>
        <Link to="/map" className="hover:text-primary">Map</Link>
        <Link to="/gift-cards" className="hover:text-primary">Gift cards</Link>
        <Link to="/offers" className="hover:text-primary">Offers</Link>
        <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
      </div>
      <p className="text-sm text-muted-foreground">© 2026 ajir, Inc.</p>
    </div>
  </footer>
);
