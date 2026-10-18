import type { Metadata } from "next";
import { LegalPage } from "@/components/public/content/LegalPage";
import { privacyDraft } from "@/lib/content/public/legal-drafts";
export const metadata: Metadata = { title: "Privacidad · Borrador de desarrollo · KevoLint", robots: { index: false, follow: false } };
export default function PrivacyPage() { return <LegalPage document={privacyDraft}/>; }
