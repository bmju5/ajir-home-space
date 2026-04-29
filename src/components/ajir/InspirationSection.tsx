import { useState } from "react";

const tabs = {
  trending: ["Algiers", "Oran", "Constantine", "Tipaza", "Béjaïa", "Annaba", "Tlemcen", "Ghardaïa"],
  beaches: ["Aïn El Turk", "Sidi Fredj", "Tichy", "Jijel", "Skikda", "Mostaganem", "Cherchell", "El Kala"],
  mountains: ["Tikjda", "Chréa", "Tlemcen National Park", "Djurdjura", "Aurès", "Theniet El Had", "Akfadou", "Tassili n’Ajjer"],
  cities: ["Sétif", "Batna", "Blida", "Tizi Ouzou", "Sidi Bel Abbès", "Biskra", "Ouargla", "Timimoun"],
};

export const InspirationSection = () => {
  const [active, setActive] = useState<keyof typeof tabs>("trending");

  return (
    <section className="mt-14 bg-secondary px-5 py-10 md:px-10">
      <div className="mx-auto max-w-[1760px] space-y-6">
        <h2 className="text-2xl font-black text-foreground">Inspiration for future getaways</h2>
        <div className="flex gap-6 overflow-x-auto border-b border-border">
          {Object.keys(tabs).map((tab) => (
            <button key={tab} type="button" onClick={() => setActive(tab as keyof typeof tabs)} className={active === tab ? "border-b-2 border-primary pb-3 text-sm font-black capitalize text-primary" : "pb-3 text-sm font-bold capitalize text-muted-foreground transition hover:text-foreground"}>{tab}</button>
          ))}
        </div>
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {tabs[active].map((city) => (
            <a key={city} href="#" className="group rounded-ajir p-1 transition hover:translate-x-1">
              <strong className="block text-sm text-foreground group-hover:text-primary">{city}</strong>
              <span className="text-sm text-muted-foreground">Vacation rentals</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
