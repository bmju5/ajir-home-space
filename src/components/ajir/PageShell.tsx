import { Header } from "@/components/ajir/Header";
import { Footer } from "@/components/ajir/Footer";
import { ReactNode } from "react";

export const PageShell = ({ children }: { children: ReactNode }) => (
  <main className="min-h-screen bg-background font-sans text-foreground">
    <Header />
    <div className="h-[194px]" />
    {children}
    <Footer />
  </main>
);
