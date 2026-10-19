"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  initialAccountType?: "customer" | "provider";
};

export default function AuthForm({ mode, initialAccountType = "customer" }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const configured = isSupabaseConfigured();
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<"customer" | "provider">(initialAccountType);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!configured) {
      setError("Account access is not connected yet. Skiggo needs its dedicated Supabase project URL and publishable key before authentication can work.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim(), account_type: accountType },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          setMessage("Your account is ready. Taking you back to Skiggo…");
          router.push("/");
          router.refresh();
        } else {
          setMessage("Account request received. Check your email for the confirmation link, then sign in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setMessage("You’re signed in. Taking you back to Skiggo…");
        router.push("/");
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t complete that request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", background: "radial-gradient(ellipse at 85% 8%, #d9f5e5 0%, transparent 38%), #f8fbf8" }}>
      <header style={{ padding: "20px 0" }}>
        <div className="container">
          <Link href="/" aria-label="Skiggo home" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 24, letterSpacing: "-1px" }}>
            <span style={{ display: "grid", placeItems: "center", width: 36, height: 36, background: "var(--brand)", color: "#fff", borderRadius: 11 }}>S</span>
            skiggo<span style={{ color: "var(--brand)", fontSize: 11, letterSpacing: 0, alignSelf: "end", marginBottom: 4 }}>GET IT DONE.</span>
          </Link>
        </div>
      </header>
      <section className="container" style={{ display: "grid", placeItems: "center", paddingBlock: "25px 60px" }}>
        <div style={{ width: "min(100%, 470px)", background: "#fff", border: "1px solid var(--line)", borderRadius: 22, padding: "clamp(23px,5vw,38px)", boxShadow: "0 24px 70px #173b240d" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)", fontSize: 13, marginBottom: 26 }}><ArrowLeft size={15} /> Back to Skiggo</Link>
          <div className="eyebrow">{isSignUp ? "Join Skiggo" : "Welcome back"}</div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,2.65rem)", letterSpacing: "-.055em", lineHeight: 1.08, margin: "10px 0 12px" }}>{isSignUp ? "Let’s get things done." : "Good to have you back."}</h1>
          <p className="muted" style={{ lineHeight: 1.7, margin: "0 0 25px" }}>{isSignUp ? "Create your account to get started as a customer or service professional." : "Sign in to continue to your Skiggo account."}</p>

          {!configured && (
            <div role="status" style={{ padding: 13, borderRadius: 12, background: "#fff7e7", border: "1px solid #f2d7a1", color: "#77520a", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
              Authentication setup is pending. This form is ready to connect, but it will not pretend to create or sign in accounts until the dedicated Skiggo Supabase credentials are configured.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 15 }}>
            {isSignUp && <>
              <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>
                Full name
                <span style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--line)", borderRadius: 11, padding: "0 12px" }}><UserRound size={17} color="var(--muted)" /><input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" style={{ border: 0, outline: 0, width: "100%", padding: "13px 0", background: "transparent" }} /></span>
              </label>
              <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>
                I’m joining as
                <select value={accountType} onChange={(event) => setAccountType(event.target.value as "customer" | "provider")} style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 11, padding: 13, background: "#fff", color: "var(--ink)" }}>
                  <option value="customer">Customer — I need services</option>
                  <option value="provider">Professional — I offer services</option>
                </select>
              </label>
            </>}
            <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>
              Email address
              <span style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--line)", borderRadius: 11, padding: "0 12px" }}><Mail size={17} color="var(--muted)" /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" style={{ border: 0, outline: 0, width: "100%", padding: "13px 0", background: "transparent" }} /></span>
            </label>
            <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 750 }}>
              Password
              <span style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--line)", borderRadius: 11, padding: "0 12px" }}><LockKeyhole size={17} color="var(--muted)" /><input required type="password" minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignUp ? "At least 8 characters" : "Your password"} style={{ border: 0, outline: 0, width: "100%", padding: "13px 0", background: "transparent" }} /></span>
              {isSignUp && <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>Use at least 8 characters.</span>}
            </label>

            {error && <p role="alert" style={{ margin: 0, padding: 12, borderRadius: 10, background: "#fff0ef", color: "#a12620", fontSize: 13, lineHeight: 1.6 }}>{error}</p>}
            {message && <p role="status" style={{ margin: 0, padding: 12, borderRadius: 10, background: "#edf9f0", color: "#17603f", fontSize: 13, lineHeight: 1.6, display: "flex", gap: 8, alignItems: "start" }}><CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: 1 }} />{message}</p>}

            <button className="btn btn-primary" type="submit" disabled={busy || !configured} style={{ width: "100%", marginTop: 3, opacity: busy || !configured ? .65 : 1 }}>
              {busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"} <ArrowRight size={16} />
            </button>
          </form>
          <p className="muted" style={{ fontSize: 13, textAlign: "center", lineHeight: 1.7, margin: "22px 0 0" }}>
            {isSignUp ? "Already have an account? " : "New to Skiggo? "}
            <Link href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"} style={{ color: "var(--brand)", fontWeight: 800 }}>{isSignUp ? "Sign in" : "Create an account"}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
