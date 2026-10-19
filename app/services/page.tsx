import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin, Search, Sparkles } from "lucide-react";
import { getServiceCategories } from "@/lib/service-categories";

export const metadata: Metadata = {
  title: "Explore services",
  description: "Explore service categories on Skiggo and find the right kind of professional for your job.",
};

type ServicesPageProps = {
  searchParams: Promise<{ q?: string; location?: string }>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const categories = await getServiceCategories();
  const query = params.q?.trim() ?? "";
  const location = params.location?.trim() ?? "";
  const normalizedQuery = query.toLocaleLowerCase();
  const matchingCategories = normalizedQuery
    ? serviceCategories.filter((category) =>
        [category.name, category.description, ...category.examples]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
    : categories;

  return (
    <main>
      <header style={{ borderBottom: "1px solid var(--line)", background: "#ffffffed" }}>
        <div className="container" style={{ minHeight: 74, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <Link href="/" aria-label="Skiggo home" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 24, letterSpacing: "-1px" }}>
            <span style={{ display: "grid", placeItems: "center", width: 36, height: 36, background: "var(--brand)", color: "#fff", borderRadius: 11 }}>S</span>
            skiggo<span style={{ color: "var(--brand)", fontSize: 11, letterSpacing: 0, alignSelf: "end", marginBottom: 4 }}>GET IT DONE.</span>
          </Link>
          <Link href="/" className="btn btn-outline" style={{ minHeight: 40, paddingInline: 13 }}><ArrowLeft size={16} /> Back home</Link>
        </div>
      </header>

      <section style={{ background: "radial-gradient(ellipse at 84% 10%, #d9f5e5 0%, transparent 42%), linear-gradient(135deg,#f7fbf7,#fff 65%)", padding: "clamp(42px,7vw,76px) 0 48px" }}>
        <div className="container" style={{ maxWidth: 980 }}>
          <div className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#e2f6e9", padding: "9px 12px", borderRadius: 30 }}>
            <Sparkles size={15} /> Explore the marketplace
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem,6vw,4rem)", lineHeight: 1.04, letterSpacing: "-.06em", maxWidth: 760, margin: "20px 0 14px" }}>
            What do you need <span style={{ color: "var(--brand)" }}>done?</span>
          </h1>
          <p className="muted" style={{ fontSize: 17, lineHeight: 1.75, maxWidth: 680, margin: "0 0 25px" }}>
            Explore service types, narrow down what you need, and tell us where the job is. Skiggo is being built for clear requests, comparable quotes and confident hiring.
          </p>

          <form action="/services" method="get" style={{ display: "flex", flexWrap: "wrap", gap: 8, background: "#fff", padding: 9, border: "1px solid var(--line)", borderRadius: 15, boxShadow: "0 16px 45px #173b2410" }}>
            <label style={{ flex: "1 1 220px", display: "flex", alignItems: "center", gap: 10, padding: "0 10px" }}>
              <Search size={19} color="var(--brand)" />
              <input name="q" defaultValue={query} aria-label="Search service types" placeholder="Try plumbing, cleaning or web design" style={{ border: 0, outline: 0, width: "100%", minWidth: 0, padding: "13px 0", background: "transparent" }} />
            </label>
            <label style={{ flex: "0 1 175px", display: "flex", alignItems: "center", gap: 8, borderLeft: "1px solid var(--line)", paddingLeft: 12 }}>
              <MapPin size={18} color="var(--brand)" />
              <input name="location" defaultValue={location} aria-label="Town or area" placeholder="Town or area" style={{ border: 0, outline: 0, width: "100%", minWidth: 0, padding: "13px 0", background: "transparent" }} />
            </label>
            <button className="btn btn-primary" type="submit">Explore services <ArrowRight size={16} /></button>
          </form>
          <p className="muted" style={{ fontSize: 12, margin: "12px 2px 0" }}>Search currently filters the service catalogue. Live provider listings will appear only after real marketplace data is connected.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <div>
              <div className="eyebrow">{query ? "Catalogue results" : "Browse by category"}</div>
              <h2 style={{ fontSize: "clamp(1.7rem,3.5vw,2.35rem)", letterSpacing: "-.045em", margin: "8px 0" }}>
                {query ? `Services related to “${query}”` : "Find the right kind of help"}
              </h2>
              <p className="muted" style={{ margin: 0 }}>{matchingCategories.length} {matchingCategories.length === 1 ? "category" : "categories"} {query ? "match your search" : "to explore"}.{location ? ` Location entered: ${location}.` : ""}</p>
            </div>
            {query && <Link href={location ? `/services?location=${encodeURIComponent(location)}` : "/services"} style={{ color: "var(--brand)", fontWeight: 750 }}>Clear search</Link>}
          </div>

          {matchingCategories.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,255px),1fr))", gap: 15 }}>
              {matchingCategories.map(({ slug, name, description, examples, icon: Icon }) => (
                <article key={slug} style={{ border: "1px solid var(--line)", borderRadius: 17, padding: 21, display: "flex", flexDirection: "column", minHeight: 222, background: "#fff" }}>
                  <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 14, background: "#eaf7ee", color: "var(--brand)", marginBottom: 17 }}><Icon size={23} /></span>
                  <h3 style={{ fontSize: 17, margin: "0 0 7px", letterSpacing: "-.02em" }}>{name}</h3>
                  <p className="muted" style={{ fontSize: 13, lineHeight: 1.65, margin: "0 0 13px" }}>{description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto", marginBottom: 16 }}>
                    {examples.map((example) => <Link key={example} href={`/services?q=${encodeURIComponent(example)}${location ? `&location=${encodeURIComponent(location)}` : ""}`} style={{ border: "1px solid var(--line)", borderRadius: 30, padding: "5px 9px", fontSize: 11, color: "var(--muted)" }}>{example}</Link>)}
                  </div>
                  <Link href={`/services?q=${encodeURIComponent(name)}${location ? `&location=${encodeURIComponent(location)}` : ""}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--brand)", fontSize: 13, fontWeight: 800 }}>Explore category <ArrowRight size={15} /></Link>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ border: "1px solid var(--line)", borderRadius: 18, padding: "clamp(24px,5vw,42px)", background: "var(--surface)", textAlign: "center" }}>
              <span style={{ display: "inline-grid", placeItems: "center", width: 54, height: 54, borderRadius: 16, background: "#e2f6e9", color: "var(--brand)" }}><Search size={24} /></span>
              <h3 style={{ fontSize: 21, margin: "16px 0 8px" }}>No category matched that search</h3>
              <p className="muted" style={{ lineHeight: 1.7, maxWidth: 520, margin: "0 auto 18px" }}>Try a broader term, such as “repairs”, “cleaning” or “digital”, or browse all service categories.</p>
              <Link href="/services" className="btn btn-primary">Browse all categories <ArrowRight size={16} /></Link>
            </div>
          )}

          <div style={{ marginTop: 28, border: "1px solid var(--line)", borderRadius: 17, padding: 21, display: "flex", alignItems: "start", gap: 13, background: "#fbfdfb" }}>
            <ShieldCheckIcon />
            <div>
              <strong style={{ display: "block", marginBottom: 5 }}>Honest listings. No made-up providers.</strong>
              <p className="muted" style={{ margin: 0, lineHeight: 1.65, fontSize: 13 }}>This catalogue is ready to browse, but live provider profiles, ratings, prices and availability will not be shown until they come from real, verified platform records.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "25px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", gap: 15, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: 20 }}>skiggo<span style={{ color: "var(--brand)" }}>.</span></Link>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>Skiggo · Get It Done.</p>
        </div>
      </footer>
    </main>
  );
}

function ShieldCheckIcon() {
  return <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 11, background: "#eaf7ee", color: "var(--brand)", flexShrink: 0 }}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/></svg></span>;
}
