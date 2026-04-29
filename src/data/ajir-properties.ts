import stayOne from "@/assets/ajir-stays-1.jpg";
import stayTwo from "@/assets/ajir-stays-2.jpg";
import stayThree from "@/assets/ajir-stays-3.jpg";

export type AjirProperty = {
  id: string;
  title: string;
  location: string;
  distance: string;
  dates: string;
  price: number;
  rating: number;
  images: string[];
  badge?: string;
  lat: number;
  lng: number;
};

const imagesA = [stayOne, stayTwo, stayThree];
const imagesB = [stayTwo, stayThree, stayOne];
const imagesC = [stayThree, stayOne, stayTwo];

export const popularProperties: AjirProperty[] = [
  { id: "1", title: "Casbah heritage apartment", location: "Algiers, Algeria", distance: "650 m from the Casbah", dates: "May 12–17", price: 118, rating: 4.94, images: imagesA, badge: "Guest favorite", lat: 36.7843, lng: 3.0616 },
  { id: "2", title: "Oran seafront loft", location: "Oran, Algeria", distance: "Near Front de Mer", dates: "May 18–23", price: 92, rating: 4.87, images: imagesB, lat: 35.6971, lng: -0.6308 },
  { id: "3", title: "Constantine bridge-view studio", location: "Constantine, Algeria", distance: "By Sidi M’Cid bridge", dates: "Jun 1–6", price: 105, rating: 4.91, images: imagesC, badge: "Rare find", lat: 36.365, lng: 6.6147 },
  { id: "4", title: "Annaba beach apartment", location: "Annaba, Algeria", distance: "900 m from Plage Rizzi Amor", dates: "Jun 7–12", price: 84, rating: 4.89, images: imagesA, lat: 36.9, lng: 7.7667 },
  { id: "5", title: "Tlemcen Andalusian villa", location: "Tlemcen, Algeria", distance: "Close to El Mechouar Palace", dates: "Jun 14–19", price: 142, rating: 4.96, images: imagesB, badge: "Guest favorite", lat: 34.8828, lng: -1.3167 },
  { id: "6", title: "Ghardaïa palm-grove guesthouse", location: "Ghardaïa, Algeria", distance: "Mzab Valley access", dates: "Jun 21–26", price: 88, rating: 4.84, images: imagesC, lat: 32.49, lng: 3.67 },
];

export const trendingProperties: AjirProperty[] = [
  { id: "7", title: "Tipaza Roman-coast bungalow", location: "Tipaza, Algeria", distance: "Near the archaeological park", dates: "Jul 2–7", price: 91, rating: 4.92, images: imagesB, badge: "New", lat: 36.5897, lng: 2.4475 },
  { id: "8", title: "Béjaïa mountain-and-bay retreat", location: "Béjaïa, Algeria", distance: "Below Gouraya National Park", dates: "Jul 9–14", price: 109, rating: 4.88, images: imagesA, lat: 36.75, lng: 5.0667 },
  { id: "9", title: "Timimoun red-oasis house", location: "Timimoun, Algeria", distance: "Near the old ksar", dates: "Jul 16–21", price: 67, rating: 4.95, images: imagesC, badge: "Guest favorite", lat: 29.2639, lng: 0.2306 },
  { id: "10", title: "Djanet desert camp suite", location: "Djanet, Algeria", distance: "Tassili n’Ajjer gateway", dates: "Jul 23–28", price: 79, rating: 4.86, images: imagesB, lat: 24.5545, lng: 9.4858 },
  { id: "11", title: "Sétif family flat", location: "Sétif, Algeria", distance: "Near Ain El Fouara", dates: "Aug 3–8", price: 74, rating: 4.97, images: imagesA, badge: "Rare find", lat: 36.1911, lng: 5.4137 },
  { id: "12", title: "Batna Aurès gateway home", location: "Batna, Algeria", distance: "Route to Timgad ruins", dates: "Aug 11–16", price: 82, rating: 4.79, images: imagesC, lat: 35.5559, lng: 6.1741 },
];
