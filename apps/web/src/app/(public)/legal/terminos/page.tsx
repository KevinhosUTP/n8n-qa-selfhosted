import type { Metadata } from "next";
import { LegalPage } from "@/components/public/content/LegalPage";
import { termsDraft } from "@/lib/content/public/legal-drafts";
export const metadata: Metadata = { title: "Términos · Borrador de desarrollo · KevoLint", robots: { index: false, follow: false } };
export default function TermsPage() { return <LegalPage document={termsDraft}/>; }
