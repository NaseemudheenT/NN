import type { Metadata } from "next";
import { Awaiting } from "@/components/layout/Awaiting";

export const metadata: Metadata = {
  title: "Account",
  description: "Your orders and addresses.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Awaiting
      label="Account"
      title="Accounts are not open yet"
      body="You can buy without one — checkout takes an address and an email, and the order confirmation goes to that email. When accounts open, this is where your orders and saved addresses will live."
    />
  );
}
