import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your Skiggo account." };

export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}
