import type { Metadata } from "next";
import CustomerRequestsDashboard from "@/components/customer-requests-dashboard";

export const metadata: Metadata = {
  title: "Your service requests",
  description: "Track Skiggo job requests and compare professional quotes.",
};

export default function CustomerRequestsPage() {
  return <CustomerRequestsDashboard />;
}
