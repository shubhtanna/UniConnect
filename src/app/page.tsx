import Link from "next/link";
import { Logo } from "@/components/Logo";

const features = [
  {
    number: "01",
    title: "Browse the class directory",
    description:
      "Explore verified student profiles and filter by skills, interests, batch, or what someone is looking for.",
    tag: "Directory",
  },
  {
    number: "02",
    title: "Ask for the exact person",
    description:
      "Describe the collaborator you need in plain language and let AI surface the most relevant classmates.",
    tag: "AI people search",
  },
  {
    number: "03",
    title: "See where you fit",
    description:
      "Discovery insights show profile interest and people whose needs overlap with what you can offer.",
    tag: "Discovery insights",
  },
  {
    number: "04",
    title: "Think together in rooms",
    description:
      "Create focused brainstorm groups around a problem, project, or industry without losing the discussion in chat noise.",
    tag: "Brainstorm rooms",
  },
  {
    number: "05",
    title: "Share useful momentum",
    description:
      "Post requests, learnings, opportunities, and progress to a community feed built for relevant campus conversations.",
    tag: "Community feed",
  },
  {
    number: "06",
    title: "Put ventures in the spotlight",
    description:
      "Give projects and businesses a dedicated showcase where classmates can discover, support, and contribute.",
    tag: "Venture showcase",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Verify your MU email",
    description: "A private network starts with a verified campus identity.",
  },
  {
    number: "02",
    title: "Claim and review your profile",
    description:
      "If your Master CV is already available, your starting profile is ready. Edit anything before publishing.",
  },
  {
    number: "03",
    title: "Add your intent",
    description:
      "Tell the network what interests you, what you are building, and who you want to meet.",
  },
  {
    number: "04",
    title: "Find the right people",
    description:
      "Browse, ask AI, connect directly, or bring a few relevant people into a brainstorm room.",
  },
] as const;

const useCases = [
  {
    label: "Find a collaborator",
    prompt: "I need a product thinker who understands consumer brands.",
    result: "Discover people by capability and intent—not popularity.",
  },
  {
    label: "Pressure-test an idea",
    prompt: "Who is interested in fintech and can challenge this concept?",
    result: "Form a focused room with classmates who bring useful context.",
  },
  {
    label: "Get discovered",
    prompt: "I can help with growth experiments and customer research.",
    result: "Make your strengths visible when someone needs them.",
  },
] as const;

