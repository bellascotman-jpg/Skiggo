"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, LoaderCircle, MapPin, MessageSquareQuote, Send, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type ProviderStatus = "pending" | "verified" | "rejected" | "suspended";
type Quote = { id: string; request_id: string; status: "pending" | "accepted" | "declined" | "withdrawn"; amount_minor: number; currency: string };
type Request = {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  location_area: string;
  budget_min_minor: number | null;
  budget_max_minor: number | null;
  currency: string;
  service_mode: "onsite" | "remote" | "both";
  desired_at: string | null;
  created_at: string;
  service_categories?: { name: string } | null;
};
type Draft = { amount: string; message: string; days: string };

function money(minor: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100);
}

export default function ProviderRequestsBoard() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [userId, setUserId] = useState("");
  const [verification, setVerification] = useState<ProviderStatus | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadBoard() {
    if (!configured) {
      setError("Skiggo’s Supabase connection is not configured in the app environment.");
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/auth/sign-in?next=%2Fprovider%2Frequests");
      return;
    }
    setUserId(authData.user.id);
    const { data: account, error: accountError } = await supabase.from("profiles").select("account_type").eq("id", authData.user.id).maybeSingle();
    if (accountError || account?.account_type !== "provider") {
      setError("This board is available to accounts registered as service professionals.");
      setLoading(false);
      return;
    }
    const { data: providerProfile, error: providerError } = await supabase.from("provider_profiles").select("verification_status").eq("id", authData.user.id).maybeSingle();
    if (providerError) {
      setError("We couldn’t load your professional verification status.");
      setLoading(false);
      return;
    }
    setVerification((providerProfile?.verification_status as ProviderStatus | undefined) ?? null);
    if (providerProfile?.verification_status !== "verified") {
      setRequests([]);
      setQuotes([]);
      setLoading(false);
      return;
    }
    const [requestResult, quoteResult] = await Promise.all([
      supabase.from("service_requests").select("id,customer_id,title,description,location_area,budget_min_minor,budget_max_minor,currency,service_mode,desired_at,created_at,service_categories(name)").eq("status", "open").neq("customer_id", authData.user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("service_quotes").select("id,request_id,status,amount_minor,currency").eq("provider_id", authData.user.id),
    ]);
    if (requestResult.error) setError("We couldn’t load open service requests.");
    else setRequests((requestResult.data ?? []) as unknown as Request[]);
    if (quoteResult.error) setError("We couldn’t load your existing quotes.");
    else setQuotes((quoteResult.data ?? []) as Quote[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, router]);

  function updateDraft(requestId: string, patch: Partial<Draft>) {
    setDrafts(current => ({
      ...current,
      [requestId]: { amount: "", message: "", days: "", ...current[requestId], ...patch },
    }));
  }

  async function submitQuote(event: FormEvent<HTMLFormElement>, request: Request) {
    event.preventDefault();
    setError("");
    setNotice("");
    const draft = drafts[request.id] ?? { amount: "", message: "", days: "" };
    const amount = Number(draft.amount);
    const days = draft.days.trim() ? Number(draft.days) : null;
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid quote amount in Nigerian naira.");
      return;
    }
    if (draft.message.trim().length < 5) {
      setError("Explain what your quote covers in at least 5 characters.");
      return;
    }
    if (days !== null && (!Number.isInteger(days) || days < 0 || days > 3650)) {
      setError("Enter a valid estimated number of days.");
      return;
    }
    setBusyId(request.id);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: insertError } = await supabase.from("service_quotes").insert({
        request_id: request.id,
        provider_id: userId,
        amount_minor: Math.round(amount * 100),
        currency: "NGN",
        message: draft.message.trim(),
        estimated_days: days,
      }).select("id,request_id,status,amount_minor,currency").single();
      if (insertError) throw insertError;
      setQuotes(current => [...current, data as Quote]);
      setNotice("Your quote has been sent to the customer.");
      setDrafts(current => ({ ...current, [request.id]: { amount: "", message: "", days: "" } }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t send your quote. You may already have quoted this request.");
    } finally {
      setBusyId("");
    }
  }

  async function withdrawQuote(quote: Quote) {
    setError("");
    setNotice("");
    setBusyId(quote.request_id);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.from("service_quotes").update({ status: "withdrawn" }).eq("id", quote.id).eq("status", "pending");
      if (updateError) throw updateError;
      setQuotes(current => current.map(item => item.id === quote.id ? { ...item, status: "withdrawn" } : item));
      setNotice("Your pending quote has been withdrawn.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t withdraw the quote.");
    } finally {
      setBusyId("");
    }
  }

  const field = { width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: "11px 12px", background: "#fff", color: "var(--ink)", font: "inherit" };

  return (
    <main style={{ minHeight: "100vh", background: "#f8fbf8" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}><div className="container" style={{ minHeight: 72, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}><Link href="/" style={{ fontWeight: 900, fontSize: 24 }}>skiggo<span style={{ color: "var(--brand)" }}>.</span></Link><Link href="/provider/services" className="btn btn-outline" style={{ minHeight: 40, paddingInline: 13 }}>My services</Link></div></header>
      <section className="container" style={{ maxWidth: 1050, padding: "30px 0 65px" }}>
        <Link href="/provider/services" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)", fontSize: 13, marginBottom: 20 }}><ArrowLeft size={15}/> Professional workspace</Link>
        <div style={{ marginBottom: 24 }}><div className="eyebrow">Find suitable work</div><h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: "-.055em", margin: "8px 0" }}>Open service requests</h1><p className="muted" style={{ lineHeight: 1.7, margin: 0 }}>Review the job details and send a clear quote when the work fits your skills and availability.</p></div>
        {error && <p role="alert" style={{ padding: 12, borderRadius: 10, background: "#fff0ef", color: "#a12620", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{error}</p>}
        {notice && <p role="status" style={{ padding: 12, borderRadius: 10, background: "#edf9f0", color: "#17603f", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{notice}</p>}
        {loading ? <div style={{ padding: 28, border: "1px solid var(--line)", borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", gap: 9 }} className="muted"><LoaderCircle size={18}/> Loading requests…</div> : verification !== "verified" ? <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: "clamp(24px,5vw,40px)", textAlign: "center" }}><ShieldCheck size={34} color="var(--brand)"/><h2 style={{ fontSize: 22, margin: "13px 0 8px" }}>{verification === "pending" ? "Your profile is awaiting verification" : verification === "rejected" ? "Your profile needs attention" : verification === "suspended" ? "Your provider access is paused" : "Complete your professional profile"}</h2><p className="muted" style={{ lineHeight: 1.7, maxWidth: 550, margin: "0 auto 20px" }}>Only verified professionals can browse customer requests and send quotes. Your profile will not be treated as verified until Skiggo completes its review.</p><Link href="/provider/onboarding" className="btn btn-primary">Review professional profile <ArrowRight size={16}/></Link></div> : requests.length === 0 ? <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: "38px 24px", textAlign: "center" }}><MessageSquareQuote size={30} color="var(--brand)"/><h2 style={{ fontSize: 21, margin: "12px 0 7px" }}>No open requests right now</h2><p className="muted" style={{ lineHeight: 1.7, margin: 0 }}>New customer requests will appear here when they are open for quotes.</p></div> : <div style={{ display: "grid", gap: 15 }}>{requests.map(request => {
          const quote = quotes.find(item => item.request_id === request.id);
          return <article key={request.id} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: "clamp(18px,3vw,25px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}><div><div className="muted" style={{ fontSize: 12 }}>{request.service_categories?.name ?? "Service"}{request.location_area ? ` · ${request.location_area}` : ""}</div><h2 style={{ fontSize: 21, margin: "7px 0" }}>{request.title}</h2></div><span style={{ fontSize: 11, color: "#17603f", background: "#e2f6e9", padding: "6px 10px", borderRadius: 20, height: "fit-content", fontWeight: 800 }}>Open for quotes</span></div>
            <p style={{ lineHeight: 1.75, fontSize: 14, whiteSpace: "pre-wrap", margin: "6px 0 14px" }}>{request.description}</p>
            <div className="muted" style={{ display: "flex", flexWrap: "wrap", gap: 15, fontSize: 12, borderBottom: "1px solid var(--line)", paddingBottom: 14, marginBottom: 15 }}><span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><MapPin size={14}/>{request.location_area || "Area not specified"}</span><span>Budget: {request.budget_min_minor === null && request.budget_max_minor === null ? "Not specified" : `${request.budget_min_minor === null ? "" : money(request.budget_min_minor, request.currency)}${request.budget_min_minor !== null && request.budget_max_minor !== null ? " – " : ""}${request.budget_max_minor === null ? "" : money(request.budget_max_minor, request.currency)}`}</span><span>{request.service_mode === "onsite" ? "On-site" : request.service_mode === "remote" ? "Remote" : "On-site or remote"}</span>{request.desired_at && <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><Clock3 size={14}/>Wanted {new Date(request.desired_at).toLocaleString("en-NG")}</span>}<span>Posted {new Date(request.created_at).toLocaleDateString("en-NG")}</span></div>
            {quote ? <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", padding: 13, background: "#f7faf7", borderRadius: 12 }}><div><strong style={{ fontSize: 14 }}>Your quote: {money(quote.amount_minor, quote.currency)}</strong><div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Status: <span style={{ textTransform: "capitalize" }}>{quote.status}</span></div></div>{quote.status === "pending" && <button type="button" className="btn btn-outline" disabled={busyId === request.id} onClick={() => void withdrawQuote(quote)} style={{ minHeight: 35, padding: "7px 10px", fontSize: 12 }}>Withdraw quote</button>}</div> : <form onSubmit={event => void submitQuote(event, request)} style={{ display: "grid", gap: 12, background: "#fbfdfb", border: "1px solid var(--line)", borderRadius: 13, padding: 15 }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14 }}><Send size={16} color="var(--brand)"/> Send a quote</strong>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(130px,.7fr) minmax(130px,.5fr)", gap: 10 }}><label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 750 }}>Your quote (₦)<input required type="number" min="0" step="0.01" value={drafts[request.id]?.amount ?? ""} onChange={e => updateDraft(request.id,{amount:e.target.value})} placeholder="Total amount" style={field}/></label><label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 750 }}>Estimated days<input type="number" min="0" max="3650" step="1" value={drafts[request.id]?.days ?? ""} onChange={e => updateDraft(request.id,{days:e.target.value})} placeholder="Optional" style={field}/></label></div>
              <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 750 }}>What does your quote include?<textarea required minLength={5} maxLength={3000} rows={3} value={drafts[request.id]?.message ?? ""} onChange={e => updateDraft(request.id,{message:e.target.value})} placeholder="Explain the scope, materials, exclusions and assumptions." style={{ ...field, resize: "vertical", lineHeight: 1.6 }}/></label>
              <button type="submit" disabled={busyId === request.id} className="btn btn-primary" style={{ width: "fit-content", minHeight: 38, padding: "9px 13px", fontSize: 12 }}>{busyId === request.id ? "Sending…" : "Send quote"} <ArrowRight size={15}/></button>
            </form>}
          </article>;
        })}</div>}
      </section>
    </main>
  );
}
