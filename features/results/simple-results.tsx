"use client";

import Link from "next/link";
import { ArrowRight, Check, Lightbulb, Network, Plus, X } from "lucide-react";
import type { Persona, PersonaAction, Simulation, SimulationEvent, ViralityClass } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The answer, in plain words. Everything here comes from the run itself;
 * the detailed workspace stays one click away for anyone who wants it.
 */

const ANSWER: Record<ViralityClass, { title: string; tone: string; line: string }> = {
  viral: {
    title: "Likely to go viral",
    tone: "text-positive",
    line: "People are likely to watch it, share it, and the platform is likely to push it to many new viewers.",
  },
  breakout: {
    title: "Good chance to take off",
    tone: "text-positive",
    line: "It should spread beyond your own audience, but it probably won't become a huge hit.",
  },
  niche: {
    title: "Will do well with your audience",
    tone: "text-info",
    line: "The people it's made for will like it, but it probably won't spread much further.",
  },
  weak: {
    title: "Unlikely to spread",
    tone: "text-caution",
    line: "Most viewers would scroll past. Small changes to the start could make a big difference.",
  },
};

function views(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(Math.round(v));
}

function confidenceWord(c: number): string {
  return c >= 0.7 ? "High" : c >= 0.45 ? "Medium" : "Low";
}

const ACTION_LABEL: Partial<Record<PersonaAction, string>> = {
  share: "Shared it",
  comment: "Commented",
  save: "Saved it",
  like: "Liked it",
  follow: "Followed",
  watch: "Watched",
  ignore: "Scrolled past",
};

/** Plain description of a simulated decision (used when it wasn't an AI viewer's own words). */
function plainReaction(action: PersonaAction, p: Persona, topics: string[]): string {
  // Only name an interest when it genuinely relates to the video.
  const words = new Set(topics.flatMap((t) => t.toLowerCase().split(/\s+/)).filter((w) => w.length > 2));
  const match = p.interests.find((i) => i.toLowerCase().split(/\s+/).some((w) => words.has(w)));
  const other = p.interests.find((i) => i !== match);
  switch (action) {
    case "share":
      return match
        ? `They're into ${match}, so this felt made for them and they sent it on.`
        : p.isTarget
          ? "It felt made for them, so they sent it on."
          : "Not their usual thing, but good enough to send to someone.";
    case "comment":
      return "It made them want to say something, so they left a comment.";
    case "save":
      return "Useful enough to save for later.";
    case "like":
      return "They liked it, but not enough to share it.";
    case "follow":
      return "They liked it enough to follow for more.";
    case "watch":
      return "Watched some of it but didn't react.";
    default:
      return p.isTarget || !other
        ? "Scrolled past quickly. The start didn't grab them."
        : `Scrolled past. They're more into ${other}.`;
  }
}

function pickVoices(sim: Simulation): { persona: Persona; event: SimulationEvent }[] {
  const byId = new Map(sim.personas.map((p) => [p.id, p]));
  const order: PersonaAction[] = ["share", "comment", "ignore", "save", "like"];
  const picked: { persona: Persona; event: SimulationEvent }[] = [];
  const used = new Set<string>();
  for (const action of order) {
    const ev = sim.events.find(
      (e) => e.action === action && !used.has(e.personaId) && byId.has(e.personaId) && (action !== "ignore" || byId.get(e.personaId)!.isTarget),
    ) ?? sim.events.find((e) => e.action === action && !used.has(e.personaId) && byId.has(e.personaId));
    if (ev) {
      used.add(ev.personaId);
      picked.push({ persona: byId.get(ev.personaId)!, event: ev });
    }
    if (picked.length === 3) break;
  }
  return picked;
}

