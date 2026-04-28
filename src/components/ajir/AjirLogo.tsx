import ajirLogo from "@/assets/ajir-logo.png";

export const AjirLogo = () => (
  <div className="flex items-center gap-2 text-primary" aria-label="ajir home">
    <img src={ajirLogo} alt="ajir logo" className="h-10 w-10 rounded-md object-contain" />
    <span className="text-2xl font-black tracking-normal text-primary">ajir</span>
  </div>
);
