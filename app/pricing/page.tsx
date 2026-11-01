import Link from "next/link";
import { ReferenceNavigation } from "../../components/landing/reference-navigation";
import "../../styles/reference-landing.css";

export const metadata = { title: "Pricing | orange UI", description: "orange UI is open source and free to use under the MIT license.", alternates: { canonical: "/pricing" } };

export default function Pricing() {
  return <div className="reference-pricing">
    <ReferenceNavigation pricing />
    <main className="reference-pricing-content"><h1>Free to build with.</h1><p>orange UI is open source, under the MIT license. Use the components in personal or commercial projects, and make the source your own.</p><p>Keep the copyright and license notice with copies of the source. Fonts and other bundled assets retain their own notices.</p><div><Link className="reference-start" href="/components">Explore components</Link><a href="https://github.com/Eshiv-Pandey/OranGe-Ui/blob/feat/next-iteration/LICENSE">Read the license</a></div></main>
    <footer className="reference-pricing-footer"><Link href="/">Back to orange UI</Link><Link href="/docs">Installation guide</Link></footer>
  </div>;
}
