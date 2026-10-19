import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export type PublishedServiceListing = {
  id: string;
  title: string;
  description: string;
  pricing_type: "fixed" | "starting_at" | "quote";
  price_minor: number | string | null;
  currency: string;
  delivery_mode: "onsite" | "remote" | "both";
  service_categories?: { name: string; slug: string } | null;
  provider_profiles?: { business_name: string; service_area_text: string } | null;
};

export async function getPublishedServiceListings(query = "", location = ""): Promise<PublishedServiceListing[]> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return [];

  try {
    const endpoint = new URL("/rest/v1/service_listings", SUPABASE_URL);
    endpoint.searchParams.set(
      "select",
      "id,title,description,pricing_type,price_minor,currency,delivery_mode,service_categories(name,slug),provider_profiles(business_name,service_area_text)",
    );
    endpoint.searchParams.set("status", "eq.published");
    endpoint.searchParams.set("order", "created_at.desc");
    endpoint.searchParams.set("limit", "100");

    const response = await fetch(endpoint.toString(), {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      next: { revalidate: 30 },
    });
    if (!response.ok) return [];

    const rows = (await response.json()) as PublishedServiceListing[];
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const normalizedLocation = location.trim().toLocaleLowerCase();

    return rows.filter((listing) => {
      const searchable = [
        listing.title,
        listing.description,
        listing.service_categories?.name ?? "",
        listing.provider_profiles?.business_name ?? "",
        listing.provider_profiles?.service_area_text ?? "",
      ].join(" ").toLocaleLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const area = (listing.provider_profiles?.service_area_text ?? "").toLocaleLowerCase();
      const matchesLocation =
        !normalizedLocation ||
        area.includes(normalizedLocation) ||
        listing.delivery_mode === "remote" ||
        listing.delivery_mode === "both";
      return matchesQuery && matchesLocation;
    });
  } catch {
    return [];
  }
}
