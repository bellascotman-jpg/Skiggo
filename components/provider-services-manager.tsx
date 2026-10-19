"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, CirclePlus, LoaderCircle, PauseCircle, PlayCircle, Wrench } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Category = { id: string; name: string; slug: string };
type Listing = {
  id: string;
  title: string;
  description: string;
  pricing_type: "fixed" | "starting_at" | "quote";
  price_minor: number | null;
  currency: string;
  delivery_mode: "onsite" | "remote" | "both";
  status: "draft" | "published" | "paused" | "archived";
  created_at: string;
  service_categories?: { name: string } | null;
};
type ProviderState = { verification_status: "pending" | "verified" | "rejected" | "suspended" };

export default function ProviderServicesManager() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [userId, setUserId] = useState("");
  const [provider, setProvider] = useState<ProviderState | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pricingType, setPricingType] = useState<"fixed" | "starting_at" | "quote">("quote");
  const [price, setPrice] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"onsite" | "remote" | "both">("onsite");
  const [publishNow, setPublishNow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    if (!configured) {
      setError("Skiggo’s Supabase connection is not configured in the app environment.");
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/auth/sign-in?next=%2Fprovider%2Fservices");
      return;
    }
    setUserId(authData.user.id);
    const { data: account, error: accountError } = await supabase.from("profiles").select("account_type").eq("id", authData.user.id).maybeSingle();
    if (accountError || account?.account_type !== "provider") {
      setError("This area is for accounts registered as service professionals.");
      setLoading(false);
      return;
    }

    const [providerResult, categoryResult, listingResult] = await Promise.all([
      supabase.from("provider_profiles").select("verification_status").eq("id", authData.user.id).maybeSingle(),
      supabase.from("service_categories").select("id,name,slug").eq("is_active", true).order("sort_order"),
      supabase.from("service_listings").select("id,title,description,pricing_type,price_minor,currency,delivery_mode,status,created_at,service_categories(name)").eq("provider_id", authData.user.id).order("created_at", { ascending: false }),
    ]);
    if (providerResult.error) setError("We couldn’t load your verification status.");
    else setProvider(providerResult.data as ProviderState | null);
    if (categoryResult.error) setError("We couldn’t load service categories. Refresh and try again.");
    else {
      const loadedCategories = (categoryResult.data ?? []) as Category[];
      setCategories(loadedCategories);
      if (loadedCategories.length) setCategoryId(current => current || loadedCategories[0].id);
    }
    if (listingResult.error) setError("We couldn’t load your service listings.");
    else setListings((listingResult.data ?? []) as unknown as Listing[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
    // loadData is deliberately run once on mount; refresh is called after mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, router]);

  async function createListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    if (!userId || !provider) {
      setError("Complete your professional profile before adding a service.");
      return;
    }
    if (publishNow && provider.verification_status !== "verified") {
      setError("Your profile must be verified before a service can be published. Save it as a draft for now.");
      return;
    }
    if (pricingType !== "quote" && (!price.trim() || !Number.isFinite(Number(price)) || Number(price) < 0)) {
      setError("Enter a valid price in Nigerian naira, or select Request a quote.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const priceMinor = pricingType === "quote" ? null : Math.round(Number(price) * 100);
      const { data, error: insertError } = await supabase.from("service_listings").insert({
        provider_id: userId,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        pricing_type: pricingType,
        price_minor: priceMinor,
        currency: "NGN",
        delivery_mode: deliveryMode,
        status: publishNow ? "published" : "draft",
      }).select("id,title,description,pricing_type,price_minor,currency,delivery_mode,status,created_at,service_categories(name)").single();
      if (insertError) throw insertError;
      setListings(current => [data as unknown as Listing, ...current]);
      setTitle("");
      setDescription("");
      setPricingType("quote");
      setPrice("");
      setDeliveryMode("onsite");
      setPublishNow(false);
      setNotice(publishNow ? "Your service has been published." : "Your service draft has been saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t save this service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(listing: Listing, status: Listing["status"]) {
    setNotice("");
    setError("");
    if (status === "published" && provider?.verification_status !== "verified") {
      setError("Only verified professionals can publish services.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.from("service_listings").update({ status }).eq("id", listing.id).eq("provider_id", userId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setListings(current => current.map(item => item.id === listing.id ? { ...item, status } : item));
    setNotice(`“${listing.title}” is now ${status}.`);
  }

  const inputStyle = { width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 13px", background: "#fff", color: "var(--ink)", font: "inherit" };

  return (
    <main style={{ minHeight: "100vh", background: "#f8fbf8" }}>
      <header style={{ borderBottom: "1px solid var(--line)", background: "#fff" }}><div className="container" style={{ minHeight: 72, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}><Link href="/" style={{ fontWeight: 900, fontSize: 24 }}>skiggo<span style={{ color: "var(--brand)" }}>.</span></Link><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Link href="/provider/requests" className="btn btn-primary" style={{ minHeight: 40, paddingInline: 13 }}>Open requests</Link><Link href="/provider/onboarding" className="btn btn-outline" style={{ minHeight: 40, paddingInline: 13 }}>Professional profile</Link></div></div></header>
      <section className="container" style={{ padding: "30px 0 65px", maxWidth: 1100 }}>
        <Link href="/provider/onboarding" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--muted)", marginBottom: 20 }}><ArrowLeft size={15}/> Back to profile</Link>
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 26 }}>
          <div><div className="eyebrow">Professional workspace</div><h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: "-.055em", margin: "8px 0" }}>Your service listings</h1><p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>Describe what you offer, set transparent pricing or invite a quote, and manage publication status.</p></div>
          {provider && <div style={{ border: "1px solid var(--line)", background: "#fff", borderRadius: 13, padding: "12px 15px", display: "flex", gap: 9, alignItems: "center", fontSize: 13 }}><ShieldStatus status={provider.verification_status}/><span style={{ textTransform: "capitalize" }}>{provider.verification_status.replace(/_/g, " ")} profile</span></div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, .9fr) minmax(0, 1.1fr)", gap: 20, alignItems: "start" }} className="provider-listing-grid">
          <section style={{ border: "1px solid var(--line)", borderRadius: 18, background: "#fff", padding: "clamp(20px,3vw,28px)" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 19, margin: "0 0 8px" }}><CirclePlus size={20} color="var(--brand)"/> Add a service</h2>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.65, margin: "0 0 20px" }}>Use clear titles and accurate details. Prices are entered in naira and stored as integer kobo.</p>
            {loading ? <p className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}><LoaderCircle size={17}/> Loading workspace…</p> : !provider ? <p className="muted" style={{ lineHeight: 1.7 }}>Create your professional profile first, then return here to add services. <Link href="/provider/onboarding" style={{ color: "var(--brand)", fontWeight: 800 }}>Open onboarding</Link></p> : (
              <form onSubmit={createListing} style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Service title<input required minLength={3} maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Home plumbing repairs" style={inputStyle}/></label>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Category<select required value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Description<textarea required minLength={10} maxLength={5000} rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain what is included, what is not included and any requirements." style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}/></label>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Pricing<select value={pricingType} onChange={e => setPricingType(e.target.value as typeof pricingType)} style={inputStyle}><option value="quote">Request a quote</option><option value="fixed">Fixed price</option><option value="starting_at">Starting at</option></select></label>
                {pricingType !== "quote" && <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Price (₦)<input required type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 15000" style={inputStyle}/></label>}
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Delivery method<select value={deliveryMode} onChange={e => setDeliveryMode(e.target.value as typeof deliveryMode)} style={inputStyle}><option value="onsite">At the customer’s location</option><option value="remote">Remote / online</option><option value="both">On-site or remote</option></select></label>
                <label style={{ display: "flex", gap: 10, alignItems: "start", fontSize: 13, lineHeight: 1.6 }}><input type="checkbox" checked={publishNow} disabled={provider.verification_status !== "verified"} onChange={e => setPublishNow(e.target.checked)} style={{ marginTop: 4 }}/> Publish immediately (available only after verification). Otherwise save as a draft.</label>
                {error && <p role="alert" style={{ margin: 0, padding: 11, borderRadius: 10, background: "#fff0ef", color: "#a12620", fontSize: 12, lineHeight: 1.6 }}>{error}</p>}
                {notice && <p role="status" style={{ margin: 0, padding: 11, borderRadius: 10, background: "#edf9f0", color: "#17603f", fontSize: 12, lineHeight: 1.6 }}>{notice}</p>}
                <button type="submit" className="btn btn-primary" disabled={busy || !categoryId} style={{ width: "100%", opacity: busy || !categoryId ? .65 : 1 }}>{busy ? "Saving service…" : "Save service"} <ArrowRight size={16}/></button>
              </form>
            )}
          </section>
          <section>
            <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 14, marginBottom: 14 }}><div><div className="eyebrow">Your catalogue</div><h2 style={{ fontSize: 22, margin: "7px 0 0" }}>Manage listings <span className="muted" style={{ fontSize: 14 }}>({listings.length})</span></h2></div></div>
            {loading ? <div style={{ padding: 30, background: "#fff", border: "1px solid var(--line)", borderRadius: 16 }} className="muted">Loading listings…</div> : listings.length === 0 ? <div style={{ padding: "30px 24px", background: "#fff", border: "1px solid var(--line)", borderRadius: 16, textAlign: "center" }}><Wrench size={27} color="var(--brand)"/><h3 style={{ margin: "12px 0 7px" }}>No services yet</h3><p className="muted" style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>Your saved services will appear here. Start with one service you can reliably deliver.</p></div> : <div style={{ display: "grid", gap: 12 }}>{listings.map(listing => <article key={listing.id} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}><div><div className="muted" style={{ fontSize: 11, marginBottom: 5 }}>{listing.service_categories?.name ?? "Service"}</div><h3 style={{ fontSize: 17, margin: "0 0 8px" }}>{listing.title}</h3><p className="muted" style={{ fontSize: 12, lineHeight: 1.6, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{listing.description}</p><div style={{ fontWeight: 850, fontSize: 14 }}>{listing.pricing_type === "quote" ? "Request a quote" : `${listing.pricing_type === "starting_at" ? "From " : ""}₦${((listing.price_minor ?? 0) / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}</div></div><span style={{ flexShrink: 0, borderRadius: 20, padding: "5px 9px", fontSize: 10, fontWeight: 800, background: listing.status === "published" ? "#e2f6e9" : "#f0f2f1", color: listing.status === "published" ? "#17603f" : "#657168", textTransform: "capitalize" }}>{listing.status}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 13 }}><span className="muted" style={{ fontSize: 11 }}>{listing.delivery_mode === "onsite" ? "On-site" : listing.delivery_mode === "remote" ? "Remote" : "On-site or remote"}</span>{listing.status !== "archived" && <button type="button" onClick={() => void changeStatus(listing, listing.status === "published" ? "paused" : "published")} disabled={listing.status !== "published" && provider?.verification_status !== "verified"} className="btn btn-outline" style={{ minHeight: 34, padding: "6px 10px", fontSize: 11, opacity: listing.status !== "published" && provider?.verification_status !== "verified" ? .55 : 1 }}>{listing.status === "published" ? <><PauseCircle size={14}/> Pause listing</> : <><PlayCircle size={14}/> Publish listing</>}</button>}</div>
            </article>)}</div>}
            {!loading && !provider && <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>Complete <Link href="/provider/onboarding" style={{ color: "var(--brand)", fontWeight: 800 }}>professional onboarding</Link> to unlock service management.</p>}
          </section>
        </div>
      </section>
      <style>{`@media(max-width:850px){.provider-listing-grid{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}

function ShieldStatus({ status }: { status: ProviderState["verification_status"] }) {
  return <span style={{ display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 9, background: status === "verified" ? "#e2f6e9" : "#fff5df", color: status === "verified" ? "#17603f" : "#8a6418" }}>{status === "verified" ? <BadgeCheck size={16}/> : <Wrench size={15}/>}</span>;
}
