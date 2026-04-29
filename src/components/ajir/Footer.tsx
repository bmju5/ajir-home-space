import { AjirLogo } from "./AjirLogo";

export const Footer = () => (
  <footer className="border-t border-border bg-background px-5 py-8 md:px-10">
    <div className="mx-auto flex max-w-[1760px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <AjirLogo />
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-muted-foreground">
        <a href="#map" className="hover:text-primary">Map</a>
        <a href="#gift-cards" className="hover:text-primary">Gift cards</a>
        <a href="#offers" className="hover:text-primary">Offers</a>
        <a href="#host" className="hover:text-primary">Hosting</a>
        <a href="#" className="hover:text-primary">Privacy</a>
        <a href="#" className="hover:text-primary">Terms</a>
      </div>
      <p className="text-sm text-muted-foreground">© 2026 ajir, Inc.</p>
    </div>
  </footer>
);
