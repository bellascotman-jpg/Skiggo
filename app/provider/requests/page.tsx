import type { Metadata } from "next";
import ProviderRequestsBoard from "@/components/provider-requests-board";

export const metadata: Metadata = {
  title: "Open service requests",
  description: "Browse customer requests and send quotes as a verified Skiggo professional.",
};

export default function ProviderRequestsPage() {
  return <ProviderRequestsBoard />;
}
