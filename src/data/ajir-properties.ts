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
};

const imagesA = [stayOne, stayTwo, stayThree];
const imagesB = [stayTwo, stayThree, stayOne];
const imagesC = [stayThree, stayOne, stayTwo];

export const popularProperties: AjirProperty[] = [
  { id: "1", title: "Sunlit riad with private pool", location: "Marrakech, Morocco", distance: "2 km from the medina", dates: "May 12–17", price: 118, rating: 4.94, images: imagesA, badge: "Guest favorite" },
  { id: "2", title: "Garden apartment by the corniche", location: "Casablanca, Morocco", distance: "850 m from the coast", dates: "May 18–23", price: 82, rating: 4.87, images: imagesB },
  { id: "3", title: "Mountain cabin with cedar views", location: "Ifrane, Morocco", distance: "Near Michlifen", dates: "Jun 1–6", price: 96, rating: 4.91, images: imagesC, badge: "Rare find" },
  { id: "4", title: "Whitewashed surf house", location: "Taghazout, Morocco", distance: "Steps from the beach", dates: "Jun 7–12", price: 74, rating: 4.89, images: imagesA },
  { id: "5", title: "Palm courtyard villa", location: "Agadir, Morocco", distance: "4 km from marina", dates: "Jun 14–19", price: 142, rating: 4.96, images: imagesB, badge: "Guest favorite" },
  { id: "6", title: "Old town terrace suite", location: "Tangier, Morocco", distance: "In the Kasbah", dates: "Jun 21–26", price: 88, rating: 4.84, images: imagesC },
];

export const trendingProperties: AjirProperty[] = [
  { id: "7", title: "Minimal city loft with balcony", location: "Rabat, Morocco", distance: "Central district", dates: "Jul 2–7", price: 91, rating: 4.92, images: imagesB, badge: "New" },
  { id: "8", title: "Seaside family retreat", location: "Essaouira, Morocco", distance: "300 m from ramparts", dates: "Jul 9–14", price: 109, rating: 4.88, images: imagesA },
  { id: "9", title: "Desert-edge guesthouse", location: "Merzouga, Morocco", distance: "Dunes nearby", dates: "Jul 16–21", price: 67, rating: 4.95, images: imagesC, badge: "Guest favorite" },
  { id: "10", title: "Chefchaouen blue-view home", location: "Chefchaouen, Morocco", distance: "Old town hillside", dates: "Jul 23–28", price: 79, rating: 4.86, images: imagesB },
  { id: "11", title: "Luxe villa near golf course", location: "Marrakech, Morocco", distance: "10 km from centre", dates: "Aug 3–8", price: 184, rating: 4.97, images: imagesA, badge: "Rare find" },
  { id: "12", title: "Compact studio by cafés", location: "Fes, Morocco", distance: "Medina access", dates: "Aug 11–16", price: 52, rating: 4.79, images: imagesC },
];
