import home from "@/assets/icons/3d/home.png";
import desert from "@/assets/icons/3d/desert.png";
import beach from "@/assets/icons/3d/beach.png";
import casbah from "@/assets/icons/3d/casbah.png";
import mountain from "@/assets/icons/3d/mountain.png";
import bridge from "@/assets/icons/3d/bridge.png";
import oasis from "@/assets/icons/3d/oasis.png";
import heritage from "@/assets/icons/3d/heritage.png";
import city from "@/assets/icons/3d/city.png";
import security from "@/assets/icons/3d/security.png";
import cleaning from "@/assets/icons/3d/cleaning.png";
import electricity from "@/assets/icons/3d/electricity.png";
import bill from "@/assets/icons/3d/bill.png";
import bundle from "@/assets/icons/3d/bundle.png";
import gift from "@/assets/icons/3d/gift.png";
import map from "@/assets/icons/3d/map.png";

export const icons3d = {
  home, desert, beach, casbah, mountain, bridge, oasis, heritage, city,
  security, cleaning, electricity, bill, bundle, gift, map,
} as const;

export type Icon3DName = keyof typeof icons3d;

export const Icon3D = ({ name, size = 56, className = "", alt }: { name: Icon3DName; size?: number; className?: string; alt?: string }) => (
  <img
    src={icons3d[name]}
    alt={alt ?? name}
    width={size}
    height={size}
    loading="lazy"
    className={`inline-block select-none object-contain ${className}`}
    draggable={false}
  />
);
