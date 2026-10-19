import type { Metadata } from "next";
import ProviderServicesManager from "@/components/provider-services-manager";

export const metadata: Metadata = {
  title: "Manage services",
  description: "Create and manage your Skiggo service listings.",
};

export default function ProviderServicesPage() {
  return <ProviderServicesManager />;
}
