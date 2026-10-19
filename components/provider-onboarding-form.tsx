"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type ProviderProfile = {
  business_name: string;
  bio: string;
  years_experience: number;
  service_area_text: string;
  accepts_requests: boolean;
  verification_status: "pending" | "verified" | "rejected" | "suspended";
};

const blankProfile: ProviderProfile = {
  business_name: "",
  bio: "",
  years_experience: 0,
  service_area_text: "",
  accepts_requests: true,
  verification_status: "pending",
};

export default function ProviderOnboardingForm() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [profile, setProfile] = useState<ProviderProfile>(blankProfile);
  const [userId, setUserId] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!configured) {
        setError("Skiggo’s Supabase connection is not configured in the app environment yet.");
        setLoading(false);
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace("/auth/sign-in?next=%2Fprovider%2Fonboarding");
        return;
      }
      if (!active) return;
      setUserId(authData.user.id);

      const { data: account, error: accountError } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", authData.user.id)
        .maybeSingle();
      if (!active) return;
      if (accountError) {
        setError("We couldn’t load your account profile. Please refresh and try again.");
        setLoading(false);
        return;
      }
      if (account?.account_type !== "provider") {
        setError("This account is registered as a customer. Create or sign in to an account registered as a service professional to continue.");
        setLoading(false);
        return;
      }

      const { data: existing, error: providerError } = await supabase
        .from("provider_profiles")
        .select("business_name,bio,years_experience,service_area_text,accepts_requests,verification_status")
        .eq("id", authData.user.id)
        .maybeSingle();
      if (!active) return;
      if (providerError) {
        setError("We couldn’t load your professional profile. Please try again.");
      } else if (existing) {
        setProfile(existing as ProviderProfile);
        setHasProfile(true);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [configured, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    if (!configured || !userId) {
      setError("Sign in with your professional account before saving your profile.");
      return;
    }
    if (profile.business_name.trim().length < 2) {
      setError("Enter a business or professional name with at least 2 characters.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        business_name: profile.business_name.trim(),
        bio: profile.bio.trim(),
        years_experience: Number(profile.years_experience),
        service_area_text: profile.service_area_text.trim(),
        accepts_requests: profile.accepts_requests,
      };
      const result = hasProfile
        ? await supabase.from("provider_profiles").update(payload).eq("id", userId)
        : await supabase.from("provider_profiles").insert({ id: userId, ...payload });
      if (result.error) throw result.error;

      setHasProfile(true);
      setProfile((current) => ({ ...current, ...payload }));
      setNotice("Your professional profile has been saved. It is pending review; it will not appear in public search until Skiggo verifies it.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = { width: "100%", border: "1px solid var(--line)", borderRadius: 11, padding: "13px 14px", background: "#fff", color: "var(--ink)", font: "inherit" };

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 85% 8%, #d9f5e5 0%, transparent 38%), #f8fbf8" }}>
      <header style={{ padding: "20px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 24, letterSpacing: "-1px" }}><span style={{ display: "grid", placeItems: "center", width: 36, height: 36, background: "var(--brand)", color: "#fff", borderRadius: 11 }}>S</span>skiggo<span style={{ color: "var(--brand)", fontSize: 11, letterSpacing: 0 }}>GET IT DONE.</span></Link>
          <Link href="/" className="btn btn-outline" style={{ minHeight: 40, paddingInline: 13 }}>Marketplace</Link>
        </div>
      </header>
      <section className="container" style={{ padding: "28px 0 70px", maxWidth: 900 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)", fontSize: 13, marginBottom: 24 }}><ArrowLeft size={15}/> Back to Skiggo</Link>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(230px,.85fr)", gap: 22, alignItems: "start" }} className="provider-onboarding-grid">
          <section style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 22, padding: "clamp(22px,4vw,36px)", boxShadow: "0 24px 70px #173b240d" }}>
            <div className="eyebrow">Professional onboarding</div>
            <h1 style={{ fontSize: "clamp(2rem,4.5vw,3rem)", lineHeight: 1.06, letterSpacing: "-.055em", margin: "12px 0" }}>Tell customers what you do.</h1>
            <p className="muted" style={{ lineHeight: 1.75, margin: "0 0 24px" }}>Create your professional profile. We keep new profiles out of public search until the verification process is complete.</p>
            {loading ? <p className="muted" style={{ display: "flex", alignItems: "center", gap: 9 }}><LoaderCircle size={17}/> Loading your account…</p> : (
              <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Business or professional name
                  <input required minLength={2} maxLength={120} value={profile.business_name} onChange={(e) => setProfile(p => ({ ...p, business_name: e.target.value }))} placeholder="e.g. Ade Repairs & Maintenance" style={inputStyle}/>
                </label>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>About your work
                  <textarea maxLength={2000} rows={5} value={profile.bio} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Describe your services, experience and what customers can expect." style={{ ...inputStyle, resize: "vertical", lineHeight: 1.65 }}/>
                </label>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Years of experience
                  <input type="number" min={0} max={100} value={profile.years_experience} onChange={(e) => setProfile(p => ({ ...p, years_experience: Number(e.target.value) }))} style={inputStyle}/>
                </label>
                <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>Service areas
                  <input maxLength={250} value={profile.service_area_text} onChange={(e) => setProfile(p => ({ ...p, service_area_text: e.target.value }))} placeholder="e.g. Ikeja, Yaba and Surulere, Lagos" style={inputStyle}/>
                  <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>Use towns or neighbourhoods, not a private home address.</span>
                </label>
                <label style={{ display: "flex", alignItems: "start", gap: 10, fontSize: 13, lineHeight: 1.6 }}>
                  <input type="checkbox" checked={profile.accepts_requests} onChange={(e) => setProfile(p => ({ ...p, accepts_requests: e.target.checked }))} style={{ marginTop: 4 }}/>
                  I’m currently available to receive suitable service requests.
                </label>
                {error && <p role="alert" style={{ margin: 0, padding: 12, borderRadius: 10, background: "#fff0ef", color: "#a12620", fontSize: 13, lineHeight: 1.6 }}>{error}</p>}
                {notice && <p role="status" style={{ margin: 0, padding: 12, borderRadius: 10, background: "#edf9f0", color: "#17603f", fontSize: 13, lineHeight: 1.6, display: "flex", gap: 8 }}><CheckCircle2 size={17} style={{ flexShrink: 0 }}/>{notice}</p>}
                <button type="submit" className="btn btn-primary" disabled={busy || !userId} style={{ width: "100%", opacity: busy || !userId ? .65 : 1 }}>{busy ? "Saving profile…" : hasProfile ? "Save changes" : "Submit professional profile"} <ArrowRight size={16}/></button>
              </form>
            )}
          </section>
          <aside style={{ border: "1px solid var(--line)", borderRadius: 18, padding: 22, background: "#fff" }}>
            <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 14, background: "#eaf7ee", color: "var(--brand)", marginBottom: 16 }}><ShieldCheck size={24}/></span>
            <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Verification comes first</h2>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>Submitting this form does not mark you as verified. Skiggo controls verification separately, and only verified professionals can publish public listings or send quotes.</p>
            {hasProfile && <div style={{ borderTop: "1px solid var(--line)", marginTop: 18, paddingTop: 16 }}><div className="eyebrow">Current status</div><p style={{ margin: "8px 0 0", fontWeight: 800, textTransform: "capitalize" }}>{profile.verification_status.replaceAll("_", " ")}</p></div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 15, marginTop: 20 }}><Link href="/provider/services" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--brand)", fontWeight: 750, fontSize: 13 }}>Manage services <ArrowRight size={15}/></Link><Link href="/provider/requests" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--brand)", fontWeight: 750, fontSize: 13 }}>Open requests <ArrowRight size={15}/></Link></div>
          </aside>
        </div>
      </section>
      <style>{`@media(max-width:760px){.provider-onboarding-grid{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}
