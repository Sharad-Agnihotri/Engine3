"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mark } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import { CascadeCanvas, cascadeStats, useCascadeNetwork } from "./cascade-canvas";
import { useInView, usePageProgress, useStickyProgress } from "./hooks";
import { Reveal } from "./reveal";

/* ───────────────────────── shared bits ───────────────────────── */

function Chapter({ n, label }: { n: string; label: string }) {
  return (
    <Reveal className="mb-8 flex items-center gap-4">
      <span className="font-mono text-[11px] tracking-[0.14em] text-clay">{n}</span>
      <span className="h-px w-10 bg-border-strong" />
      <span className="eyebrow">{label}</span>
    </Reveal>
  );
}

function Headline({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Reveal delay={80}>
      <h2
        className={cn(
          "font-display text-[clamp(44px,6.4vw,92px)] leading-[0.95] tracking-[-0.025em] text-foreground",
          className,
        )}
      >
        {children}
      </h2>
    </Reveal>
  );
}

function Body({ children, delay = 160 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <p className="mt-8 max-w-[34rem] text-[17px] leading-[1.65] text-muted-foreground">{children}</p>
    </Reveal>
  );
}

/* ───────────────────────── nav ───────────────────────── */

function Nav() {
  const p = usePageProgress();
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div
        className={cn(
          "transition-colors duration-500",
          p > 0.01 ? "border-b border-border/60 bg-background/70 backdrop-blur-xl" : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Mark className="h-6 w-6 text-foreground" />
            <span className="font-display text-[20px] leading-none tracking-[-0.01em]">
              Virality<span className="italic text-muted-foreground"> Intel</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#cascade" className="transition-colors hover:text-foreground">See it spread</a>
            <a href="#verdict" className="transition-colors hover:text-foreground">Results</a>
          </nav>
          <Button size="sm" asChild>
            <Link href="/dashboard">
              Open dashboard
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </div>
      <div className="h-px origin-left bg-clay/70" style={{ transform: `scaleX(${p})` }} />
    </header>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero() {
  const net = useCascadeNetwork(520, 11);
  return (
    <section className="grain relative flex min-h-[100svh] flex-col overflow-hidden">
      <CascadeCanvas net={net} autoplay dim className="absolute inset-0 h-full w-full opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_55%_at_50%_45%,hsl(var(--background)/0.92),hsl(var(--background)/0.35)_70%,transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-1 flex-col items-center justify-center px-6 pt-16 text-center md:px-10">
        <div className="rise">
          <p className="eyebrow mb-10">For creators, brands and marketers</p>
        </div>
        <div className="rise" style={{ "--rise-delay": "120ms" } as React.CSSProperties}>
          <h1 className="mx-auto max-w-[15ch] font-display text-[clamp(56px,10vw,148px)] leading-[0.88] tracking-[-0.035em]">
            Will your video <span className="italic text-muted-foreground">go viral?</span>
          </h1>
        </div>
        <div className="rise" style={{ "--rise-delay": "260ms" } as React.CSSProperties}>
          <p className="mx-auto mt-10 max-w-[38rem] text-[17px] leading-[1.65] text-muted-foreground">
            Find out before you post. Upload your video, we show it to thousands of AI viewers, and you see
            how far it spreads and why.
          </p>
        </div>
        <div className="rise mt-12 flex flex-wrap justify-center gap-3" style={{ "--rise-delay": "380ms" } as React.CSSProperties}>
          <Button size="lg" asChild>
            <Link href="/simulations/new">
              <Play className="!size-3.5 fill-current" />
              Test a video
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>

      <a
        href="#how"
        className="relative mx-auto mb-10 flex flex-col items-center gap-3 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="eyebrow text-[10px]">See how it works</span>
        <ArrowDown className="h-4 w-4 animate-bounce [animation-duration:2.4s]" strokeWidth={1.5} />
      </a>
    </section>
  );
}

/* ───────────────────────── how it works (overview) ───────────────────────── */

const OVERVIEW = [
  { n: "1", title: "Upload your video", body: "Any video you plan to post: a Reel, a Short, an ad or a demo." },
  { n: "2", title: "Pick your audience", body: "Choose the age group and how many AI viewers should watch it." },
  { n: "3", title: "Watch it spread", body: "See who watches it, who shares it, and where it stops." },
  { n: "4", title: "Get your answer", body: "A clear result, what viewers said, and one tip to make it better." },
];

function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">How it works</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-5 max-w-[20ch] font-display text-[clamp(40px,5vw,68px)] leading-[1] tracking-[-0.02em]">
            Four simple steps. <span className="italic text-muted-foreground">About two minutes.</span>
          </h2>
        </Reveal>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {OVERVIEW.map((s, i) => (
            <Reveal key={s.n} as="li" delay={120 + i * 90} className="bg-card p-7">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong font-mono text-sm text-clay">
                {s.n}
              </span>
              <h3 className="mt-10 text-lg tracking-[-0.01em] text-foreground">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={500} className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">Keep scrolling to see each step in action.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── I · content ───────────────────────── */

const SIGNALS = [
  { k: "Grabs attention", v: 0.82, note: "first 3 seconds" },
  { k: "Easy to follow", v: 0.71, note: "one clear message" },
  { k: "Keeps moving", v: 0.58, note: "slows down at 0:21" },
  { k: "Feels new", v: 0.76, note: "not seen before" },
  { k: "Worth sharing", v: 0.64, note: "would people send it?" },
];

function ContentChapter() {
  const [ref, shown] = useInView<HTMLDivElement>(0.35);
  return (
    <section id="content" className="relative scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto grid max-w-[1320px] items-center gap-20 px-6 md:px-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <Chapter n="Step 1" label="Upload" />
          <Headline>
            Upload <span className="italic text-muted-foreground">your video.</span>
          </Headline>
          <Body>
            We watch it first and score what matters most: does it grab attention in the first few seconds, is it
            easy to understand, and would people want to share it?
          </Body>
        </div>

        <Reveal delay={200}>
          <div ref={ref} className="panel grain relative overflow-hidden p-2">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-[linear-gradient(135deg,hsl(var(--elevated)),hsl(var(--subtle)))]">
              <div className="absolute inset-0 grid-bg opacity-40" />
              <div className="absolute left-5 top-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  launch-demo-v3.mp4
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border-strong bg-background/60 backdrop-blur">
                  <Play className="ml-0.5 h-5 w-5 fill-foreground text-foreground" />
                </div>
              </div>
              <div className="absolute inset-x-5 bottom-5">
                <div className="h-[3px] overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-foreground/70 transition-[width] [transition-duration:2400ms] ease-out"
                    style={{ width: shown ? "62%" : "0%" }}
                  />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>0:26</span>
                  <span>0:42</span>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border px-4 py-2">
              {SIGNALS.map((s, i) => (
                <div key={s.k} className="grid grid-cols-[120px_1fr_44px] items-center gap-4 py-3">
                  <div>
                    <p className="text-[13px]">{s.k}</p>
                    <p className="text-[11px] text-muted-foreground">{s.note}</p>
                  </div>
                  <div className="h-[3px] overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/60 transition-[width] [transition-duration:1400ms] ease-out"
                      style={{ width: shown ? `${s.v * 100}%` : "0%", transitionDelay: `${300 + i * 120}ms` }}
                    />
                  </div>
                  <p className="tabular text-right font-mono text-xs text-muted-foreground">{s.v.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── II · audience ───────────────────────── */

const DIMENSIONS = ["Age", "Hobbies", "Job", "Location", "How often they share", "What they like to watch"];

function AudienceChapter() {
  const [ref, shown] = useInView<HTMLDivElement>(0.3);
  const dots = Array.from({ length: 288 }, (_, i) => {
    const h = Math.sin(i * 12.9898) * 43758.5453;
    const r = h - Math.floor(h);
    return { target: r < 0.38, delay: Math.round(r * 1200) };
  });
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto grid max-w-[1320px] items-center gap-20 px-6 md:px-10 lg:grid-cols-[1fr_1fr]">
        <Reveal delay={150} className="order-2 lg:order-1">
          <div ref={ref} className="panel p-8">
            <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[6px]">
              {dots.map((d, i) => (
                <span
                  key={i}
                  className="aspect-square rounded-full transition-[background-color,transform] duration-700"
                  style={{
                    transitionDelay: `${d.delay}ms`,
                    backgroundColor: shown
                      ? d.target
                        ? "hsl(var(--info))"
                        : "hsl(var(--node-neutral) / 0.55)"
                      : "hsl(var(--border-strong))",
                    transform: shown && d.target ? "scale(1)" : "scale(0.72)",
                  }}
                />
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-info" /> Your audience
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-node-neutral" /> Everyone else
              </span>
              <span className="ml-auto font-mono text-[10px] tracking-[0.1em]">288 of 5,000 viewers shown</span>
            </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Chapter n="Step 2" label="Viewers" />
          <Headline>
            We create <span className="italic text-muted-foreground">your viewers.</span>
          </Headline>
          <Body>
            Thousands of AI viewers, each with an age, a job, hobbies and habits, connected like friends and
            followers on Instagram or YouTube. Some are exactly the people you made the video for. Most are not,
            just like a real feed.
          </Body>
          <Reveal delay={260}>
            <ul className="mt-10 flex max-w-xl flex-wrap gap-2">
              {DIMENSIONS.map((d) => (
                <li
                  key={d}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {d}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── III · cascade (sticky) ───────────────────────── */

const BEATS = [
  {
    at: 0,
    round: "Start",
    title: "It starts small.",
    body: "Just a few people see it first, the same way a real post starts.",
  },
  {
    at: 0.22,
    round: "A little later",
    title: "People share it.",
    body: "Only people who share it pass it on. Watching alone doesn't spread it, so shares are what count.",
  },
  {
    at: 0.5,
    round: "Halfway",
    title: "It reaches new groups.",
    body: "One share can carry it to a whole new group of people, even ones you didn't make it for.",
  },
  {
    at: 0.8,
    round: "The end",
    title: "It stops spreading.",
    body: "Every video stops at some point. Where it stopped shows you who it worked for, and who it didn't.",
  },
];

function CascadeChapter() {
  const net = useCascadeNetwork(460, 7);
  const [ref, progress] = useStickyProgress<HTMLElement>();
  // leave a little dwell at both ends
  const p = Math.min(1, Math.max(0, (progress - 0.06) / 0.86));
  const stats = cascadeStats(net, p);
  const beat = [...BEATS].reverse().find((b) => p >= b.at) ?? BEATS[0]!;
  const beatIndex = BEATS.indexOf(beat);

  return (
    <section id="cascade" ref={ref} className="relative h-[420vh]">
      <div className="grain sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <CascadeCanvas net={net} progress={p} align="right" className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/0.8)_30%,transparent_48%)] max-lg:bg-[linear-gradient(0deg,hsl(var(--background))_0%,hsl(var(--background)/0.85)_38%,transparent_70%)]" />

        <div className="relative mx-auto flex h-full w-full max-w-[1320px] flex-col justify-end px-6 pb-14 pt-24 md:px-10 lg:justify-center lg:pb-0">
          <div className="max-w-md">
            <div className="mb-8 flex items-center gap-4">
              <span className="font-mono text-[11px] tracking-[0.14em] text-clay">Step 3</span>
              <span className="h-px w-10 bg-border-strong" />
              <span className="eyebrow">Watch it spread</span>
            </div>
            <div className="relative min-h-[230px] lg:min-h-[260px]">
              {BEATS.map((b, i) => (
                <div
                  key={b.round}
                  className="absolute inset-0 transition-all duration-700 ease-out"
                  style={{
                    opacity: i === beatIndex ? 1 : 0,
                    transform: `translateY(${i === beatIndex ? 0 : i < beatIndex ? -16 : 16}px)`,
                  }}
                  aria-hidden={i !== beatIndex}
                >
                  <p className="font-mono text-xs text-muted-foreground">{b.round}</p>
                  <h2 className="mt-3 font-display text-[clamp(44px,5.6vw,80px)] leading-[0.95] tracking-[-0.025em]">
                    {b.title}
                  </h2>
                  <p className="mt-6 text-[16px] leading-[1.65] text-muted-foreground">{b.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-6">
              <div>
                <p className="tabular font-display text-4xl tracking-[-0.02em]">
                  {Math.round((stats.reached / stats.total) * 100)}%
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">saw it</p>
              </div>
              <div>
                <p className="tabular font-display text-4xl tracking-[-0.02em]">{stats.shared}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">shared it</p>
              </div>
              <div>
                <p className="tabular font-display text-4xl tracking-[-0.02em]">{stats.total}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">viewers</p>
              </div>
            </div>

            <div className="mt-6 flex gap-1.5">
              {BEATS.map((b, i) => (
                <span
                  key={b.round}
                  className={cn(
                    "h-[2px] flex-1 rounded-full transition-colors duration-500",
                    i <= beatIndex ? "bg-foreground/70" : "bg-border-strong",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 hidden flex-wrap justify-end gap-x-5 gap-y-2 text-[11px] text-muted-foreground md:right-10 md:flex">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-foreground" /> Saw it first</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-positive" /> Shared</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-info" /> Saw it (your audience)</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-clay" /> Saw it (others)</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-node-neutral" /> Never saw it</span>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── IV · agents ───────────────────────── */

const VOICES = [
  {
    name: "Priya, 31",
    meta: "Software engineer · Bangalore",
    action: "Shared",
    tone: "text-positive border-positive/25 bg-positive/10",
    quote: "It shows how it actually works instead of just a fancy intro. Sending this to my team.",
  },
  {
    name: "Marcus, 44",
    meta: "Business owner · Austin",
    action: "Commented",
    tone: "text-caution border-caution/25 bg-caution/10",
    quote: "Looks good, but after ten seconds I still don't know what it costs or who it's for.",
  },
  {
    name: "Léa, 26",
    meta: "Product designer · Lisbon",
    action: "Saved",
    tone: "text-mist border-mist/25 bg-mist/10",
    quote: "Saving this for later. I don't need it today, but I will.",
  },
  {
    name: "Tom, 52",
    meta: "Office manager · London",
    action: "Scrolled past",
    tone: "text-muted-foreground border-border bg-muted",
    quote: "The first line was confusing. I left before I found out what it does.",
  },
];

function AgentsChapter() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="max-w-3xl">
          <Chapter n="Step 4" label="Feedback" />
          <Headline>
            Hear what <span className="italic text-muted-foreground">they think.</span>
          </Headline>
          <Body>
            Every viewer tells you what they liked, what they didn&apos;t, and why they shared it or scrolled past.
            You don&apos;t just get a number. You get the reasons.
          </Body>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-2">
          {VOICES.map((v, i) => (
            <Reveal key={v.name} delay={i * 110}>
              <figure className="panel flex h-full flex-col justify-between gap-10 p-8">
                <blockquote className="font-display text-[26px] leading-[1.25] tracking-[-0.01em] text-foreground/90">
                  &ldquo;{v.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px]">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.meta}</p>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]", v.tone)}>
                    {v.action}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── V · verdict ───────────────────────── */

function VerdictChapter() {
  return (
    <section id="verdict" className="relative scroll-mt-16 border-y border-border bg-subtle py-24 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <Chapter n="Step 5" label="Your result" />
        <Reveal delay={80}>
          <p className="font-display text-[clamp(72px,15vw,220px)] leading-[0.82] tracking-[-0.045em]">
            Niche hit<span className="text-clay">.</span>
          </p>
        </Reveal>
        <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_1.1fr]">
          <Body delay={120}>
            This means the people you made it for loved it, but almost nobody else cared. That&apos;s not bad. You
            can make it even better for them, or change the start so it reaches more people. Every result comes with
            a clear next step.
          </Body>
          <Reveal delay={200} className="grid grid-cols-3 gap-px self-end overflow-hidden rounded-xl border border-border bg-border">
            {[
              ["64%", "of your audience saw it"],
              ["7.8%", "shared it"],
              ["31%", "of everyone saw it"],
            ].map(([v, k]) => (
              <div key={k} className="bg-card p-6">
                <p className="tabular font-display text-[44px] leading-none tracking-[-0.02em]">{v}</p>
                <p className="mt-3 text-xs text-muted-foreground">{k}</p>
              </div>
            ))}
          </Reveal>
        </div>
        <Reveal delay={280}>
          <div className="mt-6 flex items-start gap-4 rounded-xl border border-border bg-card px-6 py-5">
            <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-clay">Tip</span>
            <p className="text-[15px] leading-relaxed text-foreground/85">
              Start with what people get, not how it works. Many viewers leave after 3 seconds when the first line is hard to understand.
            </p>
          </div>
        </Reveal>
        <Reveal delay={320}>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
            Example result · your numbers will depend on your video
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── VI · learn ───────────────────────── */

function LearnChapter() {
  const [ref, shown] = useInView<HTMLDivElement>(0.35);
  const rows = [
    { k: "Version A · Starts with features", v: 4.1 },
    { k: "Version B · Starts with the benefit", v: 7.8 },
    { k: "Version C · Person talking to camera", v: 6.2 },
  ];
  const max = 10;
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto grid max-w-[1320px] items-center gap-20 px-6 md:px-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <Chapter n="Step 6" label="Improve" />
          <Headline>
            Change one thing. <span className="italic text-muted-foreground">Test again.</span>
          </Headline>
          <Body>
            Try a different first line, thumbnail or ending, and test it with the same viewers. You&apos;ll see which
            version wins. The more real results you add, the more accurate the predictions get.
          </Body>
        </div>
        <Reveal delay={180}>
          <div ref={ref} className="panel p-8">
            <div className="mb-8 flex items-baseline justify-between">
              <p className="eyebrow">How many shared it</p>
              <p className="font-mono text-[10px] text-muted-foreground">same 5,000 viewers</p>
            </div>
            <div className="space-y-7">
              {rows.map((r, i) => {
                const best = r.v === Math.max(...rows.map((x) => x.v));
                return (
                  <div key={r.k}>
                    <div className="mb-2.5 flex items-baseline justify-between text-[13px]">
                      <span className={best ? "text-foreground" : "text-muted-foreground"}>{r.k}</span>
                      <span className="tabular font-mono text-xs text-muted-foreground">{r.v.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] [transition-duration:1400ms] ease-out",
                          best ? "bg-clay/85" : "bg-foreground/30",
                        )}
                        style={{ width: shown ? `${(r.v / max) * 100}%` : "0%", transitionDelay: `${i * 160}ms` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              Version B gets almost twice as many shares. Post B, then try testing the thumbnail.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── close ───────────────────────── */

function Closing() {
  return (
    <section className="relative overflow-hidden py-28 md:py-40">
      <div className="mx-auto max-w-[1320px] px-6 text-center md:px-10">
        <Reveal>
          <h2 className="mx-auto font-display text-[clamp(56px,9vw,136px)] leading-[0.9] tracking-[-0.035em]">
            Test it <span className="italic text-muted-foreground">before</span>
            <br />
            you post it.
          </h2>
        </Reveal>
        <Reveal delay={160} className="mt-14 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/simulations/new">
              Test your first video
              <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-6 py-10 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex items-center gap-2.5">
          <Mark className="h-5 w-5 text-foreground" />
          <span>Virality Intelligence Simulator</span>
        </div>
        <nav className="flex flex-wrap gap-6">
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          <Link href="/simulations" className="hover:text-foreground">Simulations</Link>
          <Link href="/experiments" className="hover:text-foreground">Experiments</Link>
          <Link href="/calibration" className="hover:text-foreground">Calibration</Link>
          <Link href="/settings" className="hover:text-foreground">Settings</Link>
        </nav>
      </div>
    </footer>
  );
}

export function Story() {
  return (
    <div className="relative bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <ContentChapter />
        <AudienceChapter />
        <CascadeChapter />
        <AgentsChapter />
        <VerdictChapter />
        <LearnChapter />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
