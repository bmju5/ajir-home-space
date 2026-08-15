import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Image as ImageIcon, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAjirAuth } from "@/hooks/use-ajir-auth";

type VariantDraft = { name: string; description: string; price: string; max_guests: string; bedrooms: string; beds: string; bathrooms: string };

const emptyVariant = (): VariantDraft => ({ name: "Standard room", description: "", price: "120", max_guests: "2", bedrooms: "1", beds: "1", bathrooms: "1" });

const algerianCities = ["Algiers","Oran","Constantine","Annaba","Tlemcen","Béjaïa","Sétif","Batna","Ghardaïa","Tipaza","Timimoun","Djanet"];

export const ListingWizard = ({ onCreated }: { onCreated: () => void }) => {
  const { user } = useAjirAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({
    title: "", description: "", property_type: "apartment", city: "Algiers", country: "Algeria",
    address: "", price: "120", max_guests: "2", bedrooms: "1", bathrooms: "1",
    amenities: ["WiFi","Kitchen","Air conditioning"], amenityInput: "",
    images: [] as string[], imageInput: "",
    variants: [emptyVariant()] as VariantDraft[],
  });

  const set = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) => setData((d) => ({ ...d, [k]: v }));

  const addAmenity = () => {
    if (!data.amenityInput.trim()) return;
    set("amenities", [...data.amenities, data.amenityInput.trim()]);
    set("amenityInput", "");
  };
  const addImage = () => {
    if (!data.imageInput.trim()) return;
    set("images", [...data.images, data.imageInput.trim()]);
    set("imageInput", "");
  };
  const addVariant = () => set("variants", [...data.variants, emptyVariant()]);
  const updateVariant = (i: number, key: keyof VariantDraft, val: string) => {
    const arr = [...data.variants];
    arr[i] = { ...arr[i], [key]: val };
    set("variants", arr);
  };

  const submit = async (status: "draft" | "published") => {
    if (!user) return toast.error("Log in first.");
    if (!data.title.trim()) return toast.error("Add a title.");
    setBusy(true);
    const { data: prop, error } = await supabase.from("properties").insert({
      host_id: user.id, title: data.title, description: data.description || "A welcoming ajir stay in Algeria.",
      property_type: data.property_type as never, price: Number(data.price), city: data.city, country: data.country,
      address: data.address, max_guests: Number(data.max_guests), bedrooms: Number(data.bedrooms), bathrooms: Number(data.bathrooms),
      amenities: data.amenities, images: data.images, status,
    }).select("id").single();
    if (error || !prop) { setBusy(false); return toast.error(error?.message ?? "Could not save"); }
    if (data.variants.length) {
      await supabase.from("property_variants").insert(data.variants.map((v) => ({
        property_id: prop.id, name: v.name, description: v.description,
        price: Number(v.price), max_guests: Number(v.max_guests), bedrooms: Number(v.bedrooms),
        beds: Number(v.beds), bathrooms: Number(v.bathrooms),
      })));
    }
    setBusy(false);
    toast.success(status === "published" ? "Listing published!" : "Draft saved.");
    onCreated();
  };

  const steps = ["Basics","Location","Photos & amenities","Variants & price"];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button key={s} type="button" onClick={() => setStep(i)} className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${i === step ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="grid gap-3">
          <div><Label>Title</Label><Input value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="Casbah heritage apartment" /></div>
          <div><Label>Description</Label><Textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={4} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Property type</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={data.property_type} onChange={(e) => set("property_type", e.target.value)}>
                <option value="apartment">Apartment</option><option value="house">House</option><option value="villa">Villa</option><option value="riad">Riad</option><option value="cabin">Cabin</option>
              </select>
            </div>
            <div><Label>Max guests</Label><Input type="number" value={data.max_guests} onChange={(e) => set("max_guests", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Bedrooms</Label><Input type="number" value={data.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} /></div>
            <div><Label>Bathrooms</Label><Input type="number" value={data.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} /></div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-3">
          <div><Label>City</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={data.city} onChange={(e) => set("city", e.target.value)}>
              {algerianCities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><Label>Country</Label><Input value={data.country} onChange={(e) => set("country", e.target.value)} /></div>
          <div><Label><MapPin className="inline h-4 w-4" /> Address</Label><Input value={data.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, neighbourhood" /></div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <div>
            <Label><ImageIcon className="inline h-4 w-4" /> Photo URLs</Label>
            <div className="flex gap-2"><Input placeholder="https://..." value={data.imageInput} onChange={(e) => set("imageInput", e.target.value)} /><Button type="button" onClick={addImage}><Plus /></Button></div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {data.images.map((src, i) => (
                <div key={src + i} className="relative aspect-square overflow-hidden rounded-md border border-border">
                  <img src={src} alt={`photo ${i}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => set("images", data.images.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-background/90 p-1"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Amenities</Label>
            <div className="flex gap-2"><Input placeholder="Pool" value={data.amenityInput} onChange={(e) => set("amenityInput", e.target.value)} /><Button type="button" onClick={addAmenity}><Plus /></Button></div>
            <div className="mt-2 flex flex-wrap gap-1">
              {data.amenities.map((a, i) => (
                <Badge key={a + i} variant="secondary" className="cursor-pointer" onClick={() => set("amenities", data.amenities.filter((_, j) => j !== i))}>{a} ✕</Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4">
          <div><Label>Base nightly price (USD)</Label><Input type="number" value={data.price} onChange={(e) => set("price", e.target.value)} /></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><strong>Room / unit variants</strong><Button type="button" size="sm" variant="outline" onClick={addVariant}><Plus /> Add variant</Button></div>
            {data.variants.map((v, i) => (
              <div key={i} className="grid gap-2 rounded-ajir border border-border p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Name</Label><Input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)} /></div>
                  <div><Label>Price</Label><Input type="number" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)} /></div>
                </div>
                <Textarea placeholder="Short description" value={v.description} onChange={(e) => updateVariant(i, "description", e.target.value)} rows={2} />
                <div className="grid grid-cols-4 gap-2">
                  <div><Label>Guests</Label><Input type="number" value={v.max_guests} onChange={(e) => updateVariant(i, "max_guests", e.target.value)} /></div>
                  <div><Label>BR</Label><Input type="number" value={v.bedrooms} onChange={(e) => updateVariant(i, "bedrooms", e.target.value)} /></div>
                  <div><Label>Beds</Label><Input type="number" value={v.beds} onChange={(e) => updateVariant(i, "beds", e.target.value)} /></div>
                  <div><Label>BA</Label><Input type="number" value={v.bathrooms} onChange={(e) => updateVariant(i, "bathrooms", e.target.value)} /></div>
                </div>
                {data.variants.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => set("variants", data.variants.filter((_, j) => j !== i))}><Trash2 /> Remove</Button>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-2">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ArrowLeft /> Back</Button>
        {step < 3 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)}>Next <ArrowRight /></Button>
        ) : (
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => submit("draft")}>Save draft</Button>
            <Button type="button" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => submit("published")}>
              {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Publish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