function SearchPreview() {
  const results = [
    ["GM", "Growth & experimentation", "D2C · Consumer insights", "Strong fit"],
    ["PS", "Product strategy", "Research · Brand building", "Relevant"],
    ["FO", "Founder operations", "Go-to-market · Ecommerce", "Relevant"],
  ];

  return (
    <div className="relative mx-auto mt-14 w-full max-w-5xl text-left lg:mt-16">
      <div className="absolute inset-x-16 -inset-y-8 rounded-full bg-gradient-to-r from-teal/10 via-transparent to-amber/10 blur-3xl" />
      <div className="panel relative overflow-hidden p-3 shadow-card sm:p-5">
        <div className="flex items-center justify-between border-b border-line px-2 pb-4 sm:px-3">
          <div className="flex items-center gap-3">
            <span className="size-2.5 rounded-full bg-teal" />
            <span className="size-2.5 rounded-full bg-amber" />
            <span className="ml-1 text-xs font-medium text-muted">
              AI people search
            </span>
          </div>
          <span className="rounded-full border border-teal/20 bg-teal/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
            Verified profiles
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-2xl border border-line bg-app/80 p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Describe who you need
            </p>
            <p className="mt-4 text-base leading-7 text-white/90 sm:text-lg">
              Find someone interested in D2C who can help validate a consumer
              idea and run early growth experiments.
            </p>
            <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
              <span className="text-xs text-muted">
                Search by context, not keywords
              </span>
              <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-teal to-amber font-bold text-app">
                →
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {results.map(([initials, role, skills, match], index) => (
              <div
                className="group flex items-center gap-3 rounded-2xl border border-line bg-elevated p-3.5 transition-colors hover:border-teal/30 sm:gap-4 sm:p-4"
                key={role}
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal/25 to-amber/20 text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {role}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">{skills}</p>
                </div>
                <span
                  className={
                    index === 0
                      ? "hidden rounded-full border border-teal/30 bg-teal/10 px-2.5 py-1 text-[10px] font-semibold text-teal sm:block"
                      : "hidden rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-muted sm:block"
                  }
                >
                  {match}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-app text-ink">
      <section className="grid-texture relative border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-28 h-80 w-80 -translate-x-1/2 rounded-full bg-teal/10 blur-[130px]" />

        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <Logo />
          <div className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a className="transition-colors hover:text-ink" href="#why">
              Why UniConnect
            </a>
            <a className="transition-colors hover:text-ink" href="#how">
              How it works
            </a>
            <a className="transition-colors hover:text-ink" href="#features">
              Features
            </a>
          </div>
          <Link className="primary-button !min-h-10 !px-5 !py-2" href="/login">
            Sign in
          </Link>
        </nav>

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.035] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.17em] text-muted">
              <span className="size-1.5 rounded-full bg-teal shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
              The verified people layer for Masters&apos; Union
            </div>
            <h1 className="mt-7 text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl lg:text-[5.5rem]">
              Find the people already{" "}
              <span className="gradient-text">in your class.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              UniConnect helps you discover the right classmate by skills,
              interests, and intent—then turn that discovery into a useful
              conversation, project, or focused group.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link className="primary-button" href="/login">
                Continue with your MU email <span className="ml-2">→</span>
              </Link>
              <a className="secondary-button" href="#how">
                See how it works
              </a>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted">
              {[
                "Verified MU access",
                "Private source resumes",
                "Profiles stay student-controlled",
              ].map((item) => (
                <span className="flex items-center gap-2" key={item}>
                  <span className="text-teal">✓</span> {item}
                </span>
              ))}
            </div>
          </div>
          <SearchPreview />
        </div>
      </section>

      <section
        id="why"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="eyebrow">Not another social network</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              A faster way to find the right classmate at the right moment.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8 lg:justify-self-end">
            The person who can unlock your next idea may sit one classroom away.
            The hard part is knowing who they are, what they care about, and
            whether they are open to helping right now.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            [
              "Context is scattered",
              "Skills live in CVs, interests live in conversations, and active needs disappear inside group chats.",
            ],
            [
              "Intent stays invisible",
              "A profile can say what someone has done, but rarely what they want to explore or build next.",
            ],
            [
              "Good collisions get missed",
              "Without a searchable layer, useful introductions depend on luck, memory, or already knowing the room.",
            ],
          ].map(([title, copy], index) => (
            <article
              className="panel relative overflow-hidden p-6 sm:p-7"
              key={title}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-teal via-teal/40 to-amber" />
              <span className="text-xs font-semibold text-muted">
                0{index + 1}
              </span>
              <h3 className="mt-8 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-line bg-[#0d0d0d]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                From prepared profile to relevant connection.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted">
              No follower-building. No cold networking. Just enough trusted
              context to help the right people find one another.
            </p>
          </div>

          <div className="mt-12 grid overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 lg:grid-cols-4 lg:gap-px">
            {steps.map((step) => (
              <article className="bg-surface p-6 sm:p-7" key={step.number}>
                <span className="gradient-text text-sm font-bold">
                  {step.number}
                </span>
                <h3 className="mt-9 text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="eyebrow">What you can do now</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Built for discovery that leads somewhere.
            </h2>
          </div>
          <p className="max-w-lg text-base leading-7 text-muted lg:justify-self-end">
            Every feature answers one question: how do we help a useful campus
            connection happen sooner?
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              className="panel group relative min-h-64 overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-teal/30 sm:p-7"
              key={feature.title}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-teal via-teal/40 to-amber opacity-70" />
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl border border-line bg-elevated text-xs font-bold text-teal transition-colors group-hover:border-teal/30">
                  {feature.number}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {feature.tag}
                </span>
              </div>
              <h3 className="mt-10 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-[#0d0d0d]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div className="lg:sticky lg:top-10">
              <p className="eyebrow">Designed for useful collisions</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                Start with a need, not a connection count.
              </h2>
              <p className="mt-5 max-w-lg leading-7 text-muted">
                UniConnect makes both sides of discovery visible: what you can
                contribute and what you need next.
              </p>
            </div>

            <div className="space-y-4">
              {useCases.map((useCase, index) => (
                <article className="panel p-5 sm:p-7" key={useCase.label}>
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-teal/25 to-amber/20 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold">{useCase.label}</h3>
                  </div>
                  <div className="mt-5 rounded-xl border border-line bg-app px-4 py-4 text-sm leading-6 text-white/85">
                    “{useCase.prompt}”
                  </div>
                  <p className="mt-4 flex gap-2 text-sm leading-6 text-muted">
                    <span className="text-teal">↳</span> {useCase.result}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid-texture border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="eyebrow">Trust is part of the product</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Useful context, with clear boundaries.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-muted">
              UniConnect is built for a known community. It uses profile-level
              context for discovery while keeping original source documents
              private.
            </p>
          </div>
          <div className="panel grid gap-px overflow-hidden p-px sm:grid-cols-2">
            {[
              [
                "Verified access",
                "Only approved Masters' Union email accounts can enter.",
              ],
              [
                "Student-controlled",
                "Review and change prepared profile data before it represents you.",
              ],
              [
                "Private source files",
                "Original resumes are not shown in directory or people-search results.",
              ],
              [
                "View preferences",
                "Choose how profile visits appear through named or anonymous discovery settings.",
              ],
            ].map(([title, copy]) => (
              <div className="bg-surface p-6" key={title}>
                <span className="text-teal">✓</span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid-texture relative">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/10 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-6 sm:py-24">
          <p className="eyebrow">Your next useful introduction</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Stop searching across chats.{" "}
            <span className="gradient-text">Find your people here.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-muted">
            Sign in to claim your profile, explore your class, and make it
            easier for the right people to find you too.
          </p>
          <Link className="primary-button mt-9" href="/login">
            Continue with your MU email <span className="ml-2">→</span>
          </Link>
        </div>

        <footer className="relative border-t border-line px-5 py-7 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <Logo />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                className="transition-colors hover:text-white"
                href="#features"
              >
                Features
              </a>
              <Link
                className="transition-colors hover:text-white"
                href="/login"
              >
                Sign in
              </Link>
              <span>© 2026 UniConnect · Verified MU students only</span>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
