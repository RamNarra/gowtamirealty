import SessionsHub from "@/components/sessions/SessionsHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claude 2 Session Logs & Traces | Vault",
  description: "Browse, view, and download full verbatim Claude 2 execution sessions, traces, and adversarial audit findings.",
};

export default function SessionsPage() {
  return <SessionsHub />;
}
