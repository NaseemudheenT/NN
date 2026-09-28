import type { Metadata } from "next";
import { EnterConsole } from "@/components/owner/EnterConsole";

export const metadata: Metadata = {
  title: "Opening the console",
  robots: { index: false, follow: false },
};

export default function OwnerEnterPage() {
  return <EnterConsole />;
}
