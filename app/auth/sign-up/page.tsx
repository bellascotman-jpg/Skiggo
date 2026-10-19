import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = { title: "Create your account", description: "Join Skiggo as a customer or service professional." };

type SignUpPageProps = { searchParams: Promise<{ type?: string }> };

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const initialAccountType = params.type === "provider" ? "provider" : "customer";
  return <AuthForm mode="sign-up" initialAccountType={initialAccountType} />;
}
