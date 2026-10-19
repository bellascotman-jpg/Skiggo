"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const { error: signOutError } = await createSupabaseBrowserClient().auth.signOut();
      if (signOutError) throw signOutError;
      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn’t sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
    <button type="button" onClick={() => void signOut()} disabled={busy} className="btn btn-outline" style={{ minHeight: 38, padding: "8px 11px", fontSize: 12, opacity: busy ? .65 : 1 }}><LogOut size={14}/>{busy ? "Signing out…" : "Sign out"}</button>
    {error && <span role="alert" style={{ fontSize: 11, color: "#a12620" }}>{error}</span>}
  </div>;
}
