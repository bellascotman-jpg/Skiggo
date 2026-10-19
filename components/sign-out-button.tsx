"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      const { error } = await createSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return <button type="button" onClick={() => void signOut()} disabled={busy} className="btn btn-outline" style={{ minHeight: 38, padding: "8px 11px", fontSize: 12, opacity: busy ? .65 : 1 }}><LogOut size={14}/>{busy ? "Signing out…" : "Sign out"}</button>;
}
