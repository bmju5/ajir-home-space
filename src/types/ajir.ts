import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
export type FavoriteRow = Database["public"]["Tables"]["favorites"]["Row"];

export type PublicProperty = Pick<
  PropertyRow,
  | "id"
  | "title"
  | "description"
  | "price"
  | "currency"
  | "property_type"
  | "max_guests"
  | "bedrooms"
  | "bathrooms"
  | "address"
  | "city"
  | "state"
  | "country"
  | "amenities"
  | "images"
  | "status"
>;
