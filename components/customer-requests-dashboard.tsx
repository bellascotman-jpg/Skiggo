"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, LoaderCircle, MessageSquareQuote } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Quote = {
  id: string;
  amount_minor: number;
  currency: string;
  message: string;
  estimated_days: number | null;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  created_at: string;
  provider_profiles?: { business_name: string } | null;
};
type Request = {
  id: string;
  title: string;
  description: string;
  location_area: string;
  budget_min_minor: number | null;
  budget_max_minor: number | null;
  currency: string;
  status: "open" | "awarded" | "cancelled" | "completed" | "closed";
  created_at: string;
  desired_at: string | null;
  service_categories?: { name: string } | null;
  service_quotes?: Quote[];
};

function money(minor: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100);
}

export default function CustomerRequestsDashboard() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyQuote, setBusyQuote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadRequests() {
    if (!configured) {
      setError("Skiggo’s Supabase connection is not configured in the app environment.");
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/auth/sign-in?next=%2Frequests");
      return;
    }
    const { data: account, error: accountError } = await supabase.from("profiles").select("account_type").eq("id", authData.user.id).maybeSingle();
    if (accountError || account?.account_type !== "customer") {
      setError("This workspace is for customer accounts. Sign in as a customer to view your requests.");
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from("service_requests")
      .select("id,title,description,location_area,budget_min_minor,budget_max_minor,currency,status,created_at,desired_at,service_categories(name),service_quotes(id,amount_minor,currency,message,estimated_days,status,created_at,provider_profiles(business_name))")
      .eq("customer_id", authData.user.id)
      .order("created_at", { ascending: false });
    if (queryError) setError("We couldn’t load your requests. Please refresh and try again.");
    else setRequests((data ?? []) as unknown as Request[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, router]);

  async function decideQuote(quoteId: string, status: "accepted" | "declined") {
    setError("");
    setNotice("");
    setBusyQuote(quoteId);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.from("service_quotes").update({ status }).eq("id", quoteId).eq("status", "pending");
      if (updateError) throw updateError;
      setNotice(status === "accepted" ? "Quote accepted. The request has been awarded and other pending quotes closed." : "Quote declined.");
      setLoading(true);
      await loadRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t update that quote. Refresh and try again.");
    } finally {
      setBusyQuote("");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fbf8" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}><div className="container" style={{ minHeight: 72, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}><Link href="/" style={{ fontWeight: 900, fontSize: 24 }}>skiggo<span style={{ color: "var(--brand)" }}>.</span></Link><Link href="/requests/new" className="btn btn-primary" style={{ minHeight: 40, paddingInline: 13 }}>Post a request <ArrowRight size={15}/></Link></div></header>
      <section className="container" style={{ padding: "30px 0 65px", maxWidth: 1000 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)", fontSize: 13, marginBottom: 20 }}><ArrowLeft size={15}/> Back to marketplace</Link>
        <div style={{ marginBottom: 24 }}><div className="eyebrow">Customer workspace</div><h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: "-.055em", margin: "8px 0" }}>Your service requests</h1><p className="muted" style={{ lineHeight: 1.7, margin: 0 }}>Track your job requests and compare quotes from verified professionals.</p></div>
        {error && <p role="alert" style={{ padding: 12, borderRadius: 10, background: "#fff0ef", color: "#a12620", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{error}</p>}
        {notice && <p role="status" style={{ padding: 12, borderRadius: 10, background: "#edf9f0", color: "#17603f", fontSize: 13, lineHeight: 1.6, marginBottom: 16, display: "flex", gap: 8 }}><CheckCircle2 size={17}/>{notice}</p>}
        {loading ? <div style={{ padding: 30, border: "1px solid var(--line)", borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", gap: 9 }} className="muted"><LoaderCircle size={18}/> Loading your requests…</div> : requests.length === 0 ? <div style={{ textAlign: "center", background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: "42px 24px" }}><ClipboardList size={32} color="var(--brand)"/><h2 style={{ fontSize: 22, margin: "13px 0 8px" }}>Your next job starts here</h2><p className="muted" style={{ lineHeight: 1.7, maxWidth: 500, margin: "0 auto 20px" }}>Post a request with the details, budget and area. Verified professionals can respond with quotes.</p><Link href="/requests/new" className="btn btn-primary">Post a service request <ArrowRight size={16}/></Link></div> : (
          <div style={{ display: "grid", gap: 16 }}>{requests.map(request => {
            const quotes = request.service_quotes ?? [];
            return <article key={request.id} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: "clamp(18px,3vw,25px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 15, flexWrap: "wrap" }}><div><div className="muted" style={{ fontSize: 12 }}>{request.service_categories?.name ?? "Service"}{request.location_area ? ` · ${request.location_area}` : ""}</div><h2 style={{ fontSize: 21, margin: "7px 0" }}>{request.title}</h2><p className="muted" style={{ fontSize: 13, lineHeight: 1.7, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{request.description}</p></div><span style={{ borderRadius: 20, padding: "6px 10px", background: request.status === "awarded" ? "#e2f6e9" : "#f0f2f1", color: request.status === "awarded" ? "#17603f" : "#59665d", fontSize: 11, fontWeight: 800, textTransform: "capitalize", flexShrink: 0 }}>{request.status}</span></div>
              <div className="muted" style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, borderBottom: "1px solid var(--line)", paddingBottom: 14, marginBottom: 15 }}><span>Budget: {request.budget_min_minor === null && request.budget_max_minor === null ? "Not specified" : `${request.budget_min_minor === null ? "" : money(request.budget_min_minor, request.currency)}${request.budget_min_minor !== null && request.budget_max_minor !== null ? " – " : ""}${request.budget_max_minor === null ? "" : money(request.budget_max_minor, request.currency)}`}</span><span>{quotes.length} {quotes.length === 1 ? "quote" : "quotes"}</span><span>Posted {new Date(request.created_at).toLocaleDateString("en-NG")}</span></div>
              {quotes.length === 0 ? <p className="muted" style={{ fontSize: 13, margin: 0 }}>No quotes yet. Verified professionals can respond while this request is open.</p> : <div style={{ display: "grid", gap: 10 }}><h3 style={{ fontSize: 15, margin: 0, display: "flex", alignItems: "center", gap: 8 }}><MessageSquareQuote size={17} color="var(--brand)"/> Quotes received</h3>{quotes.map(quote => <div key={quote.id} style={{ border: "1px solid var(--line)", borderRadius: 13, padding: 15, background: "#fcfdfc" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}><div><strong style={{ fontSize: 14 }}>{quote.provider_profiles?.business_name ?? "Verified professional"}</strong><div style={{ fontSize: 19, fontWeight: 900, marginTop: 6 }}>{money(quote.amount_minor, quote.currency)}</div></div><span style={{ fontSize: 11, fontWeight: 800, textTransform: "capitalize", color: quote.status === "accepted" ? "#17603f" : "var(--muted)" }}>{quote.status}</span></div><p style={{ fontSize: 13, lineHeight: 1.7, margin: "10px 0" }}>{quote.message}</p><div className="muted" style={{ fontSize: 11, marginBottom: 12 }}>{quote.estimated_days === null ? "Timeline to be agreed" : `Estimated ${quote.estimated_days} day${quote.estimated_days === 1 ? "" : "s"}`}</div>{request.status === "open" && quote.status === "pending" && <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}><button type="button" className="btn btn-primary" disabled={busyQuote === quote.id} onClick={() => void decideQuote(quote.id, "accepted")} style={{ minHeight: 36, padding: "8px 12px", fontSize: 12 }}>{busyQuote === quote.id ? "Updating…" : "Accept quote"} <CheckCircle2 size={15}/></button><button type="button" className="btn btn-outline" disabled={busyQuote === quote.id} onClick={() => void decideQuote(quote.id, "declined")} style={{ minHeight: 36, padding: "8px 12px", fontSize: 12 }}>Decline</button></div>}</div>)}</div>}
            </article>;
          })}</div>
        )}
      </section>
    </main>
  );
}
