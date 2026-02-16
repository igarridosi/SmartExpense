import {
  BookOpen,
  Briefcase,
  Car,
  Clapperboard,
  Dumbbell,
  Gamepad2,
  Gift,
  House,
  Lightbulb,
  Package,
  PawPrint,
  Pill,
  Plane,
  Shirt,
  ShoppingCart,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: UtensilsCrossed,
  car: Car,
  home: House,
  movie: Clapperboard,
  health: Pill,
  education: BookOpen,
  utilities: Lightbulb,
  package: Package,
  shopping: ShoppingCart,
  travel: Plane,
  gaming: Gamepad2,
  clothing: Shirt,
  pets: PawPrint,
  gifts: Gift,
  work: Briefcase,
  fitness: Dumbbell,
  "🍔": UtensilsCrossed,
  "🚗": Car,
  "🏠": House,
  "🎬": Clapperboard,
  "💊": Pill,
  "📚": BookOpen,
  "💡": Lightbulb,
  "📦": Package,
  "🛒": ShoppingCart,
  "✈️": Plane,
  "🎮": Gamepad2,
  "👕": Shirt,
  "🐾": PawPrint,
  "🎁": Gift,
  "💼": Briefcase,
  "🏋️": Dumbbell,
};

interface CategoryIconProps {
  icon: string;
  className?: string;
}

export function CategoryIcon({ icon, className }: CategoryIconProps) {
  const normalized = icon?.toLowerCase?.() ?? "";
  const Icon = ICON_MAP[normalized] ?? ICON_MAP[icon] ?? Package;

  return <Icon className={cn("h-4 w-4", className)} aria-hidden="true" />;
}
