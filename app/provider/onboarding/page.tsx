import type { Metadata } from "next";
import ProviderOnboardingForm from "@/components/provider-onboarding-form";

export const metadata: Metadata = {
  title: "Professional onboarding",
  description: "Create your Skiggo professional profile.",
};

export default function ProviderOnboardingPage() {
  return <ProviderOnboardingForm />;
}
