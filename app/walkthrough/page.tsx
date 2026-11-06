import Link from "next/link";
import { SmartHomeWalkthrough } from "@/components/SmartHomeWalkthrough";

export default function WalkthroughPage() {
  return <main className="shw-page"><div className="shw-page-inner"><Link href="/">← Clinician dashboard</Link><div className="shw-page-kicker">SMART@HOME WALKTHROUGH</div><h1>From home reports to a focused visit</h1><p>Open a reported day, check its source entry, and bring useful questions into the visit. This illustration uses invented sample data.</p><SmartHomeWalkthrough /><footer>Illustrative product walkthrough · patient reports are not verified clinical findings.</footer></div></main>;
}