export function SimpleResults({
  simulation: sim,
  onWatchSpread,
  onDetails,
}: {
  simulation: Simulation;
  onWatchSpread: () => void;
  onDetails: () => void;
}) {
  const p = sim.projection;
  const ig = sim.instagram ?? null;
  const m = sim.metrics;
  // The Instagram model (sized to the creator's account) drives the answer when present.
  const cls: ViralityClass = ig?.viralityClass ?? p?.viralityClass ?? sim.verdict?.viralityClass ?? "weak";
  const answer = ANSWER[cls];
  const insights = sim.contentProfile?.insights;
  const topics = [
    ...(sim.contentProfile?.topics ?? []),
    ...(sim.contentProfile?.audience?.interests ?? []),
    ...(sim.audience.interestTags ?? []),
  ].filter((t) => t !== "everyday life");
  const vision = sim.contentProfile?.analyzedBy.startsWith("vision");
  const voices = pickVoices(sim);
  const shared = sim.events.filter((e) => e.action === "share").length;

  const strengths = insights?.strengths.length ? insights.strengths : [];
  const weaknesses = insights?.weaknesses.length ? insights.weaknesses : [];
  const tips = insights?.tips.length ? insights.tips : [];

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl space-y-10 px-6 py-10 md:px-8">
        {/* 1 — the answer */}
        <section className="panel grain relative overflow-hidden p-8 md:p-10">
          <p className="eyebrow">Your result</p>
          <h2 className={cn("mt-4 font-display text-[clamp(40px,6vw,64px)] leading-[1] tracking-[-0.02em]", answer.tone)}>
            {answer.title}
          </h2>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-foreground/85">{answer.line}</p>

          {ig ? (
            <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              <Stat value={`${Math.round(ig.viralProbability * 100)}%`} label="chance of going viral" />
              <Stat
                value={`${views(ig.views.p10)}–${views(ig.views.p90)}`}
                label={`likely views on Instagram for your account (most likely ${views(ig.views.median)})`}
              />
              <Stat value={confidenceWord(ig.calibratedConfidence)} label="how sure we are" />
            </div>
          ) : p && (
            <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              <Stat value={`${Math.round(p.viralProbability * 100)}%`} label="chance of going viral" />
              <Stat
                value={`${views(p.projectedViews.p10)}–${views(p.projectedViews.p90)}`}
                label={`likely views if about ${views(p.cohortViews)} people see it first (most likely ${views(p.projectedViews.median)})`}
              />
              <Stat value={confidenceWord(p.calibratedConfidence)} label="how sure we are" />
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {vision
              ? "Based on AI watching your video and a simulation with AI viewers."
              : "Based on measurements of your video (opening, pace, length, picture, sound) and a simulation with AI viewers. Add an AI key for a deeper look at what the video is about."}{" "}
            View numbers are estimates, not a guarantee.
          </p>
        </section>

        {/* trend: one input among many */}
        {sim.contentProfile?.trend && <TrendCard trend={sim.contentProfile.trend} />}

        {/* 2 — how Instagram would push it */}
        {ig && <InstagramPush ig={ig} />}

        {/* 3 — what happened in the test */}
        {m && (
          <section>
            <h3 className="mb-4 font-display text-[26px] leading-none">In the test</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <SmallStat value={`${m.reachedCount} of ${sim.personas.length}`} label="viewers saw it" />
              <SmallStat value={String(shared)} label="viewers shared it" />
              <SmallStat value={`${Math.round(m.targetReachPct * 100)}%`} label="of your audience saw it" />
            </div>
          </section>
        )}

        {/* 3 — why */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <section>
            <h3 className="mb-4 font-display text-[26px] leading-none">Why</h3>
            <div className="panel divide-y divide-border">
              {strengths.map((t) => (
                <Line key={t} icon={<Check className="h-3.5 w-3.5 text-positive" />} text={t} />
              ))}
              {weaknesses.map((t) => (
                <Line key={t} icon={<X className="h-3.5 w-3.5 text-caution" />} text={t} />
              ))}
            </div>
          </section>
        )}

        {/* 4 — viewers */}
        {voices.length > 0 && (
          <section>
            <h3 className="mb-4 font-display text-[26px] leading-none">How viewers reacted</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {voices.map(({ persona, event }) => {
                const ai = event.decidedBy === "agent";
                return (
                  <figure key={event.id} className="panel flex flex-col justify-between gap-5 p-5">
                    <blockquote className="text-[15px] leading-relaxed text-foreground/90">
                      {ai ? `“${event.reason}”` : plainReaction(event.action as PersonaAction, persona, topics)}
                    </blockquote>
                    <figcaption className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px]">
                          {persona.name.split(" ")[0]} {(persona.name.split(" ")[1] ?? "").slice(0, 1)}., {persona.age}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{persona.profession}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {ACTION_LABEL[event.action as PersonaAction] ?? event.action}
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        {/* 5 — make it better */}
        {tips.length > 0 && (
          <section>
            <h3 className="mb-4 font-display text-[26px] leading-none">Make it better</h3>
            <div className="panel divide-y divide-border">
              {tips.map((t) => (
                <Line key={t} icon={<Lightbulb className="h-3.5 w-3.5 text-clay" />} text={t} />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border pt-8">
          <Button asChild>
            <Link href="/simulations/new">
              <Plus />
              Test another video
            </Link>
          </Button>
          <Button variant="outline" onClick={onWatchSpread}>
            <Network />
            Watch it spread
          </Button>
          <Button variant="ghost" onClick={onDetails}>
            See full details
            <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-card p-5">
      <p className="tabular font-display text-[34px] leading-none tracking-[-0.02em]">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SmallStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="panel p-5">
      <p className="tabular text-2xl tracking-[-0.02em]">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Line({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <span className="mt-1 shrink-0">{icon}</span>
      <p className="text-[15px] leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}

const BOTTLENECK: Record<string, string> = {
  hook: "Too many people swipe away in the first 3 seconds. Instagram treats that as a strong \"not for me\" signal.",
  watch: "People stop watching before the end. Watch time is Instagram's most important signal.",
  sends: "Not many people would send it to a friend. Sends are what Instagram uses most to show Reels to non-followers.",
  likes: "It gets fewer likes than similar Reels, which matters most for showing it to your followers.",
};

const WEAKEST_NAME: Record<string, string> = {
  hook: "the first 3 seconds",
  watch: "how long people keep watching",
  sends: "how often people would send it to a friend",
  likes: "how many people would like it",
};

function InstagramPush({ ig }: { ig: NonNullable<Simulation["instagram"]> }) {
  // collapse the repeated "Platform-wide" waves into one row
  const stages = ig.stageReach.filter((s, i, arr) => i === 0 || s.label !== arr[i - 1]!.label).slice(0, 8);
  const ratio = ig.bottleneckRatio ?? (ig.bottleneck ? 0.8 : 1.3);
  const holdBack = !ig.recommendable
    ? "It looks reposted or shows another app's watermark, so Instagram won't recommend it to non-followers."
    : ig.bottleneck && ratio < 0.9
      ? BOTTLENECK[ig.bottleneck]
      : ig.bottleneck && ratio < 1.25
        ? `Nothing is far below a typical Reel, but nothing stands out either. The weakest part is ${WEAKEST_NAME[ig.bottleneck]}, which is only about average.`
        : "Nothing is holding it back. It beats a typical Reel on watch time, sends and likes.";
  return (
    <section>
      <h3 className="mb-1 font-display text-[26px] leading-none">How far Instagram would push it</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Instagram shows a Reel to some followers and a small group of strangers first. If they like it, it shows it to
        more people, again and again.
      </p>
      <div className="panel p-5 md:p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="tabular text-2xl tracking-[-0.02em]">{views(ig.followerViews)}</p>
            <p className="mt-1 text-xs text-muted-foreground">of your {views(ig.followers)} followers would see it</p>
          </div>
          <div>
            <p className="tabular text-2xl tracking-[-0.02em]">{views(ig.nonFollowerViews)}</p>
            <p className="mt-1 text-xs text-muted-foreground">non-followers would see it (most likely)</p>
          </div>
        </div>
        <div className="mt-6 space-y-2.5 border-t border-border pt-5">
          {stages.map((st, i) => (
            <div key={st.label + i} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[220px_1fr_48px]">
              <span className={cn("text-[13px]", st.probability > 0.05 ? "text-foreground" : "text-muted-foreground")}>
                {st.label}
              </span>
              <span className="tabular text-right text-xs text-muted-foreground sm:order-last">
                {Math.round(st.probability * 100)}%
              </span>
              <div className="col-span-2 h-[3px] overflow-hidden rounded-full bg-muted sm:col-span-1">
                <div className="h-full rounded-full bg-foreground/60" style={{ width: `${st.probability * 100}%` }} />
              </div>
            </div>
          ))}
          <p className="pt-1 text-[11px] text-muted-foreground">Chance it gets pushed to each step.</p>
        </div>
        <p className="mt-5 border-t border-border pt-4 text-[15px] leading-relaxed text-foreground/90">
          <span className="text-muted-foreground">What's holding it back: </span>
          {holdBack}
        </p>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Based on what Instagram has said publicly about how Reels are ranked (watch time, sends and likes) and
        distributed. It's an approximation, not Instagram's real system.
      </p>
    </section>
  );
}

const TREND_LABEL: Record<string, string> = {
  rising: "Trending now",
  peak: "At its peak",
  declining: "Fading",
  evergreen: "Always popular",
  not_trending: "Not trending",
  unknown: "Unclear",
};

function TrendCard({ trend }: { trend: NonNullable<NonNullable<Simulation["contentProfile"]>["trend"]> }) {
  const hot = trend.status === "rising" || trend.status === "peak";
  const effect =
    trend.boost >= 0.5
      ? "This gives your video a boost: trending topics are easier to share and reach people outside your niche."
      : trend.boost > 0.1
        ? "This helps a little."
        : "No boost from the topic, so the video has to win on its own.";
  return (
    <section>
      <h3 className="mb-4 font-display text-[26px] leading-none">Is the topic trending?</h3>
      <div className="panel p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]",
              hot ? "border-clay/40 bg-clay/10 text-clay" : "border-border text-muted-foreground",
            )}
          >
            {TREND_LABEL[trend.status] ?? "Trend"}
          </span>
          <span className="text-[15px] text-foreground">{trend.trendName}</span>
          <span className="tabular text-xs text-muted-foreground">strength {Math.round(trend.strength * 10)}/10</span>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">{trend.summary}</p>
        <p className="mt-2 text-sm text-muted-foreground">{effect}</p>
        {trend.sources.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
            {trend.sources.map((s) => (
              <li key={s.url} className="text-xs text-muted-foreground">
                <a href={s.url} target="_blank" rel="noreferrer" className="text-foreground/85 underline-offset-4 hover:underline">
                  {s.title}
                </a>
                {s.source ? ` · ${s.source}` : ""}
                {s.ageDays !== null ? ` · ${s.ageDays === 0 ? "today" : `${s.ageDays}d ago`}` : ""}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          Found {trend.evidence.last7Days} news results from the last 7 days ({trend.evidence.results} in total). This is one
          signal among many, not the main one.
        </p>
      </div>
    </section>
  );
}
