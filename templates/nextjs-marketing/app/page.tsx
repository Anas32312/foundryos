import site from "../site.config.json";

const offers = [
  {
    title: "One clear offer",
    body: "Say what you do in a sentence a stranger can repeat. The rest of the page supports that sentence.",
  },
  {
    title: "Three pieces of proof",
    body: "Show the work, the way you work, and the result. Edit these cards in app/page.tsx.",
  },
  {
    title: "One next step",
    body: "Give people a single place to write. A link is enough until you connect a form.",
  },
];

const steps = [
  { name: "Name the work", detail: "Replace the title and description in site.config.json." },
  { name: "Show the practice", detail: "Swap the three cards for projects, services, or outcomes." },
  { name: "Publish the build", detail: "This starter already has a production build, metadata, and a sitemap." },
];

export default function HomePage() {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-5">
          <p className="font-[family-name:var(--font-serif)] text-lg">{site.name}</p>
          <nav aria-label="Page" className="flex gap-5 text-sm">
            <a href="#work" className="underline decoration-line underline-offset-4">
              Work
            </a>
            <a href="#approach" className="underline decoration-line underline-offset-4">
              Approach
            </a>
            <a href="#contact" className="underline decoration-line underline-offset-4">
              Contact
            </a>
          </nav>
        </div>
      </header>
      <main id="main">
        <section className="mx-auto w-full max-w-5xl px-6 py-20">
          <p className="text-sm uppercase tracking-[0.16em] text-muted">Web studio</p>
          <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-serif)] text-5xl leading-tight tracking-tight sm:text-6xl">
            {site.name}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{site.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#approach"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-paper"
            >
              See the approach
            </a>
            <a
              href="#contact"
              className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium"
            >
              Write to us
            </a>
          </div>
        </section>
        <section id="work" aria-labelledby="work-heading" className="border-t border-line">
          <div className="mx-auto grid w-full max-w-5xl gap-4 px-6 py-16 sm:grid-cols-3">
            <h2 id="work-heading" className="sr-only">
              What the site covers
            </h2>
            {offers.map((offer) => (
              <article key={offer.title} className="rounded-2xl border border-line bg-card p-6">
                <h3 className="font-[family-name:var(--font-serif)] text-2xl">{offer.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{offer.body}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="approach" aria-labelledby="approach-heading" className="border-t border-line">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <h2 id="approach-heading" className="font-[family-name:var(--font-serif)] text-3xl">
              How to make it yours
            </h2>
            <ol className="mt-8 space-y-6">
              {steps.map((step, index) => (
                <li key={step.name} className="grid gap-2 border-t border-line pt-6 sm:grid-cols-[8rem_1fr]">
                  <p className="text-sm text-muted">0{index + 1}</p>
                  <div>
                    <h3 className="text-lg font-medium">{step.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section id="contact" aria-labelledby="contact-heading" className="border-t border-line">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <h2 id="contact-heading" className="font-[family-name:var(--font-serif)] text-3xl">
              Start a conversation
            </h2>
            <p className="mt-4 max-w-xl text-muted">
              Replace this address with yours. The link is a normal email link, so the site stays
              static.
            </p>
            <a
              href="mailto:hello@example.com"
              className="mt-6 inline-flex text-lg underline decoration-line underline-offset-4"
            >
              hello@example.com
            </a>
          </div>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-muted">
          <p>{site.name}</p>
          <p>Built from the FoundryOS marketing starter.</p>
        </div>
      </footer>
    </>
  );
}
