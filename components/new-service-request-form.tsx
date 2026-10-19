"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Category = { id: string; name: string };

export default function NewServiceRequestForm() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [userId, setUserId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [serviceMode, setServiceMode] = useState<"onsite" | "remote" | "both">("onsite");
  const [desiredAt, setDesiredAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!configured) {
        setError("Skiggo’s Supabase URL and publishable key are not configured in the app environment yet.");
        setLoading(false);
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace("/auth/sign-in?next=%2Frequests%2Fnew");
        return;
      }
      if (!active) return;
      setUserId(authData.user.id);
      const { data: account, error: accountError } = await supabase.from("profiles").select("account_type").eq("id", authData.user.id).maybeSingle();
      if (!active) return;
      if (accountError || account?.account_type !== "customer") {
        setError("Job requests are available to customer accounts. Sign in or register as a customer to post a job.");
        setLoading(false);
        return;
      }
      const { data, error: categoryError } = await supabase.from("service_categories").select("id,name").eq("is_active", true).order("sort_order");
      if (!active) return;
      if (categoryError) setError("We couldn’t load service categories. Please refresh and try again.");
      else {
        const rows = (data ?? []) as Category[];
        setCategories(rows);
        if (rows.length) setCategoryId(rows[0].id);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [configured, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!userId || !categoryId) {
      setError("Sign in as a customer and choose a service category first.");
      return;
    }
    const min = budgetMin.trim() ? Number(budgetMin) : null;
    const max = budgetMax.trim() ? Number(budgetMax) : null;
    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))) {
      setError("Enter a valid budget in Nigerian naira, or leave it blank.");
      return;
    }
    if (min !== null && max !== null && min > max) {
      setError("The minimum budget cannot be greater than the maximum budget.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase.from("service_requests").insert({
        customer_id: userId,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        location_area: location.trim(),
        budget_min_minor: min === null ? null : Math.round(min * 100),
        budget_max_minor: max === null ? null : Math.round(max * 100),
        currency: "NGN",
        service_mode: serviceMode,
        desired_at: desiredAt ? new Date(desiredAt).toISOString() : null,
      });
      if (insertError) throw insertError;
      router.push("/requests");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t post your request. Please try again.");
      setBusy(false);
    }
  }

  const field = { width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 13px", background: "#fff", color: "var(--ink)", font: "inherit" };

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 85% 8%, #d9f5e5 0%, transparent 38%), #f8fbf8" }}>
      <header style={{ padding: "20px 0", borderBottom: "1px solid var(--line)", background: "#ffffffed" }}><div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Link href="/" style={{ fontWeight: 900, fontSize: 24 }}>skiggo<span style={{ color: "var(--brand)" }}>.</span></Link><Link href="/requests" className="btn btn-outline" style={{ minHeight: 40, paddingInline: 13 }}>My requests</Link></div></header>
      <section className="container" style={{ maxWidth: 800, padding: "30px 0 65px" }}>
        <Link href="/services" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)", fontSize: 13, marginBottom: 22 }}><ArrowLeft size={15}/> Browse services</Link>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 22, padding: "clamp(22px,4vw,38px)", boxShadow: "0 24px 70px #173b240d" }}>
          <div className="eyebrow">Tell us what you need</div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", letterSpacing: "-.055em", lineHeight: 1.08, margin: "10px 0" }}>Post a service request.</h1>
          <p className="muted" style={{ lineHeight: 1.7, margin: "0 0 24px" }}>Describe the job clearly so verified professionals can decide whether to send you a quote. Share only a town or neighbourhood here, not a private address.</p>
          {loading ? <p className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}><LoaderCircle size={17}/> Loading request form…</p> : (
            <form onSubmit={submit} style={{ display: "grid", gap: 15 }}>
              <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Service category<select required value={categoryId} onChange={e => setCategoryId(e.target.value)} style={field}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Short job title<input required minLength={3} maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Repair a leaking kitchen pipe" style={field}/></label>
              <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Describe the work<textarea required minLength={10} maxLength={5000} rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs doing? Include relevant details, materials or constraints." style={{ ...field, resize: "vertical", lineHeight: 1.65 }}/></label>
              <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Town or neighbourhood<input maxLength={180} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Yaba, Lagos" style={field}/><span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>Exact addresses should only be shared later when needed and with the chosen professional.</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Minimum budget (₦)<input type="number" min="0" step="0.01" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="Optional" style={field}/></label>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Maximum budget (₦)<input type="number" min="0" step="0.01" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="Optional" style={field}/></label>
              </div>
              <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Service delivery<select value={serviceMode} onChange={e => setServiceMode(e.target.value as typeof serviceMode)} style={field}><option value="onsite">At my location</option><option value="remote">Remote / online</option><option value="both">Open to either</option></select></label>
              <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>When do you need it? (optional)<input type="datetime-local" value={desiredAt} onChange={e => setDesiredAt(e.target.value)} style={field}/></label>
              {error && <p role="alert" style={{ margin: 0, padding: 12, borderRadius: 10, background: "#fff0ef", color: "#a12620", fontSize: 13, lineHeight: 1.6 }}>{error}</p>}
              <button type="submit" disabled={busy || !categoryId} className="btn btn-primary" style={{ width: "100%", opacity: busy || !categoryId ? .65 : 1 }}>{busy ? "Posting request…" : "Post service request"} <ArrowRight size={16}/></button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
