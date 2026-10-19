import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import {
  BriefcaseBusiness,
  CarFront,
  GraduationCap,
  House,
  Monitor,
  Palette,
  Scissors,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ServiceCategory = {
  slug: string;
  name: string;
  description: string;
  examples: string[];
  icon: LucideIcon;
};

export const serviceCategories: ServiceCategory[] = [
  { slug: "home-repairs", name: "Home repairs", description: "Repairs and improvements around your home.", examples: ["Plumbing", "Carpentry", "Handyman"], icon: House },
  { slug: "electrical-solar", name: "Electrical & solar", description: "Electrical work, installations and solar support.", examples: ["Electricians", "Solar installation", "Inverters"], icon: Zap },
  { slug: "cleaning-domestic", name: "Cleaning & domestic", description: "Keep your home or workplace clean and organised.", examples: ["Home cleaning", "Office cleaning", "Laundry"], icon: Sparkles },
  { slug: "automotive", name: "Automotive", description: "Vehicle maintenance, repairs and care.", examples: ["Mechanics", "Auto electricians", "Car wash"], icon: CarFront },
  { slug: "moving-delivery", name: "Moving, delivery & errands", description: "Help with moving items, deliveries and everyday tasks.", examples: ["Moving help", "Dispatch", "Errands"], icon: Truck },
  { slug: "beauty-personal-care", name: "Beauty & personal care", description: "Personal grooming and beauty services.", examples: ["Barbers", "Hair styling", "Makeup"], icon: Scissors },
  { slug: "education-tutoring", name: "Education & tutoring", description: "Learn a subject or build a practical skill.", examples: ["Home tutors", "Exam preparation", "Music lessons"], icon: GraduationCap },
  { slug: "digital-creative", name: "Digital & creative", description: "Creative, technical and online business support.", examples: ["Web design", "Graphic design", "IT support"], icon: Monitor },
  { slug: "business-services", name: "Business services", description: "Professional support for businesses and teams.", examples: ["Bookkeeping", "Admin support", "Consulting"], icon: BriefcaseBusiness },
  { slug: "events", name: "Events", description: "People and services to bring your event together.", examples: ["Catering", "Photography", "Event planning"], icon: Palette },
  { slug: "fashion-tailoring", name: "Fashion & tailoring", description: "Clothing alterations, tailoring and fashion services.", examples: ["Tailoring", "Alterations", "Fashion design"], icon: Scissors },
  { slug: "repairs-maintenance", name: "Repairs & maintenance", description: "Repair and maintain appliances, equipment and property.", examples: ["Appliance repair", "AC servicing", "Painting"], icon: Wrench },
  { slug: "safety-specialist", name: "Safety & specialist services", description: "Specialist help where skills and trust matter.", examples: ["Safety inspections", "Technical support", "Specialist trades"], icon: ShieldCheck },
];

type DatabaseCategory = {
  slug: string;
  name: string;
  description: string;
  examples: string[] | null;
};

const fallbackBySlug = new Map(serviceCategories.map((category) => [category.slug, category]));

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const url = SUPABASE_URL;
  const key = SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return serviceCategories;

  try {
    const response = await fetch(
      `${url}/rest/v1/service_categories?select=slug,name,description,examples&is_active=eq.true&order=sort_order.asc`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 60 },
      },
    );
    if (!response.ok) return serviceCategories;

    const rows = (await response.json()) as DatabaseCategory[];
    if (!Array.isArray(rows) || rows.length === 0) return serviceCategories;

    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      examples: Array.isArray(row.examples) ? row.examples : [],
      icon: fallbackBySlug.get(row.slug)?.icon ?? Sparkles,
    }));
  } catch {
    return serviceCategories;
  }
}
