import type { Metadata } from "next";
import NewServiceRequestForm from "@/components/new-service-request-form";

export const metadata: Metadata = {
  title: "Post a service request",
  description: "Tell verified Skiggo professionals what job you need done.",
};

export default function NewServiceRequestPage() {
  return <NewServiceRequestForm />;
}
